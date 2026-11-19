import MoneyInput from "@/components/money-input";
import DatePicker from "@/components/date-picker";
import { PageHeader } from "@/components/app-chrome";
import Link from "next/link";import {requirePermission} from "@/lib/access";import {createWork} from "@/lib/operations-actions";
export default async function NewWork() {
  await requirePermission("work.update");
  return <>
    <PageHeader><div><small>Inicio / Trabajos puntuales</small><h1>Trabajos puntuales</h1></div></PageHeader>
    <form action={createWork}>
      <div className="page-title">
        <div><h2>Nuevo trabajo puntual</h2></div>
        <div className="form-actions"><Link className="button secondary" href="/trabajos">Cancelar</Link><button className="button primary">Guardar trabajo</button></div>
      </div>
      <section className="card form-card">
        <h3>Cliente y servicio</h3>
        <div className="form-grid design-fields">
          <label>Cliente o prospecto<input name="customerName" required /></label>
          <label>Servicio<input name="name" required /></label>
          <label>Valor acordado (COP)<MoneyInput name="value"    required /></label>
        </div>
        <label className="design-field">Descripción e indicaciones<textarea name="description" /></label>
      </section>
      <section className="card form-card design-section">
        <h3>Fechas y estado operativo</h3>
        <div className="form-grid design-fields"><label>Fecha límite<DatePicker name="dueAt" type="date" /></label></div>
      </section>
      <section className="card form-card design-section">
        <h3>Esquema de pago · fijo 50/50</h3>
        <div className="form-grid design-fields"><div>Primer hito <span className="badge info">50 %</span></div><div>Segundo hito <span className="badge info">50 %</span></div></div>
      </section>
    </form>
  </>;
}
