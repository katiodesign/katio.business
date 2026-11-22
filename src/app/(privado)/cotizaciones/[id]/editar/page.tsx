import {refreshCatalogPrices} from "@/lib/catalog-refresh";
import { PageHeader } from "@/components/app-chrome";
import {notFound} from "next/navigation";
import {db} from "@/lib/db";
import {bogotaDay} from "@/lib/operations";
import {requirePermission} from "@/lib/access";
import {canAccess} from "@/lib/permissions";
import QuoteForm,{type InitialQuote} from "../../nueva/quote-form";
export default async function EditQuote({params}:{params:Promise<{id:string}>}){
 const actor=await requirePermission("quotes.update"),roles=actor.roles.map(r=>r.role),{id}=await params;
 if(canAccess(roles,"catalog.read"))await refreshCatalogPrices();
 const [quote,catalog,clients]=await Promise.all([db.quote.findUnique({where:{id},include:{lines:true}}),canAccess(roles,"catalog.read")?db.catalogItem.findMany({where:{active:true},include:{components:{include:{component:true}}},orderBy:{name:"asc"},take:300}):[],canAccess(roles,"clients.read")?db.client.findMany({where:{archivedAt:null},select:{id:true,name:true,identification:true,email:true,phone:true,address:true},orderBy:{name:"asc"},take:500}):[]]);
 if(!quote||quote.deletedAt||quote.status!=="DRAFT"||quote.convertedAt||quote.paidAt)notFound();
 const initial:InitialQuote={clientId:quote.clientId||"",showBreakdown:quote.showBreakdown,issuedAt:bogotaDay(quote.issuedAt),expiresAt:quote.expiresAt?bogotaDay(quote.expiresAt):"",customerName:quote.customerName,businessName:quote.businessName||"",identification:quote.identification||"",email:quote.email||"",phone:quote.phone||"",address:quote.address||"",multiplier:quote.multiplier.toString(),discountType:quote.discountType as "FIXED"|"PERCENT",discount:quote.discount.toString(),observations:quote.observations,terms:quote.terms,lines:quote.lines.map(line=>({id:line.id,commercialComponentIds:Array.isArray(line.commercialComponents)?line.commercialComponents.flatMap(part=>part&&typeof part==="object"&&!Array.isArray(part)&&typeof part.id==="string"?[part.id]:[]):[],catalogId:line.catalogId||"",name:line.name,description:line.description,contractType:line.contractType,periodicity:line.periodicity||"",quantity:line.quantity.toString(),unitPrice:line.unitPrice.toString()}))};
 return <><PageHeader><div><small>Inicio / Cotizaciones / Editar</small><h1>Editar borrador COT-{String(quote.number).padStart(4,"0")}</h1></div></PageHeader>{quote.templateSnapshot&&<p className="notice">Al guardar, se conservará una copia de los datos anteriores y el siguiente PDF se generará con los cambios.</p>}<QuoteForm quoteId={id} initial={initial} clients={clients} catalog={catalog.map(c=>({id:c.id,name:c.name,category:c.category,description:c.description,contractType:c.contractType,periodicity:c.periodicity,price:c.price.toString(),isBundle:c.isBundle,components:c.components.map(part=>({id:part.componentId,name:part.component.name,quantity:part.quantity.toString(),cost:canAccess(roles,"finance.read")?part.component.internalCost.toString():null}))}))}/></>;
}
