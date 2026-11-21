"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { canAccess } from "@/lib/permissions";
import { catalogSchema } from "@/lib/schemas";

const idSchema = z.cuid();
export async function deleteCatalogItem(itemId:string,form:FormData){
 const actor=await requirePermission("catalog.update"),id=idSchema.parse(itemId);
 if(form.get("confirm")!=="DELETE")throw new Error("Confirma la eliminación del elemento.");
 await db.$transaction(async tx=>{
  const item=await tx.catalogItem.findUniqueOrThrow({where:{id},select:{name:true}});
  const [quotes,bundles]=await Promise.all([tx.quoteLine.count({where:{catalogId:id}}),tx.catalogBundleComponent.count({where:{componentId:id}})]);
  if(quotes||bundles)throw new Error("Este elemento está vinculado a cotizaciones o productos compuestos. Puedes desactivarlo para conservar el historial.");
  await tx.catalogBundleComponent.deleteMany({where:{bundleId:id}});
  await tx.catalogItem.delete({where:{id}});
  await tx.auditLog.create({data:{userId:actor.id,action:"DELETE",entity:"CatalogItem",entityId:id,metadata:{name:item.name}}});
 });
 redirect("/catalogo");
}
export async function updateCatalogItem(itemId: string, form: FormData) {
  const actor = await requirePermission("catalog.update"); const id = idSchema.parse(itemId);
  const raw = Object.fromEntries(form); const canSeeCost = canAccess(actor.roles.map(r=>r.role),"finance.read");
  if (!canSeeCost) raw.internalCost = "0";
  const data = catalogSchema.parse(raw);
  await db.$transaction(async tx => {
    await tx.catalogItem.update({where:{id},data:{name:data.name,description:data.description,category:data.category,contractType:data.contractType,periodicity:data.contractType==="RECURRING"?data.periodicity||null:null,price:data.price,...(canSeeCost?{internalCost:data.internalCost}:{})}});
    await tx.auditLog.create({data:{userId:actor.id,action:"UPDATE",entity:"CatalogItem",entityId:id}});
  });
  redirect(`/catalogo/${id}`);
}
export async function setCatalogActive(itemId:string,form:FormData){const actor=await requirePermission("catalog.update");const active=z.enum(["true","false"]).parse(form.get("active"))==="true";const id=idSchema.parse(itemId);await db.$transaction(async tx=>{await tx.catalogItem.update({where:{id},data:{active}});await tx.auditLog.create({data:{userId:actor.id,action:active?"ACTIVATE":"ARCHIVE",entity:"CatalogItem",entityId:id}})});redirect(`/catalogo/${id}`)}
export async function duplicateCatalogItem(itemId:string){const actor=await requirePermission("catalog.create");await requirePermission("catalog.read");const id=idSchema.parse(itemId);const canSeeCost=canAccess(actor.roles.map(r=>r.role),"finance.read");const copy=await db.$transaction(async tx=>{const original=await tx.catalogItem.findUniqueOrThrow({where:{id},include:{components:true}});const item=await tx.catalogItem.create({data:{name:`${original.name} (copia)`,description:original.description,category:original.category,contractType:original.contractType,periodicity:original.periodicity,price:original.price,internalCost:canSeeCost?original.internalCost:0,isBundle:original.isBundle,components:{create:original.components.map(c=>({componentId:c.componentId,quantity:c.quantity}))}}});await tx.auditLog.create({data:{userId:actor.id,action:"DUPLICATE",entity:"CatalogItem",entityId:item.id,metadata:{sourceId:id}}});return item});redirect(`/catalogo/${copy.id}`)}
export async function createBundle(form:FormData){const actor=await requirePermission("catalog.create");const raw=Object.fromEntries(form);if(!canAccess(actor.roles.map(r=>r.role),"finance.read"))raw.internalCost="0";const data=catalogSchema.parse(raw);const componentIds=form.getAll("component").map(value=>idSchema.parse(String(value)));const manual=z.array(z.object({id:z.string().uuid(),name:z.string().trim().min(2).max(180),quantity:z.string().regex(/^[1-9]\d*$/),contractType:z.enum(["ONE_TIME","RECURRING"]),periodicity:z.enum(["","MONTHLY","QUARTERLY","YEARLY"]),price:z.string().regex(/^\d+(\.\d{1,2})?$/),description:z.string().trim().max(5000)}).refine(component=>component.contractType!=="RECURRING"||!!component.periodicity)).max(100).parse(JSON.parse(String(form.get("manualComponents")||"[]")));if((!componentIds.length&&!manual.length)||new Set(componentIds).size!==componentIds.length)throw new Error("Selecciona componentes únicos.");const quantities=componentIds.map(id=>z.string().regex(/^[1-9]\d*$/, "La cantidad debe ser un número entero positivo.").parse(form.get(`qty_${id}`)));if(quantities.some(q=>Number(q)<=0))throw new Error("Las cantidades deben ser positivas.");await db.$transaction(async tx=>{const components=await tx.catalogItem.findMany({where:{id:{in:componentIds},active:true,isBundle:false}});if(components.length!==componentIds.length)throw new Error("Un componente no está disponible.");const manualItems=await Promise.all(manual.map(component=>tx.catalogItem.create({data:{name:component.name,category:data.category,contractType:component.contractType,periodicity:component.contractType==="RECURRING"?(component.periodicity||null):null,price:component.price,description:component.description,internalCost:0}})));const item=await tx.catalogItem.create({data:{name:data.name,description:data.description,category:data.category,contractType:data.contractType,periodicity:data.contractType==="RECURRING"?data.periodicity||null:null,price:data.price,internalCost:data.internalCost,isBundle:true,components:{create:[...componentIds.map((id,index)=>({componentId:id,quantity:quantities[index]})),...manualItems.map((part,index)=>({componentId:part.id,quantity:manual[index].quantity}))]}}});await tx.auditLog.create({data:{userId:actor.id,action:"CREATE",entity:"CatalogBundle",entityId:item.id}})});redirect("/catalogo")}
