"use server";
import { catalogPricingInputsSchema } from "@/lib/schemas";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { clientSchema, catalogSchema, quoteSchema } from "@/lib/schemas";
import { calculateQuote } from "@/lib/money";
import { canAccess } from "@/lib/permissions";
import { z } from "zod";
import { bogotaDay } from "@/lib/operations";
import { Prisma } from "@/generated/prisma/client";
import { preservedCommercialComponents } from "@/lib/quote-breakdown";
async function commercialLines(tx:Prisma.TransactionClient,lines:z.infer<typeof quoteSchema>["lines"],canReadCatalog:boolean,previous:{catalogId:string|null;commercialComponents:unknown}[]=[]) {
 return Promise.all(lines.map(async line=>{const {commercialComponentIds=[],...rest}=line;const ids=[...new Set(commercialComponentIds)];if(ids.length!==commercialComponentIds.length)throw new Error("Los componentes comerciales deben ser únicos.");if(ids.length&&!canReadCatalog)return {...rest,catalogId:line.catalogId||null,periodicity:line.contractType==="RECURRING"?line.periodicity||null:null,commercialComponents:preservedCommercialComponents(line.catalogId,ids,previous)};const parts=ids.length&&line.catalogId?await tx.catalogBundleComponent.findMany({where:{bundleId:line.catalogId,componentId:{in:ids}},include:{component:{select:{name:true}}}}):[];if(parts.length!==ids.length)throw new Error("Un componente comercial no corresponde al producto seleccionado.");return {...rest,catalogId:line.catalogId||null,periodicity:line.contractType==="RECURRING"?line.periodicity||null:null,commercialComponents:parts.map(part=>({id:part.componentId,name:part.component.name,quantity:part.quantity.toString()}))};}));
}

export async function createClient(form: FormData) {
  const user = await requirePermission("clients.create"); const data = clientSchema.parse(Object.fromEntries(form));
  await db.$transaction(async (tx) => { const c = await tx.client.create({ data: { ...data, identification: data.identification || null, email: data.email || null, phone: data.phone || null, address: data.address || null } }); await tx.auditLog.create({ data: { userId: user.id, action: "CREATE", entity: "Client", entityId: c.id } }); });
  redirect("/clientes");
}
export async function createCatalogItem(form: FormData) {
  const user = await requirePermission("catalog.create"); const raw = Object.fromEntries(form); if (!canAccess(user.roles.map(r => r.role), "finance.read")) raw.internalCost = "0"; const data = catalogSchema.parse(raw); const pricingInputs = canAccess(user.roles.map(r => r.role), "finance.read") && raw.pricingHours !== undefined ? catalogPricingInputsSchema.parse(raw) : null;
  await db.$transaction(async (tx) => { const c = await tx.catalogItem.create({ data: { ...data, ...(pricingInputs || {}), pricingManual:pricingInputs ? form.get("pricingManual")==="on" : true, periodicity: data.contractType === "RECURRING" ? data.periodicity || null : null } }); await tx.auditLog.create({ data: { userId: user.id, action: "CREATE", entity: "CatalogItem", entityId: c.id } }); });
  redirect("/catalogo");
}
export async function createQuote(form: FormData) {
  const user = await requirePermission("quotes.create"); const raw = Object.fromEntries(form); let lines: unknown;
  try { lines = JSON.parse(String(raw.lines ?? "")); } catch { throw new Error("Las líneas de cotización no son válidas."); }
  const data = quoteSchema.parse({ ...raw, lines });
  const amounts = calculateQuote(data.lines, data.multiplier, data.discountType, data.discount);
  if(data.expiresAt && data.expiresAt < (data.issuedAt || bogotaDay(new Date()))) throw new Error("El vencimiento no puede ser anterior a la emisión.");
  const created=await db.$transaction(async (tx) => { if(data.clientId){if(!canAccess(user.roles.map(r=>r.role),"clients.read"))throw new Error("No tienes permiso para seleccionar clientes.");const client=await tx.client.findFirst({where:{id:data.clientId,archivedAt:null},select:{id:true}});if(!client)throw new Error("El cliente ya no está disponible")} const prepared=await commercialLines(tx,data.lines,canAccess(user.roles.map(r=>r.role),"catalog.read")); const q = await tx.quote.create({ data: { showBreakdown:form.get("showBreakdown")==="yes",clientId:data.clientId||null, customerName: data.customerName, businessName: data.businessName || null, identification: data.identification || null, email: data.email || null, phone: data.phone || null, address: data.address || null, ...(data.issuedAt ? {issuedAt:new Date(`${data.issuedAt}T12:00:00-05:00`)} : {}), expiresAt:data.expiresAt ? new Date(`${data.expiresAt}T12:00:00-05:00`) : null, multiplier: data.multiplier, discountType: data.discountType, discount: data.discount, subtotal: amounts.subtotal.toFixed(2), total: amounts.total.toFixed(2), observations: data.observations, terms: data.terms, lines: { create: prepared } } }); await tx.auditLog.create({ data: { userId: user.id, action: "CREATE", entity: "Quote", entityId: q.id } }); return q.id; });
  redirect(form.get("intent")==="pdf"?`/cotizaciones/${created}?pdf=confirm`:"/cotizaciones");
}

