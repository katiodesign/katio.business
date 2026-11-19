import { PageHeader } from "@/components/app-chrome";
import { requirePermission } from "@/lib/access";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import {bogotaDay} from "@/lib/operations";
import QuoteForm from "./quote-form";
export default async function NewQuote(){
 const user=await requirePermission("quotes.create"),roles=user.roles.map(r=>r.role);
 const [items,clients]=await Promise.all([canAccess(roles,"catalog.read")?db.catalogItem.findMany({where:{active:true},select:{id:true,name:true,category:true,description:true,contractType:true,periodicity:true,price:true,isBundle:true,components:{select:{componentId:true,quantity:true,component:{select:{name:true,internalCost:true}}}}},orderBy:{name:"asc"},take:500}):[],canAccess(roles,"clients.read")?db.client.findMany({where:{archivedAt:null},select:{id:true,name:true,identification:true,email:true,phone:true,address:true},orderBy:{name:"asc"},take:500}):[]]);
 return <><PageHeader><div><small>Inicio / Cotizaciones / Nueva</small><h1>Nueva cotización</h1></div></PageHeader><QuoteForm catalog={items.map(item=>({...item,price:item.price.toString(),components:item.components.map(c=>({id:c.componentId,name:c.component.name,quantity:c.quantity.toString(),cost:canAccess(roles,"finance.read")?c.component.internalCost.toString():null}))}))} clients={clients} today={bogotaDay(new Date())}/></>;
}
