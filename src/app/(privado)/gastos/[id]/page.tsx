import CategoryInput from "@/components/category-input";
import MoneyInput from "@/components/money-input";
import DatePicker from "@/components/date-picker";
import { PageHeader } from "@/components/app-chrome";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { canAccess } from "@/lib/permissions";
import { monthlyEquivalent } from "@/lib/money";
import { cop, date } from "@/lib/format";
import { bogotaDay } from "@/lib/operations";
import { recordExpensePayment, updateExpense, deleteExpense } from "@/lib/operations-actions";

import ActionDialog from "@/components/action-dialog";
import { getGeneralSettings } from "@/lib/app-settings";

export default async function ExpenseDetail({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("expenses.read");
  const { id } = await params;
  const [expense, methods, general] = await Promise.all([
    db.operatingExpense.findUnique({ where: { id }, include: { payments: { orderBy: { paidAt: "desc" } } } }),
    db.paymentMethod.findMany({ orderBy: { sortOrder: "asc" } }),
    getGeneralSettings(),
  ]);
  if (!expense || expense.deletedAt) notFound();
  const activeMethods = methods.filter(method => method.active);
  const canEdit = canAccess(actor.roles.map(r => r.role), "expenses.update");
  return <>
    <PageHeader><div><small>Inicio / Gastos / Detalle</small><h1>{expense.name}</h1></div></PageHeader>
    <div className="page-title"><div><h2>{expense.name}</h2><p>Gastos operativos / Detalle</p></div>{canEdit && <ActionDialog label="Editar gasto" title="Editar gasto" variant="primary"><form className="stack" action={updateExpense.bind(null, id)}>
        <div className="form-grid">
          <label>Nombre<input name="name" defaultValue={expense.name} required /></label>
          <label>Categoría<CategoryInput categories={general.expenseCategories} defaultValue={expense.category}/></label>
          <label>Importe<MoneyInput name="amount"    defaultValue={expense.amount.toString()} required /></label>
          <label>Periodicidad<select name="periodicity" defaultValue={expense.periodicity || ""}><option value="">Único</option><option value="MONTHLY">Mensual</option><option value="QUARTERLY">Trimestral</option><option value="YEARLY">Anual</option></select></label>
          <label>Próximo vencimiento<DatePicker name="nextDueAt" type="date" defaultValue={expense.nextDueAt ? bogotaDay(expense.nextDueAt) : ""} /></label>
          <label>Estado<select name="active" defaultValue={String(expense.active)}><option value="true">Activo</option><option value="false">Inactivo</option></select></label>
        </div>
        <p className="muted">El cambio de importe se aplica a los próximos pagos. Los pagos anteriores conservan su valor.</p>
        <button className="button primary">Guardar cambios</button>
      </form></ActionDialog>}</div>
    <section className="card form-card"><h2>Resumen del gasto</h2><div className="stack" style={{marginTop:16}}><div><small className="muted">Categoría y periodicidad</small><p>{expense.category} · {expense.periodicity === "MONTHLY" ? "Mensual" : expense.periodicity === "QUARTERLY" ? "Trimestral" : expense.periodicity === "YEARLY" ? "Anual" : "Único"}</p></div><div><small className="muted">Valor actual</small><p>{cop(expense.amount.toString())}</p></div><div><small className="muted">Equivalente mensual de gestión</small><p>{cop(monthlyEquivalent(expense.amount.toString(), expense.periodicity).toString())} · valor de referencia</p></div></div></section>
    <section className="card form-card" style={{marginTop:16}}><h2>Próximos vencimientos</h2><p className="muted" style={{marginTop:12}}>Próximo pago esperado</p><p>{expense.nextDueAt ? `${date(expense.nextDueAt)} · ${cop(expense.amount.toString())}` : "Sin fecha programada"}</p><span className={`badge ${expense.active ? "warning" : ""}`}>{expense.active ? "Por pagar" : "Inactivo"}</span></section>
    <div style={{marginTop:16}}>
      <section className="card form-card">
        <h2>Registrar pago</h2>
        <p className="muted">Valor actual: {cop(expense.amount.toString())}</p>
        {canEdit && expense.active && activeMethods.length > 0 && <form action={recordExpensePayment.bind(null, id)}>
          <label>Fecha de pago<DatePicker name="paidAt" type="date" defaultValue={bogotaDay(new Date())} required /></label>
          <label>Método de pago<select name="method" required>{activeMethods.map(method => <option key={method.id} value={method.code}>{method.label}</option>)}</select></label>
          <label>Referencia del comprobante<input name="receiptReference" maxLength={250} placeholder="Opcional" /></label>
          <label>Próximo vencimiento<DatePicker name="nextDueAt" type="date" /><small>Si queda vacío, se calcula según la periodicidad.</small></label>
          <button className="button primary" style={{ marginTop: 16 }}>Registrar pago</button>
        </form>}
        {!expense.active && <p>Activa este gasto para registrar un pago.</p>}
        {!activeMethods.length && <p>Configura un método de pago antes de registrar pagos.</p>}
      </section>
    </div>
    <section className="card form-card" style={{ marginTop: 20 }}>
      <h2>Historial y comprobantes</h2>
      <div className="table-card"><table><thead><tr><th>Fecha</th><th>Importe</th><th>Método</th><th>Comprobante</th></tr></thead><tbody>
        {expense.payments.map(payment => <tr key={payment.id}><td>{date(payment.paidAt)}</td><td>{cop(payment.amount.toString())}</td><td>{methods.find(method => method.code === payment.method)?.label || payment.method || "Sin registrar"}</td><td>{payment.receiptReference || "—"}</td></tr>)}
      </tbody></table>{!expense.payments.length && <p className="empty">Aún no hay pagos registrados.</p>}</div>
    </section>
    
    {canEdit&&<section className="card form-card danger-zone" style={{marginTop:20}}><h2>Zona de peligro</h2><p>Eliminar retira este gasto de las vistas activas. Su historial de pagos se conserva.</p><ActionDialog label="Eliminar gasto" title="Eliminar gasto"><p>¿Eliminar este gasto? Sus pagos anteriores se conservarán para consulta histórica.</p><form action={deleteExpense.bind(null,id)} className="stack"><input type="hidden" name="confirm" value="DELETE"/><button className="button primary">Confirmar eliminación</button></form></ActionDialog></section>}
    <p style={{ marginTop: 16 }}><Link href="/gastos">← Volver a gastos</Link></p>
  </>;
}
