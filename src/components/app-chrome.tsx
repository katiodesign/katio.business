"use client";
import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu } from "lucide-react";
import { Modal } from "./modal";
import Sidebar from "./sidebar";
import { navigation, type NavigationRole } from "@/lib/navigation";
import { canAccess } from "@/lib/permissions";
import { readAlerts } from "@/lib/notification-actions";
import type { AlertView } from "@/lib/notification-view";
type ChromeData={name:string;email:string;roles:NavigationRole[];theme:string;alerts:AlertView[]};
const ChromeContext=createContext<ChromeData|null>(null);
export function AppChrome({children,...data}:ChromeData&{children:React.ReactNode}) {
  useEffect(()=>{const media=matchMedia("(prefers-color-scheme: dark)");const apply=()=>document.documentElement.dataset.theme=data.theme==="system"?(media.matches?"dark":"light"):data.theme;apply();media.addEventListener("change",apply);return()=>media.removeEventListener("change",apply)},[data.theme]);
  return <ChromeContext.Provider value={data}><div className="app-shell"><Sidebar name={data.name} roles={data.roles}/><main className="workspace" id="main-content">{children}</main></div></ChromeContext.Provider>;
}
export function PageHeader({children}:{children:React.ReactNode}) {return <header className="topbar">{children}<GlobalTools/></header>}
function GlobalTools(){
  const data=useContext(ChromeContext),router=useRouter();
  const [panel,setPanel]=useState<"search"|"alerts"|"profile"|"navigation"|null>(null);
  const [filter,setFilter]=useState("Todas"),[busy,setBusy]=useState(false),[error,setError]=useState("");
  if(!data)return null;
  const unread=data.alerts.filter(a=>!a.read).length;
  async function read(ids:string[],href?:string){setBusy(true);setError("");try{await readAlerts(ids);router.refresh();if(href){setPanel(null);router.push(href)}}catch{setError("No fue posible actualizar las notificaciones.")}finally{setBusy(false)}}
  return <div className="global-tools"><button className="icon-button mobile-menu-trigger" aria-label="Abrir menú" onClick={()=>setPanel("navigation")}><Menu size={20}/></button><span className="mobile-wordmark">KATIO<span>.</span></span><button className="global-search" onClick={()=>setPanel("search")}><img src="/figma/home-imgIcon11.svg" alt=""/><span>Buscar en todo el sistema…</span></button><button className="icon-button notification-trigger" title="Notificaciones" aria-label={`Notificaciones${unread?`, ${unread} sin leer`:""}`} onClick={()=>setPanel("alerts")}><img src="/figma/home-imgIcon.svg" alt=""/>{unread>0&&<img className="unread-dot" src="/figma/home-imgAlertDot.svg" alt=""/>}</button><button className="avatar profile-trigger" title="Mi perfil" aria-label="Abrir menú de perfil" onClick={()=>setPanel("profile")}>{data.name.trim().split(/\s+/).slice(0,2).map(s=>s[0]).join("").toUpperCase()}</button>
    <Modal open={panel==="search"} onClose={()=>setPanel(null)} title="Buscar en todo el sistema"><SearchPanel onNavigate={()=>setPanel(null)}/></Modal>
    <Modal open={panel==="alerts"} onClose={()=>setPanel(null)} title="Centro de notificaciones" className="notification-panel"><div className="split-row"><p className="muted">Pendientes ordenados por urgencia.</p><button className="text-link" disabled={busy||!unread} onClick={()=>read(data.alerts.filter(a=>!a.read).map(a=>a.id))}>Marcar todo como leído</button></div><div className="filter-chips">{["Todas","Sin leer","Vencimientos","Pagos","Renovaciones"].map(label=><button key={label} className={`chip ${filter===label?"active":""}`} onClick={()=>setFilter(label)}>{label}</button>)}</div>{error&&<p role="alert" className="error">{error}</p>}<div className="alert-list">{data.alerts.filter(a=>filter==="Todas"||filter==="Sin leer"&&!a.read||filter===a.category).map(a=><button key={a.id} disabled={busy} className={`alert-row ${a.read?"":"unread"}`} onClick={()=>read([a.id],a.href)}><span className="icon-circle"><img src="/figma/home-imgIcon.svg" alt=""/></span><span><strong>{a.title}</strong><small>{new Date(a.createdAt).toLocaleString("es-CO",{timeZone:"America/Bogota"})}</small></span>{!a.read&&<span className="status-dot"/>}</button>)}{!data.alerts.some(a=>filter==="Todas"||filter==="Sin leer"&&!a.read||filter===a.category)&&<p className="empty">No hay notificaciones para este filtro.</p>}</div><Link className="text-link" href="/notificaciones" onClick={()=>setPanel(null)}>Ver todas las notificaciones</Link></Modal>
    <Modal open={panel==="profile"} onClose={()=>setPanel(null)} title="Mi cuenta" className="profile-panel"><div className="profile-identity"><span className="avatar">{data.name.slice(0,2).toUpperCase()}</span><div><strong>{data.name}</strong><p className="muted">{data.email}</p></div></div><div className="profile-options"><Link href="/perfil" onClick={()=>setPanel(null)}>Mi perfil<small>Datos y preferencias</small></Link><Link href="/perfil#seguridad" onClick={()=>setPanel(null)}>Cambiar contraseña<small>Seguridad de cuenta</small></Link>{canAccess(data.roles,"audit.read")&&<Link href="/configuracion/auditoria" onClick={()=>setPanel(null)}>Auditoría<small>Acciones registradas</small></Link>}<button className="danger-text" onClick={()=>signOut({callbackUrl:"/acceso"})}>Cerrar sesión<small>Terminar sesión actual</small></button></div></Modal>
    <Modal open={panel==="navigation"} onClose={()=>setPanel(null)} title="KATIO." className="navigation-drawer"><Sidebar name={data.name} roles={data.roles} onNavigate={()=>setPanel(null)}/></Modal>
    <nav className="bottom-navigation" aria-label="Navegación móvil">{navigation.slice(0,4).filter(s=>canAccess(data.roles,s.permission)).map(s=><Link key={s.href} href={s.href}><img src={`/figma/${s.icon}`} alt=""/><span>{s.name==="Trabajos puntuales"?"Trabajos":s.name}</span></Link>)}<button onClick={()=>setPanel("navigation")}><Menu size={22}/><span>Más</span></button></nav>
  </div>;
}
type SearchGroup={name:string;items:{href:string;label:string}[]};
function SearchPanel({onNavigate}:{onNavigate:()=>void}) {
  const [q,setQ]=useState(""),[state,setState]=useState<{loading:boolean;error?:string;groups:SearchGroup[]}>({loading:false,groups:[]});const request=useRef(0);
  useEffect(()=>{const id=++request.current,controller=new AbortController();const timer=setTimeout(async()=>{if(q.trim().length<2){setState({loading:false,groups:[]});return}setState({loading:true,groups:[]});try{const response=await fetch(`/api/buscar?q=${encodeURIComponent(q)}`,{signal:controller.signal});if(!response.ok)throw Error();const json=await response.json();if(request.current===id)setState({loading:false,groups:json.groups})}catch{if(!controller.signal.aborted)setState({loading:false,groups:[],error:"No fue posible buscar. Intenta de nuevo."})}},250);return()=>{clearTimeout(timer);controller.abort()}},[q]);
  return <div className="stack"><label>Nombre o identificador<input autoFocus type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar en los módulos disponibles"/></label><div aria-live="polite">{state.loading?"Buscando…":state.error?state.error:q.trim().length<2?"Escribe al menos dos caracteres.":!state.groups.length?"No se encontraron resultados.":null}</div>{state.groups.map(g=><section key={g.name}><h3>{g.name}</h3><div className="search-results">{g.items.map(item=><Link key={item.href} href={item.href} onClick={onNavigate}>{item.label}<img src="/figma/home-imgIconChevronRight.svg" alt=""/></Link>)}</div></section>)}</div>;
}
