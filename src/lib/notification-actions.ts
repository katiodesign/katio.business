"use server";
import {redirect} from "next/navigation";
import {z} from "zod";
import {db} from "@/lib/db";
import {requirePermission} from "@/lib/access";
import {visibleNotificationPrefixes,syncNotifications} from "@/lib/notifications";
import { requireUser } from "@/lib/access";
import { revalidatePath } from "next/cache";
export async function readAlerts(ids:string[]) {
  const actor=await requireUser(),prefixes=visibleNotificationPrefixes(actor.roles.map(r=>r.role));
  const parsed=z.array(z.cuid()).max(100).parse(ids);
  if(!prefixes.length)return;
  const rows=await db.notification.findMany({where:{id:{in:parsed},resolvedAt:null,OR:prefixes.map(prefix=>({dedupeKey:{startsWith:prefix}}))},select:{id:true}});
  await db.notificationRead.createMany({data:rows.map(row=>({userId:actor.id,notificationId:row.id})),skipDuplicates:true});
  revalidatePath("/","layout");
}
export async function markNotificationRead(id:string){const actor=await requirePermission("dashboard.read");const item=await db.notification.findUniqueOrThrow({where:{id:z.cuid().parse(id)}});if(item.resolvedAt||!visibleNotificationPrefixes(actor.roles.map(r=>r.role)).some(prefix=>item.dedupeKey.startsWith(prefix)))throw new Error("No tienes acceso a esta alerta.");await db.notificationRead.upsert({where:{userId_notificationId:{userId:actor.id,notificationId:item.id}},create:{userId:actor.id,notificationId:item.id},update:{}});redirect("/notificaciones")}
export async function openNotification(id:string){
 const actor=await requirePermission("dashboard.read"),roles=actor.roles.map(r=>r.role);
 const item=await db.notification.findUniqueOrThrow({where:{id:z.cuid().parse(id)}});
 if(item.resolvedAt||!visibleNotificationPrefixes(roles).some(prefix=>item.dedupeKey.startsWith(prefix)))throw new Error("No tienes acceso a esta alerta.");
 const alerts=await syncNotifications(roles),target=alerts.find(alert=>alert.dedupeKey===item.dedupeKey)?.href;
 if(!target)redirect("/notificaciones");
 await db.notificationRead.upsert({where:{userId_notificationId:{userId:actor.id,notificationId:item.id}},create:{userId:actor.id,notificationId:item.id},update:{}});
 redirect(target);
}
