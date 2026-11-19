import {db} from "@/lib/db";
import {canAccess} from "@/lib/permissions";
import {getGeneralSettings} from "@/lib/app-settings";
import {bogotaDay} from "@/lib/operations";
type Role={name:string;permissions:{permission:{key:string}}[]};
export async function syncNotifications(roles:Role[]){
  const now=new Date(),today=new Date(`${bogotaDay(now)}T00:00:00-05:00`);
  const settings=await getGeneralSettings();
  const workCutoff=new Date(today.getTime()+(settings.workAlertDays+1)*86400000);
  const subscriptionCutoff=new Date(now.getTime()+settings.subscriptionAlertDays*86400000);
  const allowWork=canAccess(roles,"work.read"),allowSubs=canAccess(roles,"subscriptions.read"),allowQuotes=canAccess(roles,"quotes.read");
  const [works,subs,quotes]=await Promise.all([
    allowWork?db.workItem.findMany({where:{status:{not:"FINISHED"},dueAt:{lt:workCutoff}},select:{id:true,name:true,dueAt:true}}):[],
    allowSubs?db.subscription.findMany({where:{status:{not:"CANCELLED"}},include:{tasks:true}}):[],
    allowQuotes?db.quote.findMany({where:{status:"SENT",deletedAt:null,issuedAt:{lt:new Date(now.getTime()-settings.quoteAlertDays*86400000)}},select:{id:true,number:true}}):[],
  ]);
  const alerts=[...works.map(w=>({dedupeKey:`work-${w.id}`,title:`Trabajo ${w.dueAt&&w.dueAt<today?"vencido":"próximo"}: ${w.name}`,href:`/trabajos/${w.id}`})),...subs.filter(s=>s.nextDueAt<subscriptionCutoff).map(s=>({dedupeKey:`subscription-due-${s.id}`,title:`Cobro ${s.nextDueAt<now?"vencido":"próximo"}: ${s.name}`,href:`/contrataciones/${s.id}`})),...subs.filter(s=>s.status==="PENDING_SETUP"||s.tasks.some(t=>t.status!=="DONE"&&t.status!=="CONFIGURED")).map(s=>({dedupeKey:`subscription-setup-${s.id}`,title:`Configuración pendiente: ${s.name}`,href:`/contrataciones/${s.id}`})),...quotes.map(q=>({dedupeKey:`quote-${q.id}`,title:`Cotización sin respuesta: COT-${String(q.number).padStart(4,"0")}`,href:`/cotizaciones/${q.id}`}))];
  await db.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(724015)`;
    for(const alert of alerts){const current=await tx.notification.findUnique({where:{dedupeKey:alert.dedupeKey}});if(!current)await tx.notification.create({data:{dedupeKey:alert.dedupeKey,title:alert.title}});else if(current.resolvedAt||current.title!==alert.title){await tx.notification.update({where:{id:current.id},data:{title:alert.title,readAt:null,resolvedAt:null}});await tx.notificationRead.deleteMany({where:{notificationId:current.id}})}}
    for(const prefix of [allowWork?"work-":null,allowSubs?"subscription-":null,allowQuotes?"quote-":null].filter(Boolean) as string[]){await tx.notification.updateMany({where:{resolvedAt:null,dedupeKey:{startsWith:prefix,notIn:alerts.map(a=>a.dedupeKey)}},data:{resolvedAt:now}})}
  });
  return alerts;
}
export function visibleNotificationPrefixes(roles:Role[]){return [canAccess(roles,"work.read")?"work-":null,canAccess(roles,"subscriptions.read")?"subscription-":null,canAccess(roles,"quotes.read")?"quote-":null].filter(Boolean) as string[]}
