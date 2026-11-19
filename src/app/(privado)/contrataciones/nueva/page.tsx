import { PageHeader } from "@/components/app-chrome";
import Link from "next/link";
import {db} from "@/lib/db";
import {requirePermission} from "@/lib/access";
import {canAccess} from "@/lib/permissions";
import {createSubscription} from "@/lib/operations-actions";
import {bogotaDay} from "@/lib/operations";
import ContractFields from "./contract-fields";
export default async function NewContract(){
 const actor=await requirePermission("subscriptions.update"),roles=actor.roles.map(r=>r.role);
 const [clients,items]=await Promise.all([db.client.findMany({where:{archivedAt:null},select:{id:true,name:true,identification:true},orderBy:{name:"asc"},take:500}),canAccess(roles,"catalog.read")?db.catalogItem.findMany({where:{active:true,contractType:"RECURRING"},select:{id:true,name:true,price:true,periodicity:true},orderBy:{name:"asc"},take:500}):[]]);
 return <><PageHeader><div><small>Inicio / Contrataciones</small><h1>Contrataciones y suscripciones</h1></div></PageHeader><form action={createSubscription}><div className="page-title"><div><h2>Nueva contratación</h2><p>Registra un servicio recurrente para un cliente existente.</p></div><div className="form-actions"><Link className="button secondary" href="/contrataciones">Cancelar</Link><button className="button primary">Guardar contratación</button></div></div><section className="card form-card"><h3>Datos de la contratación</h3><div className="form-grid design-fields"><label>Cliente<select name="clientId" required defaultValue=""><option value="" disabled>Seleccionar cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name} {c.identification||""}</option>)}</select></label><ContractFields today={bogotaDay(new Date())} items={items.map(i=>({...i,price:i.price.toString()}))}/></div><p className="muted" style={{marginTop:16}}>La configuración técnica y el estado de pago se administran de forma independiente.</p></section></form></>;
}
