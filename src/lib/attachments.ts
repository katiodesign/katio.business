import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink, readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import type { PermissionKey } from "@/lib/permissions";

export const entities = {
  CLIENT: { read: "clients.read", write: "clients.update", table: "client" },
  QUOTE: { read: "quotes.read", write: "quotes.update", table: "quote" },
  INVOICE: { read: "invoices.read", write: "invoices.create", table: "invoice" },
  WORK: { read: "work.read", write: "work.update", table: "workItem" },
  SUBSCRIPTION: { read: "subscriptions.read", write: "subscriptions.update", table: "subscription" },
  EXPENSE: { read: "expenses.read", write: "expenses.update", table: "operatingExpense" },
} as const;
export type EntityType = keyof typeof entities;
export const storageRoot = () => path.resolve(process.cwd(), process.env.STORAGE_PATH || "./private-storage");
export const attachmentPath = (storageKey: string) => path.join(storageRoot(), storageKey);
export async function readAttachment(storageKey: string) { if (!/^[a-f0-9-]{36}$/.test(storageKey)) throw new Error("Archivo inválido."); return readFile(attachmentPath(storageKey)); }
function inspect(file: File, bytes: Buffer) {
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "pdf" && bytes.subarray(0,5).toString() === "%PDF-") return "application/pdf";
  if (extension === "png" && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "image/png";
  if ((extension === "jpg" || extension === "jpeg") && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (extension === "webp" && bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP") return "image/webp";
  throw new Error("Se aceptan PDF, PNG, JPG y WEBP válidos.");
}
export async function preparePaymentReceipt(file: File) {
  const maxMb = Number(process.env.MAX_ATTACHMENT_MB || "10");
  if (!Number.isInteger(maxMb) || maxMb < 1 || maxMb > 100 || !file.size || file.size > maxMb * 1_000_000) throw new Error("Tamaño de comprobante no válido.");
  const bytes=Buffer.from(await file.arrayBuffer());
  const mimeType=inspect(file,bytes),storageKey=randomUUID();
  const originalName=path.basename(file.name).replace(/[\r\n"\\/]/g,"_").slice(0,180);
  await mkdir(storageRoot(),{recursive:true}); await writeFile(attachmentPath(storageKey),bytes,{flag:"wx"});
  return {storageKey,originalName,mimeType,size:bytes.length};
}
export async function storeAttachment(entityType: EntityType, entityId: string, file: File) {
  const actor = await requirePermission(entities[entityType].write as PermissionKey);
  const maxMb = Number(process.env.MAX_ATTACHMENT_MB || "10");
  if (!Number.isInteger(maxMb) || maxMb < 1 || maxMb > 100) throw new Error("MAX_ATTACHMENT_MB debe estar entre 1 y 100.");
  if (!file.size || file.size > maxMb * 1_000_000) throw new Error(`El archivo debe tener hasta ${maxMb} MB.`);
  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = inspect(file,bytes);
  const exists = await (async()=>{switch(entityType){case "CLIENT":return db.client.count({where:{id:entityId}});case "QUOTE":return db.quote.count({where:{id:entityId,deletedAt:null}});case "INVOICE":return db.invoice.count({where:{id:entityId}});case "WORK":return db.workItem.count({where:{id:entityId}});case "SUBSCRIPTION":return db.subscription.count({where:{id:entityId}});case "EXPENSE":return db.operatingExpense.count({where:{id:entityId}})}})();
  if (!exists) throw new Error("El registro no existe.");
  const storageKey = randomUUID(); const originalName = path.basename(file.name).replace(/[\r\n"\\/]/g,"_").slice(0,180);
  await mkdir(storageRoot(),{recursive:true});
  await writeFile(attachmentPath(storageKey),bytes,{flag:"wx"});
  try { await db.$transaction(async tx=>{const attachment=await tx.attachment.create({data:{entityType,entityId,originalName,storageKey,mimeType,size:bytes.length}});await tx.auditLog.create({data:{userId:actor.id,action:"UPLOAD",entity:"Attachment",entityId:attachment.id,metadata:{entityType,recordId:entityId}}})}); }
  catch(error){await unlink(attachmentPath(storageKey)).catch(()=>{});throw error}
}