export async function duplicateQuote(id: string) {
  const user = await requirePermission("quotes.create");
  await requirePermission("quotes.read");
  const validId = z.string().cuid().parse(id);
  const copyId = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${validId}))`;
    const source = await tx.quote.findUniqueOrThrow({ where: { id: validId }, include: { lines: true } });
    if (source.deletedAt) throw new Error("La cotización fue eliminada.");
    const copy = await tx.quote.create({ data: {
      customerName: source.customerName, businessName: source.businessName, showBreakdown:source.showBreakdown, clientId: source.clientId, identification: source.identification,
      email: source.email, phone: source.phone, address: source.address, multiplier: source.multiplier,
      discountType: source.discountType, discount: source.discount, subtotal: source.subtotal, total: source.total,
      observations: source.observations, terms: source.terms,
      lines: { create: source.lines.map(line => ({ catalogId: line.catalogId, ...(Array.isArray(line.commercialComponents)?{commercialComponents:line.commercialComponents}:{}), name: line.name, description: line.description, contractType: line.contractType, periodicity: line.periodicity, quantity: line.quantity, unitPrice: line.unitPrice })) }
    } });
    await tx.auditLog.create({ data: { userId: user.id, action: "DUPLICATE", entity: "Quote", entityId: copy.id, metadata: { sourceId: source.id } } });
    return copy.id;
  });
  redirect(canAccess(user.roles.map(role => role.role), "quotes.update")
    ? `/cotizaciones/${copyId}/editar`
    : `/cotizaciones/${copyId}`);
}

export async function updateQuote(id:string,form:FormData){const actor=await requirePermission("quotes.update");const validId=z.cuid().parse(id);const raw=Object.fromEntries(form);let lines:unknown;try{lines=JSON.parse(String(raw.lines??""))}catch{throw new Error("Las líneas de cotización no son válidas.")}const data=quoteSchema.parse({...raw,lines});const amounts=calculateQuote(data.lines,data.multiplier,data.discountType,data.discount);if(data.issuedAt&&data.expiresAt&&data.expiresAt<data.issuedAt)throw new Error("El vencimiento no puede ser anterior a la emisión.");await db.$transaction(async tx=>{await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${validId}))`;const original=await tx.quote.findUniqueOrThrow({where:{id:validId},include:{lines:true}});if(original.deletedAt||original.status!=="DRAFT"||original.convertedAt||original.paidAt)throw new Error("Solo se editan borradores activos sin pago ni conversión.");if(data.expiresAt&&data.expiresAt<(data.issuedAt||bogotaDay(original.issuedAt)))throw new Error("El vencimiento no puede ser anterior a la emisión.");if(data.clientId&&data.clientId!==original.clientId){if(!canAccess(actor.roles.map(r=>r.role),"clients.read"))throw new Error("No tienes permiso para seleccionar clientes.");const client=await tx.client.findFirst({where:{id:data.clientId,archivedAt:null},select:{id:true}});if(!client)throw new Error("El cliente ya no está disponible.")}const prepared=await commercialLines(tx,data.lines,canAccess(actor.roles.map(r=>r.role),"catalog.read"),original.lines);if(original.templateSnapshot){await tx.auditLog.create({data:{userId:actor.id,action:"QUOTE_REVISION",entity:"Quote",entityId:validId,metadata:JSON.parse(JSON.stringify({previous:original}))}})}await tx.quoteLine.deleteMany({where:{quoteId:validId}});await tx.quote.update({where:{id:validId},data:{...(original.templateSnapshot?{templateSnapshot:Prisma.DbNull}:{}),...(data.clientId!==undefined&&data.clientId!==original.clientId?{client:data.clientId?{connect:{id:data.clientId}}:{disconnect:true}}:{}),customerName:data.customerName,businessName:data.businessName||null,showBreakdown:form.get("showBreakdown")==="yes",identification:data.identification||null,email:data.email||null,phone:data.phone||null,address:data.address||null,...(data.issuedAt?{issuedAt:new Date(`${data.issuedAt}T12:00:00-05:00`)}:{}),...(data.expiresAt!==undefined?{expiresAt:data.expiresAt?new Date(`${data.expiresAt}T12:00:00-05:00`):null}:{}),multiplier:data.multiplier,discountType:data.discountType,discount:data.discount,subtotal:amounts.subtotal.toFixed(2),total:amounts.total.toFixed(2),observations:data.observations,terms:data.terms,lines:{create:prepared}}});await tx.auditLog.create({data:{userId:actor.id,action:"UPDATE",entity:"Quote",entityId:validId}})});redirect(`/cotizaciones/${validId}${form.get("intent")==="pdf"?"?pdf=confirm":""}`)}

