"use client";
import {useState} from "react";
import {Trash2} from "lucide-react";
import {useFormStatus} from "react-dom";
import {deleteQuote} from "@/lib/quote-flow";
import {Modal} from "./modal";
function Submit(){const {pending}=useFormStatus();return <button className="button danger" disabled={pending} type="submit">{pending?"Eliminando…":"Eliminar cotización"}</button>}
export default function DeleteQuoteButton({id,number}:{id:string;number:number}){
 const [open,setOpen]=useState(false),label=`COT-${String(number).padStart(4,"0")}`;
 return <><button type="button" className="button danger" onClick={()=>setOpen(true)}><Trash2 size={16}/>Eliminar</button><Modal open={open} onClose={()=>setOpen(false)} title="Eliminar cotización"><p>La cotización {label} desaparecerá del listado y su consecutivo se conservará.</p><form action={deleteQuote.bind(null,id)} className="form-actions"><input type="hidden" name="confirm" value="DELETE"/><button type="button" className="button secondary" onClick={()=>setOpen(false)}>Cancelar</button><Submit/></form></Modal></>;
}
