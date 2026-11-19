"use client";
import {useState} from "react";
import {revealCredentialDetails} from "@/lib/client-actions";
type Details={url:string;credentialType:string;accessStatus:string;notes:string;customFields:{name:string;value:string}[]};
export default function CredentialDetails({id}:{id:string}) {
 const [details,setDetails]=useState<Details|null|undefined>(undefined),[error,setError]=useState("");
 return <div><button type="button" className="button secondary" onClick={async()=>{if(details!==undefined){setDetails(undefined);return}try{setDetails(await revealCredentialDetails(id));setError("")}catch{setError("No se pudieron consultar los detalles.")}}}>{details===undefined?"Ver detalles":"Ocultar detalles"}</button>{details&&<div className="credential-details"><p>URL: {details.url||"—"}</p><p>Tipo: {({PASSWORD:"Usuario / contraseña",TOKEN:"Token",OTHER:"Otro"} as Record<string,string>)[details.credentialType]||details.credentialType}</p><p>Estado: {({ACTIVE:"Activo",INACTIVE:"Inactivo",PENDING:"Pendiente"} as Record<string,string>)[details.accessStatus]||details.accessStatus}</p><p>Notas: {details.notes||"—"}</p>{details.customFields.map((f,i)=><p key={i}>{f.name}: {f.value}</p>)}</div>}{details===null&&<p>Sin detalles adicionales.</p>}{error&&<p className="error">{error}</p>}</div>;
}
