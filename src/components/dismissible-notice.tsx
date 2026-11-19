"use client";
import {useState} from "react";
import {X} from "lucide-react";
export default function DismissibleNotice({children}:{children:React.ReactNode}) {
 const [open,setOpen]=useState(true);
 return open?<div className="notice dismissible-notice"><div>{children}</div><button type="button" aria-label="Cerrar aviso" onClick={()=>setOpen(false)}><X size={18}/></button></div>:null;
}
