"use server";
import {redirect} from "next/navigation";
import {z} from "zod";
import {db} from "@/lib/db";
import {requirePermission} from "@/lib/access";
import {defaultGeneralSettings,generalSettingsSchema} from "@/lib/app-settings";
const archivedSchema=z.array(z.object({module:z.enum(["catalog","expenses"]),name:z.string()})).max(500);
export async function changeCategory(form:FormData){
 const actor=await requirePermission("settings.manage");
 const data=z.object({module:z.enum(["catalog","expenses"]),operation:z.enum(["create","rename","archive","restore"]),name:z.string().trim().min(2).max(100),previous:z.string().trim().max(100).optional()}).parse(Object.fromEntries(form));
 await db.$transaction(async tx=>{await tx.$executeRaw`SELECT pg_advisory_xact_lock(921913)`;const [generalRecord,archiveRecord]=await Promise.all([tx.appSetting.findUnique({where:{key:"GENERAL"}}),tx.appSetting.findUnique({where:{key:"ARCHIVED_CATEGORIES"}})]);const general=generalSettingsSchema.safeParse(generalRecord?.value),settings=general.success?general.data:defaultGeneralSettings;const archivedResult=archivedSchema.safeParse(archiveRecord?.value);let archived=archivedResult.success?archivedResult.data:[];const key=data.module==="catalog"?"catalogCategories":"expenseCategories",categories=[...settings[key]],same=(a:string,b:string)=>a.toLocaleLowerCase("es-CO")===b.toLocaleLowerCase("es-CO");
 if(data.operation==="create"||data.operation==="restore"){if(categories.some(n=>same(n,data.name)))throw new Error("Ya existe una categoría activa con ese nombre.");if(categories.length>=30)throw new Error("Solo se permiten 30 categorías activas por módulo.");categories.push(data.name);archived=archived.filter(a=>a.module!==data.module||!same(a.name,data.name))}
 if(data.operation==="rename"){const index=categories.findIndex(n=>same(n,data.previous||""));if(index<0)throw new Error("La categoría ya no está activa.");if(categories.some((n,i)=>i!==index&&same(n,data.name)))throw new Error("Ya existe una categoría activa con ese nombre.");categories[index]=data.name}
 if(data.operation==="archive"){const index=categories.findIndex(n=>same(n,data.name));if(index<0)throw new Error("La categoría ya no está activa.");const [name]=categories.splice(index,1);if(!archived.some(a=>a.module===data.module&&same(a.name,name)))archived.push({module:data.module,name})}
 await tx.appSetting.upsert({where:{key:"GENERAL"},create:{key:"GENERAL",value:{...settings,[key]:categories}},update:{value:{...settings,[key]:categories}}});await tx.appSetting.upsert({where:{key:"ARCHIVED_CATEGORIES"},create:{key:"ARCHIVED_CATEGORIES",value:archived},update:{value:archived}});await tx.auditLog.create({data:{userId:actor.id,action:`CATEGORY_${data.operation.toUpperCase()}`,entity:"AppSetting",entityId:"GENERAL",metadata:{module:data.module,name:data.name}}})});redirect("/configuracion/categorias");
}
