import { PageHeader } from "@/components/app-chrome";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { requirePermission } from "@/lib/access";
import { date } from "@/lib/format";
import { notificationView } from "@/lib/notification-view";
import { markNotificationRead,openNotification,readAlerts } from "@/lib/notification-actions";
export default async function Notifications({searchParams}:{searchParams:Promise<{filter?:string}>}) {
 const actor=await requirePermission("dashboard.read"),roles=actor.roles.map(r=>r.role),params=await searchParams;
 const alerts=await notificationView(actor.id,roles),filter=["all","unread","Vencimientos","Pagos","Renovaciones"].includes(params.filter||"")?params.filter!:"all";
 const items=alerts.filter(a=>filter==="all"||filter==="unread"&&!a.read||a.category===filter);
 const chips=[{id:"all",name:"Todas"},{id:"unread",name:"Sin leer"},{id:"Vencimientos",name:"Vencimientos"},{id:"Pagos",name:"Pagos"},{id:"Renovaciones",name:"Renovaciones"}];
 return <><PageHeader><div><small>Inicio / Notificaciones</small><h1>Notificaciones</h1></div></PageHeader><div className="page-title"><div><h2>Notificaciones</h2><p>Pendientes ordenados por urgencia.</p></div></div><section className="card section-card"><div className="split-row"><h3>Centro de notificaciones</h3>{alerts.some(a=>!a.read)&&<form action={readAlerts.bind(null,alerts.filter(a=>!a.read).map(a=>a.id))}><button className="text-link">Marcar todo como leído</button></form>}</div><nav className="filter-chips" aria-label="Filtros de notificaciones">{chips.map(c=><Link key={c.id} className={`chip ${filter===c.id?"active":""}`} href={`/notificaciones?filter=${c.id}`}>{c.name}<small>{alerts.filter(a=>c.id==="all"||c.id==="unread"&&!a.read||a.category===c.id).length}</small></Link>)}</nav><div className="notification-list">{items.map(row=><div className={`notification-entry ${row.read?"":"unread"}`} key={row.id}><span className="icon-circle"><Clock3 size={18}/></span><div><form action={openNotification.bind(null,row.id)}><button className="notification-open"><strong>{row.title}</strong></button></form><p className="muted">{date(new Date(row.createdAt))} · {row.read?"Leída":"Nueva"}</p></div>{!row.read&&<form action={markNotificationRead.bind(null,row.id)}><button className="text-link">Marcar leída</button></form>}</div>)}{!items.length&&<p className="empty">No hay alertas para este filtro.</p>}</div></section></>;
}
