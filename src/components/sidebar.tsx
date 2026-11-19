"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { canAccess } from "@/lib/permissions";
import { navigation, type NavigationRole } from "@/lib/navigation";
export default function Sidebar({name,roles,onNavigate}:{name:string;roles:NavigationRole[];onNavigate?:()=>void}) {
  const path=usePathname(),search=useSearchParams();const active=navigation.find(s=>path.startsWith(s.href));
  const [manual,setManual]=useState<{path:string;section:string}|null>(null);
  const expanded=manual?.path===path?manual.section:active?.href||"";
  const current=`${path}${search.size?`?${search.toString()}`:""}`;
  return <aside className="sidebar"><Link href="/inicio" className="side-logo" onClick={onNavigate}>KATIO<span>.</span><small>Business</small></Link><nav aria-label="Navegación principal">{navigation.filter(s=>canAccess(roles,s.permission)).map(s=><div key={s.href}><div className={`nav-row ${active?.href===s.href?"selected":""}`}><Link href={s.href} onClick={onNavigate}><img src={`/figma/${s.icon}`} alt=""/>{s.name}</Link><button title={`${expanded===s.href?"Cerrar":"Desplegar"} ${s.name}`} aria-label={`${expanded===s.href?"Cerrar":"Desplegar"} ${s.name}`} aria-expanded={expanded===s.href} onClick={()=>setManual({path,section:expanded===s.href?"":s.href})}><img src={`/figma/home-imgIconChevron${expanded===s.href?"Down":"Right"}.svg`} alt=""/></button></div>{expanded===s.href&&<div className="submenu">{s.sub.filter(sub=>!sub.permission||canAccess(roles,sub.permission)).map(sub=><Link key={sub.href} href={sub.href} aria-current={current===sub.href?"page":undefined} onClick={onNavigate}>{sub.name}</Link>)}{active?.href===s.href&&!s.sub.some(sub=>sub.href===path)&&path!==s.href&&<Link href={current} aria-current="page" onClick={onNavigate}>{path.endsWith("/editar")?"Editar":"Detalle"}</Link>}</div>}</div>)}</nav><div className="profile"><span className="avatar">{name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()}</span><span><Link href="/perfil" onClick={onNavigate}><strong>{name}</strong></Link></span></div></aside>;
}

