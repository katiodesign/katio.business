"use server";
import {redirect} from "next/navigation";
import {compare,hash} from "bcryptjs";
import {z} from "zod";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/access";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
export async function updatePreferences(form:FormData){const actor=await requireUser();const theme=z.enum(["system","light","dark"]).parse(form.get("theme"));await db.user.update({where:{id:actor.id},data:{theme}});(await cookies()).set("katio-theme",theme,{sameSite:"lax",httpOnly:true,path:"/",maxAge:31536000});revalidatePath("/","layout")}
export async function changeMyPassword(form:FormData){const actor=await requireUser();const data=z.object({current:z.string().min(1),next:z.string().min(14).max(128),confirm:z.string()}).parse(Object.fromEntries(form));if(data.next!==data.confirm)throw new Error("Las contraseñas nuevas no coinciden.");if(!await compare(data.current,actor.passwordHash))throw new Error("La contraseña actual es incorrecta.");const passwordHash=await hash(data.next,12);await db.$transaction(async tx=>{await tx.user.update({where:{id:actor.id},data:{passwordHash,sessionVersion:{increment:1}}});await tx.auditLog.create({data:{userId:actor.id,action:"PASSWORD_CHANGE",entity:"User",entityId:actor.id}})});redirect("/acceso")}
