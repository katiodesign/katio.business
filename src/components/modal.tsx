"use client";
import { useEffect, useRef, useId } from "react";
import { X } from "lucide-react";
export function Modal({open,onClose,title,children,className=""}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode;className?:string}) {
  const ref=useRef<HTMLDialogElement>(null), id=useId();
  useEffect(()=>{const dialog=ref.current;if(!dialog)return;if(open){dialog.showModal();return()=>{dialog.close()}}},[open]);
  return <dialog ref={ref} className={`dialog ${className}`} aria-labelledby={id} onCancel={event=>{event.preventDefault();onClose()}}><div className="dialog-heading"><h2 id={id}>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar" title="Cerrar"><X size={20}/></button></div>{open&&children}</dialog>;
}
