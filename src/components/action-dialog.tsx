"use client";
import {useState} from "react";
import {Plus} from "lucide-react";
import {Modal} from "./modal";
export default function ActionDialog({label,title,children,variant="secondary",initiallyOpen=false,showPlus=false}:{showPlus?:boolean;label:string;title:string;children:React.ReactNode;variant?:"primary"|"secondary"|"highlight"|"danger";initiallyOpen?:boolean}){
 const [open,setOpen]=useState(initiallyOpen);
 return <><button type="button" className={`button ${variant}`} onClick={()=>setOpen(true)}>{showPlus&&<Plus size={16}/>} {label}</button><Modal open={open} title={title} onClose={()=>setOpen(false)}>{children}<button type="button" className="button secondary" style={{marginTop:16}} onClick={()=>setOpen(false)}>Cancelar</button></Modal></>;
}

