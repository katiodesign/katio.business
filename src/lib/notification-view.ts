import { db } from "@/lib/db";
import { syncNotifications, visibleNotificationPrefixes } from "@/lib/notifications";
import type { NavigationRole } from "@/lib/navigation";
export type AlertView={id:string;title:string;href:string;read:boolean;createdAt:string;category:string};
export async function notificationView(userId:string,roles:NavigationRole[]):Promise<AlertView[]> {
  const alerts=await syncNotifications(roles),prefixes=visibleNotificationPrefixes(roles);
  if(!prefixes.length)return [];
  const links=new Map(alerts.map(a=>[a.dedupeKey,a.href]));
  const rows=await db.notification.findMany({where:{resolvedAt:null,OR:prefixes.map(prefix=>({dedupeKey:{startsWith:prefix}}))},include:{reads:{where:{userId}}},orderBy:{createdAt:"desc"},take:100});
  return rows.map(row=>({id:row.id,title:row.title,href:links.get(row.dedupeKey)||"/inicio",read:!!row.reads.length,createdAt:row.createdAt.toISOString(),category:row.dedupeKey.startsWith("subscription-due-")?"Renovaciones":row.dedupeKey.startsWith("payment-")?"Pagos":"Vencimientos"}));
}
