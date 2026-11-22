"use client";
import {useEffect,useRef} from "react";
import {MoreHorizontal} from "lucide-react";
import type {ReactNode} from "react";
export default function RowActions({label,children}:{label:string;children:ReactNode}){
 const ref=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{const close=(event:PointerEvent)=>{if(ref.current&&!ref.current.contains(event.target as Node))ref.current.open=false};const key=(event:KeyboardEvent)=>{if(event.key==="Escape"&&ref.current?.open){ref.current.open=false;ref.current.querySelector("summary")?.focus()}};document.addEventListener("pointerdown",close);document.addEventListener("keydown",key);return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",key)}},[]);
 return <details ref={ref} className="row-actions"><summary role="button" className="row-icon" aria-label={label} title="Acciones"><MoreHorizontal size={20}/></summary><div className="row-actions-menu">{children}</div></details>;
}
