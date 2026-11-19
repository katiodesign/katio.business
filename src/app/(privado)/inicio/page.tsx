import {statusColor} from "@/lib/status-color";
import DismissibleNotice from "@/components/dismissible-notice";
import Link from "next/link";
import Decimal from "decimal.js";
import { PageHeader } from "@/components/app-chrome";
import { HomeGreeting, HomeMonthPicker } from "./home-controls";
import { FilePlus2, FilePenLine, ReceiptText, CircleDollarSign, BriefcaseBusiness, Repeat2, Activity } from "lucide-react";
import { requirePermission } from "@/lib/access";
import { db } from "@/lib/db";
import { canAccess } from "@/lib/permissions";
import { monthlyEquivalent } from "@/lib/money";
import { workUrgency, bogotaDay } from "@/lib/operations";
import { cop, date } from "@/lib/format";
const labels={PENDING:"Pendiente",IN_PROGRESS:"En diseño",SENT_TO_CLIENT:"Enviado al cliente",IN_CORRECTION:"En corrección",APPROVED:"Aprobado",FINISHED:"Terminado"};
export default async function Dashboard({searchParams}:{searchParams:Promise<{month?:string;filter?:string}>}) {
 const actor=await requirePermission("dashboard.read"),roles=actor.roles.map(r=>r.role),params=await searchParams,now=new Date();
 const month=/^\d{4}-(0[1-9]|1[0-2])$/.test(params.month||"")?params.month!:bogotaDay(now).slice(0,7);
 const start=new Date(`${month}-01T00:00:00-05:00`),end=new Date(start);end.setUTCMonth(end.getUTCMonth()+1);
 const finance=canAccess(roles,"finance.read");
 const [works,subs,quotes,payments,milestones,renewals,expenses,activity]=await Promise.all([
 canAccess(roles,"work.read")?db.workItem.findMany({where:{status:{not:"FINISHED"}},include:{milestones:true}}):[],
 canAccess(roles,"subscriptions.read")?db.subscription.findMany({where:{status:{not:"CANCELLED"}},include:{tasks:true,client:true},orderBy:{nextDueAt:"asc"}}):[],
 canAccess(roles,"quotes.read")?db.quote.findMany({where:{deletedAt:null,status:"SENT"},orderBy:{issuedAt:"asc"},take:20}):[],
 finance?db.quotePayment.findMany({where:{paidAt:{gte:start,lt:end}}}):[],
 finance?db.paymentMilestone.findMany({where:{paidAt:{gte:start,lt:end}},include:{workItem:{select:{sourceLineId:true}}}}):[],
 finance?db.subscriptionEvent.findMany({where:{kind:"RENEWED"},select:{data:true}}):[],
 finance&&canAccess(roles,"expenses.read")?db.operatingExpense.findMany({where:{active:true,deletedAt:null}}):[],
 canAccess(roles,"audit.read")?db.auditLog.findMany({where:{action:{not:"DENIED"}},orderBy:{createdAt:"desc"},take:5}):[]]);
 const sourceIds=milestones.filter(m=>m.sequence===1).map(m=>m.workItem.sourceLineId);
 const quoteLines=sourceIds.length?await db.quoteLine.findMany({where:{id:{in:sourceIds}},select:{id:true}}):[];
 const linked=new Set(quoteLines.map(l=>l.id));
 let income=payments.reduce((sum,p)=>sum.plus(p.amount.toString()),new Decimal(0));
 for(const p of milestones)if(p.sequence===2||!linked.has(p.workItem.sourceLineId))income=income.plus(p.amount.toString());
 for(const event of renewals){const d=event.data as Record<string,string>|null;if(d?.paidAt){const paid=new Date(`${d.paidAt}T12:00:00-05:00`);if(paid>=start&&paid<end)income=income.plus(d.amount||0)}}
 const expense=expenses.reduce((sum,e)=>sum.plus(monthlyEquivalent(e.amount.toString(),e.periodicity)),new Decimal(0));
 const unpaid=finance?await db.paymentMilestone.findMany({where:{paidAt:null},select:{amount:true}}):[];
 const balance=unpaid.reduce((sum,p)=>sum.plus(p.amount.toString()),new Decimal(0));
 const cards=[{label:"Ingresos del período",value:income,icon:14,note:"Cifra de gestión interna · COP"},{label:"Gastos operativos (equiv. mensual)",value:expense,icon:16,note:"Equivalente mensual · no es un pago real"},{label:"Balance estimado del período",value:income.minus(expense),icon:18,note:"Cifra de gestión interna · COP"},{label:"Pagos pendientes por recibir",value:balance,icon:19,note:`${unpaid.length} cobros pendientes`}];
 const pending=[...works.sort((a,b)=>workUrgency(a.dueAt,a.status,now)-workUrgency(b.dueAt,b.status,now)).map(w=>({id:w.id,name:w.name,customer:w.customerName,status:labels[w.status],tone:statusColor(w.status),urgency:["Vencido","Hoy","Próximo","Sin fecha","Terminado"][workUrgency(w.dueAt,w.status,now)],when:w.dueAt?date(w.dueAt):"—",href:`/trabajos/${w.id}`,kind:"Trabajos"})),...subs.map(s=>({id:s.id,name:s.name,customer:s.client.name,status:s.tasks.some(t=>t.status!=="CONFIGURED"&&t.status!=="DONE")?"Pend. de configuración":"Próxima a vencer",tone:"warning",urgency:"Renovar",when:date(s.nextDueAt),href:`/contrataciones/${s.id}`,kind:"Renovaciones"})),...quotes.map(q=>({id:q.id,name:`Cotización COT-${String(q.number).padStart(4,"0")} sin respuesta`,customer:q.customerName,status:"Enviada",tone:"info",urgency:"Seguimiento",when:date(q.issuedAt),href:`/cotizaciones/${q.id}`,kind:"Cotizaciones"}))];
 const filter=params.filter||"Todos",visible=pending.filter(p=>filter==="Todos"||filter==="Vencidos"&&p.urgency==="Vencido"||filter==="Hoy"&&p.urgency==="Hoy"||filter===p.kind);
 const routes:Record<string,string>={Quote:"cotizaciones",WorkItem:"trabajos",Subscription:"contrataciones",Client:"clientes",Invoice:"facturacion",CatalogItem:"catalogo",OperatingExpense:"gastos"};
 const activityInfo=(entity:string,action:string)=>{if(action.includes("PAY")||action==="RENEWED")return {Icon:CircleDollarSign,label:"Pago registrado"};if(entity==="Quote")return action==="CREATE"?{Icon:FilePlus2,label:"Cotización creada"}:{Icon:FilePenLine,label:"Cotización actualizada"};if(entity==="Invoice")return {Icon:ReceiptText,label:"Factura emitida"};if(entity==="WorkItem")return {Icon:BriefcaseBusiness,label:"Trabajo actualizado"};if(entity==="Subscription")return {Icon:Repeat2,label:action==="CREATE"?"Contratación creada":"Contratación actualizada"};return {Icon:Activity,label:"Actividad registrada"}};
 return <div className="home-page"><PageHeader><div><small>Centro de control</small><h1>Inicio</h1></div></PageHeader><div className="page-title"><HomeGreeting initialTime={now.toISOString()}/><div className="form-actions"><HomeMonthPicker month={month}/>{canAccess(roles,"quotes.create")&&<Link className="button primary" href="/cotizaciones/nueva"><img src="/figma/home-imgIcon12.svg" alt=""/>Nueva cotización</Link>}</div></div><DismissibleNotice><div className="home-notice"><img src="/figma/home-imgIcon13.svg" alt=""/><div>Cifras de gestión interna<p>Los importes son referencias operativas de gestión; no representan utilidad contable ni fiscal certificada.</p></div></div></DismissibleNotice>{finance&&<div className="stat-grid home-metrics">{cards.map(c=><article className="card stat" key={c.label}><div><span className="icon-circle"><img src={`/figma/home-imgIcon${c.icon}.svg`} alt=""/></span>{c.label}</div><strong>{cop(c.value.toString())}</strong><small>{c.note}</small></article>)}</div>}<div className="home-columns"><section className="card section-card" id="pendientes"><div className="split-row"><h3>Pendientes prioritarios</h3><small className="text-link">Ordenado por urgencia</small></div><div className="filter-chips">{["Todos","Vencidos","Hoy","Renovaciones"].map(f=><Link key={f} className={`chip ${filter===f?"active":""}`} href={`/inicio?${new URLSearchParams({month,filter:f})}`}>{f}<small>{pending.filter(p=>f==="Todos"||f==="Vencidos"&&p.urgency==="Vencido"||f==="Hoy"&&p.urgency==="Hoy"||f===p.kind).length}</small></Link>)}</div><div className="pending-list">{visible.map(p=><article className="pending-row" key={p.id}><span className={`badge ${p.urgency==="Vencido"?"danger":p.urgency==="Hoy"?"warning":"info"}`}>{p.urgency}</span><div className="pending-name"><strong>{p.name}</strong><small>{p.customer}</small></div><span className={`badge ${p.tone}`}>{p.status}</span><time>{p.when}</time><Link href={p.href}><img src="/figma/home-imgIconChevronRight.svg" alt=""/>Abrir</Link></article>)}{!visible.length&&<p className="empty">No hay pendientes para este filtro.</p>}</div></section><aside className="stack"><section className="card section-card" id="actividad"><div className="split-row"><h3>Actividad reciente</h3>{canAccess(roles,"audit.read")&&<Link className="text-link" href="/configuracion/auditoria">Ver todo</Link>}</div>{activity.map(a=>{const {Icon,label}=activityInfo(a.entity,a.action);return <div className="activity-row" key={a.id}><span className="icon-circle"><Icon size={18} aria-hidden="true"/></span><div>{routes[a.entity]&&a.entityId?<Link href={`/${routes[a.entity]}/${a.entityId}`}>{label}</Link>:<span>{label}</span>}<small>{date(a.createdAt)}</small></div><img src="/figma/home-imgIcon22.svg" alt=""/></div>})}{!activity.length&&<p className="empty">Sin actividad reciente disponible.</p>}</section><section className="card section-card quick-actions"><h3>Accesos rápidos</h3>{canAccess(roles,"quotes.create")&&<Link className="button secondary wide" href="/cotizaciones/nueva">Nueva cotización</Link>}{canAccess(roles,"finance.create")&&<Link className="button secondary wide" href="/facturacion">Registrar pago</Link>}{canAccess(roles,"work.update")&&<Link className="button secondary wide" href="/trabajos/nuevo">Nuevo trabajo</Link>}</section></aside></div></div>;
}


