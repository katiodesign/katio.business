"use client";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { type?: "date" | "month"; onValueChange?: (value:string, input:HTMLInputElement)=>void };
const pad=(n:number)=>String(n).padStart(2,"0");
const subscribe=()=>()=>{};
function localToday(){const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const read=(type:string)=>parts.find(p=>p.type===type)?.value||"";return `${read("year")}-${read("month")}-${read("day")}`}
function formatValue(value:string,type:"date"|"month") {if(!value)return type==="month"?"Seleccionar mes":"Seleccionar fecha";const [year,month,day]=value.split("-").map(Number);const date=new Date(Date.UTC(year,month-1,day||1));return new Intl.DateTimeFormat("es-CO",type==="month"?{year:"numeric",month:"long",timeZone:"UTC"}:{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"}).format(date)}
export default function DatePicker({type="date",value,defaultValue,onChange,onValueChange,min,max,required,disabled,...props}:Props){
 const hydrated=useSyncExternalStore(subscribe,()=>true,()=>false);
 const input=useRef<HTMLInputElement>(null),root=useRef<HTMLSpanElement>(null),popoverId=useId();
 const initial=String(value??defaultValue??""),[selected,setSelected]=useState(initial),[open,setOpen]=useState(false),[view,setView]=useState(()=>{const [y,m]=String(value||defaultValue||localToday()).split("-").map(Number);return {year:y,month:m}});
 const current=value===undefined?selected:String(value||"");
 useEffect(()=>{if(!open)return;const panel=root.current?.closest("dialog"),popover=root.current?.querySelector<HTMLElement>(".date-popover");if(!panel||!popover)return;const frame=requestAnimationFrame(()=>{const delta=popover.getBoundingClientRect().bottom-panel.getBoundingClientRect().bottom+20;if(delta>0)panel.scrollBy({top:delta,behavior:"smooth"})});return()=>cancelAnimationFrame(frame)},[open]);
 useEffect(()=>{if(!open)return;const dismiss=(event:MouseEvent)=>{if(root.current&&!root.current.contains(event.target as Node))setOpen(false)};const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.stopPropagation();setOpen(false);root.current?.querySelector<HTMLButtonElement>(".date-trigger")?.focus()}};document.addEventListener("mousedown",dismiss);document.addEventListener("keydown",escape,true);return()=>{document.removeEventListener("mousedown",dismiss);document.removeEventListener("keydown",escape,true)}},[open]);
 const choose=(next:string)=>{const el=input.current;if(!el)return;setSelected(next);const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set;setter?.call(el,next);el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));onValueChange?.(next,el);setOpen(false);root.current?.querySelector<HTMLButtonElement>(".date-trigger")?.focus()};
 const changeMonth=(delta:number)=>setView(v=>{const d=new Date(Date.UTC(v.year,v.month-1+delta,1));return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1}});
 const heading=new Intl.DateTimeFormat("es-CO",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(view.year,view.month-1,1)));
 const first=new Date(Date.UTC(view.year,view.month-1,1)),offset=(first.getUTCDay()+6)%7,count=new Date(Date.UTC(view.year,view.month,0)).getUTCDate();
 const allowed=(next:string)=>(!min||next>=String(min))&&(!max||next<=String(max));
 return <span className={`date-picker ${type==="month"?"date-picker-month":""}`} ref={root}>
   <input {...props} ref={input} className="date-native" type={type} value={value} defaultValue={value===undefined?defaultValue:undefined} min={min} max={max} required={required} disabled={disabled} onChange={event=>{setSelected(event.currentTarget.value);onChange?.(event)}}/>
   <button type="button" className={`date-trigger ${current?"":"date-placeholder"}`} disabled={disabled||!hydrated} aria-expanded={open} aria-controls={popoverId} aria-label={type==="month"?"Elegir mes":"Elegir fecha"} onClick={event=>{event.preventDefault();const [year,month]=String(current||localToday()).split("-").map(Number);setView({year,month});setOpen(v=>!v)}}><CalendarDays size={19} aria-hidden="true"/><span>{formatValue(current,type)}</span></button>
   {open&&<span className="date-popover" id={popoverId} role="dialog" aria-label={type==="month"?"Seleccionar mes":"Seleccionar fecha"}>
     <span className="date-popover-head"><button type="button" aria-label={type==="month"?"Año anterior":"Mes anterior"} onClick={()=>type==="month"?setView(v=>({...v,year:v.year-1})):changeMonth(-1)}><ChevronLeft size={18}/></button><strong>{type==="month"?view.year:heading}</strong><button type="button" aria-label={type==="month"?"Año siguiente":"Mes siguiente"} onClick={()=>type==="month"?setView(v=>({...v,year:v.year+1})):changeMonth(1)}><ChevronRight size={18}/></button></span>
     {type==="month"?<span className="date-month-grid">{Array.from({length:12},(_,i)=>{const next=`${view.year}-${pad(i+1)}`,label=new Intl.DateTimeFormat("es-CO",{month:"short",timeZone:"UTC"}).format(new Date(Date.UTC(view.year,i,1)));return <button type="button" key={next} disabled={!allowed(next)} className={current===next?"selected":""} onClick={()=>choose(next)}>{label}</button>})}</span>:<><span className="date-weekdays">{["L","M","M","J","V","S","D"].map((d,i)=><span key={i}>{d}</span>)}</span><span className="date-days">{Array.from({length:offset},(_,i)=><span key={`empty-${i}`}/>)}{Array.from({length:count},(_,i)=>{const next=`${view.year}-${pad(view.month)}-${pad(i+1)}`;return <button type="button" key={next} disabled={!allowed(next)} className={`${current===next?"selected":""} ${localToday()===next?"today":""}`} aria-label={formatValue(next,"date")} onClick={()=>choose(next)}>{i+1}</button>})}</span></>}
     <span className="date-footer">{!required&&<button type="button" onClick={()=>choose("")}>Limpiar</button>}<button type="button" disabled={!allowed(type==="month"?localToday().slice(0,7):localToday())} onClick={()=>choose(type==="month"?localToday().slice(0,7):localToday())}>Hoy</button></span>
   </span>}
 </span>;
}
