
import { PageHeader } from "@/components/app-chrome";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { canAccess } from "@/lib/permissions";
import { createBundle } from "@/lib/catalog-actions";
import BundleComponents from "./bundle-components";
export default async function NewBundle() {
 const actor=await requirePermission("catalog.create");
 const items=await db.catalogItem.findMany({where:{active:true,isBundle:false},orderBy:{name:"asc"},select:{id:true,name:true,category:true,contractType:true,periodicity:true,price:true,internalCost:true}});
 const canSeeCost=canAccess(actor.roles.map(r=>r.role),"finance.read");
 return <><PageHeader><div><small>Inicio / Catálogo / Compuesto</small><h1>Nuevo producto compuesto</h1></div></PageHeader><form action={createBundle} className="stack">
 <section className="card form-card"><h2>Datos del producto compuesto</h2><div className="form-grid" style={{marginTop:16}}><label>Nombre<input name="name" required/></label><label>Categoría<input name="category" required/></label><label>Contratación<select name="contractType"><option value="ONE_TIME">Único</option><option value="RECURRING">Recurrente</option></select></label><label>Periodicidad<select name="periodicity"><option value="">No aplica</option><option value="MONTHLY">Mensual</option><option value="QUARTERLY">Trimestral</option><option value="YEARLY">Anual</option></select></label></div><label style={{marginTop:16}}>Descripción<textarea name="description"/></label></section>
 <BundleComponents items={items.map(item=>({...item,price:item.price.toString(),internalCost:canSeeCost?item.internalCost.toString():"0"}))}/><div className="form-actions"><button className="button primary">Crear compuesto</button><Link className="button secondary" href="/catalogo">Cancelar</Link></div></form></>;
}
