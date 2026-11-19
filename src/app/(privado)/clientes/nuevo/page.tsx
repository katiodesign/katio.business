import { PageHeader } from "@/components/app-chrome";
import Link from "next/link";
import { requirePermission } from "@/lib/access";
import { createClient } from "@/lib/actions";
export default async function NewClient() {
  await requirePermission("clients.create");
  return <>
    <PageHeader><div><small>Inicio / Clientes</small><h1>Clientes</h1></div></PageHeader>
    <form action={createClient}>
      <div className="page-title">
        <div><h2>Nuevo cliente</h2></div>
        <div className="form-actions"><Link href="/clientes" className="button secondary">Cancelar</Link><button className="button primary">Guardar cliente</button></div>
      </div>
      <section className="card form-card">
        <h3>Identificación y contacto</h3>
        <div className="form-grid design-fields">
          <label>Nombre o razón social<input name="name" placeholder="Nombre del cliente" required /></label>
          <label>NIT / identificación<input name="identification" placeholder="Número de identificación" /></label>
          <label>Correo<input name="email" type="email" placeholder="correo@empresa.com" /></label>
          <label>Teléfono<input name="phone" placeholder="Número de contacto" /></label>
          <label>Dirección<input name="address" placeholder="Dirección" /></label>
        </div>
      </section>
    </form>
  </>;
}
