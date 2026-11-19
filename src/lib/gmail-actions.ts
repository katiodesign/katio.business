"use server";
import {redirect} from "next/navigation";
import {z} from "zod";
import {db} from "@/lib/db";
import {requirePermission} from "@/lib/access";
import {encryptSecret} from "@/lib/secrets";
import {getGmailConfig,verifyGmail} from "@/lib/gmail";

export async function saveGmail(form:FormData){
 const actor=await requirePermission("settings.manage");
 const email=z.string().trim().email().max(254).refine(value=>/@gmail\.com$/i.test(value),"Usa una cuenta personal de Gmail.").parse(form.get("email")).toLowerCase();
 const password=z.string().max(128).parse(form.get("password")||"").replace(/\s/g,"");
 if(password&&!/^[a-zA-Z]{16}$/.test(password))throw new Error("La contraseña de aplicación de Google debe tener 16 letras.");
 await db.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(294602)`;
  const record=await tx.appSetting.findUnique({where:{key:"GMAIL"}});
  const value=record?.value&&typeof record.value==="object"&&!Array.isArray(record.value)?record.value as Record<string,unknown>:null;
  const previousEmail=typeof value?.email==="string"?value.email:"";
  const previousPassword=typeof value?.encryptedPassword==="string"?value.encryptedPassword:"";
  if(!password&&(!previousPassword||previousEmail!==email))throw new Error("Introduce una contraseña de aplicación para esta cuenta.");
  const config={email,encryptedPassword:password?encryptSecret(password):previousPassword};
  await tx.appSetting.upsert({where:{key:"GMAIL"},create:{key:"GMAIL",value:config},update:{value:config}});
  await tx.auditLog.create({data:{userId:actor.id,action:"UPDATE",entity:"AppSetting",entityId:"GMAIL"}});
 });
 redirect("/configuracion/correo?estado=guardado");
}
export async function checkGmail(){
 await requirePermission("settings.manage");
 const config=await getGmailConfig();let ok=false;
 if(config)try{await verifyGmail(config);ok=true}catch{}
 redirect(`/configuracion/correo?estado=${ok?"conectado":"error"}`);
}
export async function removeGmail(){
 const actor=await requirePermission("settings.manage");
 await db.$transaction(async tx=>{await tx.$executeRaw`SELECT pg_advisory_xact_lock(294602)`;await tx.appSetting.deleteMany({where:{key:"GMAIL"}});await tx.auditLog.create({data:{userId:actor.id,action:"DELETE",entity:"AppSetting",entityId:"GMAIL"}})});
 redirect("/configuracion/correo?estado=eliminado");
}
