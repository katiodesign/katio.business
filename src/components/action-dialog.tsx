"use client";
import {useState} from "react";
import {Plus, Pencil, Trash2} from "lucide-react";
import {Modal} from "./modal";
export default function ActionDialog({label,title,children,variant="secondary",initiallyOpen=false,showPlus=false,icon}:{icon?:"edit"|"delete";showPlus?:boolean;label:string;title:string;children:React.ReactNode;variant?:"primary"|"secondary"|"highlight"|"danger";initiallyOpen?:boolean}){
 const [open,setOpen]=useState(initiallyOpen);
 return <><button type="button" className={icon?"icon-button":`button ${variant}`} aria-label={icon?label:undefined} title={icon?label:undefined} onClick={()=>setOpen(true)}>{icon==="edit"?<Pencil size={16}/>:icon==="delete"?<Trash2 size={16}/>:<>{showPlus&&<Plus size={16}/>} {label}</>}</button><Modal open={open} title={title} onClose={()=>setOpen(false)}>{children}<button type="button" className="button secondary" style={{marginTop:16}} onClick={()=>setOpen(false)}>Cancelar</button></Modal></>;
}

