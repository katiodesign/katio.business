"use client";
import Link from "next/link";
export default function PrivateError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <div className="card form-card"><h1>No se pudo completar la operación</h1><p style={{marginTop:12}}>Revisa los datos ingresados e inténtalo de nuevo. Si el problema continúa, consulta la auditoría o contacta al administrador.</p><div className="form-actions"><button className="button primary" onClick={()=>reset()}>Intentar de nuevo</button><Link className="button secondary" href="/inicio">Ir al inicio</Link></div></div>}
