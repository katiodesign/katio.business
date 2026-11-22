import "server-only";
import Decimal from "decimal.js";
import {db} from "@/lib/db";
import {pricingSettingsSchema,catalogHourlyPrice} from "@/lib/pricing";
import {monthlyEquivalent} from "@/lib/money";

/** Refresh only catalog reference values; issued documents retain their stored values. */
export async function refreshCatalogPrices(){
 await db.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('catalog-pricing-refresh'))`;
  const [setting,expenses]=await Promise.all([tx.appSetting.findUnique({where:{key:"PRICING"}}),tx.operatingExpense.findMany({where:{active:true,deletedAt:null},select:{amount:true,periodicity:true}})]);
  const parsed=pricingSettingsSchema.safeParse(setting?.value);
  const monthlyExpenses=expenses.reduce((sum,e)=>sum.plus(monthlyEquivalent(e.amount.toString(),e.periodicity)),new Decimal(0)).toFixed(2);
  const settings=parsed.success?{...parsed.data,monthlyExpenses}:null;
  const items=await tx.catalogItem.findMany({where:{isBundle:false,pricingHours:{not:null},pricingDirectCost:{not:null}}});
  for(const item of items){if(!settings)break;const result=catalogHourlyPrice(item.pricingHours!.toString(),item.pricingDirectCost!.toString(),settings);if((!item.pricingManual&&!item.price.eq(result.price))||!item.internalCost.eq(result.cost))await tx.catalogItem.update({where:{id:item.id},data:{...(item.pricingManual?{}:{price:result.price}),internalCost:result.cost}})}
  const bundles=await tx.catalogItem.findMany({where:{isBundle:true},include:{components:{include:{component:true}}}});
  for(const b of bundles){const subtotal=b.components.reduce((sum,c)=>sum.plus(c.component.price.toString().length?new Decimal(c.component.price.toString()).mul(c.quantity.toString()):0),new Decimal(0));const cost=b.components.reduce((sum,c)=>sum.plus(new Decimal(c.component.internalCost.toString()).mul(c.quantity.toString())),new Decimal(0));const price=subtotal.mul(b.bundleFactor.toString()).toFixed(2);if((!b.pricingManual&&!b.price.eq(price))||!b.internalCost.eq(cost.toFixed(2)))await tx.catalogItem.update({where:{id:b.id},data:{...(b.pricingManual?{}:{price}),internalCost:cost.toFixed(2)}})}
 },{timeout:30000});
}
