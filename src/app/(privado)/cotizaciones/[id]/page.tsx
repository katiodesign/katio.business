import DatePicker from "@/components/date-picker";
import { PageHeader } from "@/components/app-chrome";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { canAccess } from "@/lib/permissions";
import { allocateQuote } from "@/lib/commercial";
import { cop, date } from "@/lib/format";
import { setQuoteStatus, convertPaidQuote } from "@/lib/quote-flow";

import {bogotaDay} from "@/lib/operations";
import DeleteQuoteButton from "@/components/delete-quote-button";
import ActionDialog from "@/components/action-dialog";
import DuplicateQuoteButton from "@/components/duplicate-quote-button";

const names = { DRAFT: "Borrador", SENT: "Enviada", ACCEPTED: "Aceptada", REJECTED: "Rechazada", EXPIRED: "Vencida" };
export default async function QuoteDetail({ params,searchParams }: { params: Promise<{ id: string }>;searchParams:Promise<{pdf?:string}> }) {
  const actor = await requirePermission("quotes.read");
  const { id } = await params; const query=await searchParams;
  const quote = await db.quote.findUnique({ where: { id }, include: { lines: true, payment: true, invoice: true } });
  if (!quote || quote.deletedAt) notFound();
  const amounts = allocateQuote(quote.lines, quote.multiplier.toString(), quote.discountType as "FIXED" | "PERCENT", quote.discount.toString());
  const roles = actor.roles.map(r => r.role);
  const canEdit = canAccess(roles, "quotes.update");
  const canDelete = canAccess(roles, "quotes.delete");
  const canConvert = canAccess(roles, "finance.create") && canAccess(roles, "invoices.create");
  const canCreateClient=canAccess(roles,"clients.create");
  const hasRecurring = quote.lines.some(line => line.contractType === "RECURRING");
  const knownClient = quote.identification ? await db.client.findUnique({ where: { identification: quote.identification } }) : null;
  const methods = await db.paymentMethod.findMany({where:{active:true},orderBy:{sortOrder:"asc"}});
  return <>
    <PageHeader><div><small>Inicio / Cotizaciones / COT-{String(quote.number).padStart(4, "0")}</small><h1>Cotización COT-{String(quote.number).padStart(4, "0")}</h1></div></PageHeader>
    <div className="page-title"><div><h2>{quote.customerName}</h2><p>{date(quote.issuedAt)} · {names[quote.status]}</p></div><div className="form-actions">{quote.status==="DRAFT"&&!quote.convertedAt&&!quote.paidAt&&canEdit&&<Link className="button secondary" href={`/cotizaciones/${id}/editar`}>Editar borrador</Link>}<ActionDialog label="Descargar PDF" title="Generar PDF de cotización" initiallyOpen={query.pdf==="confirm"}><div className="stack"><p>Se guardará la versión actual de la plantilla y los datos comerciales para este documento.</p><a className="button primary" href={`/api/cotizaciones/${id}/pdf`}>Generar y descargar PDF</a></div></ActionDialog>{canAccess(roles, "quotes.create") && <DuplicateQuoteButton id={id} number={quote.number}/>} {canDelete&&!quote.paidAt&&!quote.convertedAt&&!quote.invoice&&<DeleteQuoteButton id={id} number={quote.number}/>}</div></div>
    {canDelete&&(quote.paidAt||quote.convertedAt||quote.invoice)&&<p className="notice">Esta cotización ya tiene pago o factura y se conserva como parte del historial financiero.</p>}
    <div className="dashboard-grid">
      <section className="card form-card"><h2>Detalle comercial</h2><p>{quote.identification || "Sin identificación"} · {quote.email || "Sin correo"}</p><div className="table-card" style={{overflowX:"auto",marginTop:20}}><table><thead><tr><th>Servicio</th><th>Tipo</th><th>Cantidad</th><th>Precio</th><th>Valor negociado</th></tr></thead><tbody>{quote.lines.map((line,index)=><tr key={line.id}><td><strong>{line.name}</strong><br/><small>{line.description}</small></td><td>{line.contractType === "ONE_TIME" ? "Único" : `Recurrente · ${line.periodicity}`}</td><td>{line.quantity.toString()}</td><td>{cop(line.unitPrice.toString())}</td><td>{cop(amounts.values[index].toFixed(2))}</td></tr>)}</tbody></table></div><p style={{marginTop:16}}>Subtotal: {cop(quote.subtotal.toString())}</p><p>Multiplicador: {quote.multiplier.toString()}</p><p>Descuento: {quote.discount.toString()}{quote.discountType === "PERCENT" ? " %" : " COP"}</p><h2 style={{marginTop:16}}>Total: {cop(quote.total.toString())}</h2><p style={{marginTop:16}}>Observaciones: {quote.observations || "Sin observaciones"}</p><p>Condiciones: {quote.terms || "Sin condiciones adicionales"}</p></section>
      <section className="card form-card"><h2>Seguimiento</h2>{quote.payment ? <><p>Pago inicial: {cop(quote.payment.amount.toString())}</p><p>{date(quote.payment.paidAt)} · {quote.payment.method}</p><p>Factura interna: {quote.invoice ? `FAC-${String(quote.invoice.number).padStart(4,"0")}${quote.invoice.status==="VOID"?" · Anulada":""}` : "Pendiente"}</p>{quote.invoice && <a className="button secondary" href={`/api/facturacion/${quote.invoice.id}/pdf`}>Descargar factura PDF</a>}</> : <>
      {canEdit && <form action={setQuoteStatus.bind(null,id)} style={{marginTop:16}}><label>Estado de cotización<select name="status" defaultValue={quote.status}>{Object.entries(names).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><button className="button secondary" style={{marginTop:12}}>Actualizar estado</button></form>}
      {quote.status === "ACCEPTED" && canConvert && <div style={{marginTop:24}}><ActionDialog label="Concretar cotización" title="Concretar cotización aceptada" variant="primary"><div className="stack"><p>Cliente: <strong>{quote.customerName}</strong></p><p>Se crearán {quote.lines.filter(line=>line.contractType==="ONE_TIME").length} trabajo(s) y {quote.lines.filter(line=>line.contractType==="RECURRING").length} contratación(es).</p><p>Pago inicial requerido: <strong>{cop(amounts.initialPayment.toFixed(2))}</strong></p><form action={convertPaidQuote.bind(null,id)} className="stack"><label>Fecha del pago<DatePicker name="paidAt" type="date" defaultValue={bogotaDay(new Date())} required/></label><label>Método de pago<select name="method" required defaultValue=""><option value="" disabled>Seleccionar método</option>{methods.map(method=><option key={method.id} value={method.code}>{method.label}</option>)}</select></label><label>Referencia del comprobante<input name="receiptReference" maxLength={250} placeholder="Referencia opcional"/></label>{hasRecurring && !knownClient && !quote.clientId && !canCreateClient && <p className="error">Se requiere permiso para crear la ficha del cliente.</p>}{hasRecurring && !knownClient && !quote.clientId && canCreateClient && <label className="check-label"><input type="checkbox" name="createClient" value="yes" required/>Confirmo crear la ficha de cliente para la contratación recurrente.</label>}{knownClient?.archivedAt && !quote.clientId && <p className="error">El cliente coincidente está archivado; reactívalo antes de continuar.</p>}{knownClient && !knownClient.archivedAt && !quote.clientId && <label className="check-label"><input type="checkbox" name="useExistingClient" value="yes" required/>Confirmo usar la ficha existente de {knownClient.name} ({knownClient.identification}).</label>}<button className="button primary" disabled={(!!knownClient?.archivedAt && !quote.clientId) || (hasRecurring && !knownClient && !quote.clientId && !canCreateClient)}>Registrar pago y concretar</button></form></div></ActionDialog></div>}
      </>}</section>
    </div><p style={{marginTop:16}}><Link href="/cotizaciones">← Volver a cotizaciones</Link></p>
  </>;
}
