"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { clientSchema } from "@/lib/schemas";
import { encryptSecret, decryptSecret } from "@/lib/secrets";

const idSchema = z.cuid();
export async function updateClient(clientId: string, form: FormData) {
  const actor = await requirePermission("clients.update"); const id = idSchema.parse(clientId);
  const data = clientSchema.parse(Object.fromEntries(form));
  await db.$transaction(async tx => {
    await tx.client.update({ where: { id, archivedAt: null }, data: { name: data.name, identification: data.identification || null, email: data.email || null, phone: data.phone || null, address: data.address || null } });
    await tx.auditLog.create({ data: { userId: actor.id, action: "UPDATE", entity: "Client", entityId: id } });
  });
  redirect(`/clientes/${id}`);
}
export async function archiveClient(clientId: string) {
  const actor = await requirePermission("clients.update"); const id = idSchema.parse(clientId);
  await db.$transaction(async tx => {
    await tx.client.update({ where: { id, archivedAt: null }, data: { archivedAt: new Date() } });
    await tx.auditLog.create({ data: { userId: actor.id, action: "ARCHIVE", entity: "Client", entityId: id } });
  });
  redirect("/clientes");
}
export async function createCredential(clientId: string, form: FormData) {
  const actor = await requirePermission("credentials.write"); const id = idSchema.parse(clientId);
  const data = z.object({ service: z.string().trim().min(2).max(180), username: z.string().trim().max(250), secret: z.string().min(1).max(10000), subscriptionId: z.union([z.literal(""), z.cuid()]) }).parse(Object.fromEntries(form));
  const encryptedSecret = encryptSecret(data.secret);
  const details = z.object({url:z.string().trim().max(2000),credentialType:z.enum(["PASSWORD","TOKEN","OTHER"]),accessStatus:z.enum(["ACTIVE","INACTIVE","PENDING"]),notes:z.string().max(5000),customFields:z.array(z.object({name:z.string().trim().min(1).max(100),value:z.string().max(2000)})).max(30)}).parse({url:form.get("url")||"",credentialType:form.get("credentialType")||"PASSWORD",accessStatus:form.get("accessStatus")||"ACTIVE",notes:form.get("notes")||"",customFields:JSON.parse(String(form.get("customFields")||"[]"))});
  const encryptedDetails=encryptSecret(JSON.stringify(details));
  await db.$transaction(async tx => {
    if (data.subscriptionId) {
      const belongs = await tx.subscription.count({ where: { id: data.subscriptionId, clientId: id } });
      if (!belongs) throw new Error("La contratación no pertenece al cliente.");
    }
    const credential = await tx.credential.create({ data: { clientId: id, service: data.service, username: data.username || null, encryptedSecret, encryptedDetails, subscriptionId: data.subscriptionId || null } });
    await tx.auditLog.create({ data: { userId: actor.id, action: "CREATE", entity: "Credential", entityId: credential.id } });
  });
  revalidatePath(`/clientes/${id}`); if(data.subscriptionId)revalidatePath(`/contrataciones/${data.subscriptionId}`);
  redirect(form.get("returnTo")==="subscription" && data.subscriptionId ? `/contrataciones/${data.subscriptionId}` : `/clientes/${id}?tab=credenciales`);
}
export async function revealCredential(credentialId: string) {
  const actor = await requirePermission("credentials.reveal");
  const credential = await db.credential.findUniqueOrThrow({ where: { id: idSchema.parse(credentialId) } });
  await db.auditLog.create({ data: { userId: actor.id, action: "REVEAL", entity: "Credential", entityId: credential.id } });
  return decryptSecret(credential.encryptedSecret);
}

export async function updateCredential(credentialId:string,form:FormData) {
 const actor=await requirePermission("credentials.write"),id=idSchema.parse(credentialId);
 const data=z.object({service:z.string().trim().min(2).max(180),username:z.string().trim().max(250),secret:z.string().max(10000),returnTo:z.enum(["client","subscription"])}).parse(Object.fromEntries(form));
 const credential=await db.$transaction(async tx=>{const current=await tx.credential.findUniqueOrThrow({where:{id}});const updated=await tx.credential.update({where:{id},data:{service:data.service,username:data.username||null,...(data.secret?{encryptedSecret:encryptSecret(data.secret)}:{})}});await tx.auditLog.create({data:{userId:actor.id,action:"UPDATE",entity:"Credential",entityId:id,metadata:{passwordChanged:!!data.secret}}});return {...updated,subscriptionId:current.subscriptionId}});
 revalidatePath(`/clientes/${credential.clientId}`);if(credential.subscriptionId)revalidatePath(`/contrataciones/${credential.subscriptionId}`);
 redirect(data.returnTo==="subscription"&&credential.subscriptionId?`/contrataciones/${credential.subscriptionId}`:`/clientes/${credential.clientId}?tab=credenciales`);
}
export async function deleteCredential(credentialId:string,form:FormData) {
 const actor=await requirePermission("credentials.write"),id=idSchema.parse(credentialId);if(form.get("confirm")!=="DELETE")throw new Error("Confirma la eliminación de la credencial.");const returnTo=z.enum(["client","subscription"]).parse(form.get("returnTo"));
 const credential=await db.$transaction(async tx=>{const current=await tx.credential.delete({where:{id}});await tx.auditLog.create({data:{userId:actor.id,action:"DELETE",entity:"Credential",entityId:id,metadata:{clientId:current.clientId,subscriptionId:current.subscriptionId}}});return current});
 revalidatePath(`/clientes/${credential.clientId}`);if(credential.subscriptionId)revalidatePath(`/contrataciones/${credential.subscriptionId}`);
 redirect(returnTo==="subscription"&&credential.subscriptionId?`/contrataciones/${credential.subscriptionId}`:`/clientes/${credential.clientId}?tab=credenciales`);
}

export async function revealCredentialDetails(credentialId:string) {
 const actor=await requirePermission("credentials.reveal"); const credential=await db.credential.findUniqueOrThrow({where:{id:idSchema.parse(credentialId)}});
 await db.auditLog.create({data:{userId:actor.id,action:"REVEAL_DETAILS",entity:"Credential",entityId:credential.id}});
 return credential.encryptedDetails?JSON.parse(decryptSecret(credential.encryptedDetails)):null;
}

