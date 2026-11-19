import { PageHeader } from "@/components/app-chrome";
import Link from "next/link";
import FilterDialog from "@/components/filter-dialog";
import { bogotaRange } from "@/lib/date-range";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { requirePermission } from "@/lib/access";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { cop, date } from "@/lib/format";
import DuplicateQuoteButton from "@/components/duplicate-quote-button";
import TablePager, { PAGE_SIZE, pageNumber } from "@/components/table-pager";
import DeleteQuoteButton from "@/components/delete-quote-button";
import type { QuoteStatus } from "@/generated/prisma/client";

const labels = { DRAFT: "Borrador", SENT: "Enviada", ACCEPTED: "Aceptada", REJECTED: "Rechazada", EXPIRED: "Vencida" };
export default async function Quotes({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string; number?: string; from?: string; to?: string }> }) {
  const actor = await requirePermission("quotes.read");
  const params = await searchParams;
  const q = (params.q || "").slice(0, 100);
  const status = params.status && params.status in labels ? params.status as QuoteStatus : undefined;
  const page = pageNumber(params.page);
  const roles = actor.roles.map(role => role.role);
  const canCreate = canAccess(roles, "quotes.create"), canDelete = canAccess(roles, "quotes.delete");
  const numberQuery = /^(?:COT-?)?0*(\d+)$/i.exec(q.trim());
  const range=bogotaRange(params.from,params.to);
  const numberFilter=/^(?:COT-?)?0*(\d+)$/i.exec(params.number?.trim()||"");
  const validNumber=numberFilter && Number.isSafeInteger(Number(numberFilter[1])) && Number(numberFilter[1])<=2147483647 ? Number(numberFilter[1]) : undefined;
  const where = { deletedAt: null, ...(params.number ? {number:validNumber??-1}:{}), ...(range?{issuedAt:range}:{}), ...(status ? { status } : {}), ...(q ? { OR: [{ customerName: { contains: q, mode: "insensitive" as const } }, { identification: { contains: q, mode: "insensitive" as const } }, ...(numberQuery && Number.isSafeInteger(Number(numberQuery[1])) && Number(numberQuery[1]) <= 2147483647 ? [{ number: Number(numberQuery[1]) }] : [])] } : {}) };
  const [rows, total, statusCounts] = await Promise.all([
    db.quote.findMany({ where, include: { invoice: { select: { id: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.quote.count({ where }),
    db.quote.groupBy({ by: ["status"], where: { ...where, status: undefined }, _count: { _all: true } }),
  ]);
  return <>
    <PageHeader><div><small>Inicio / Cotizaciones</small><h1>Cotizaciones</h1></div></PageHeader>
    <div className="module-toolbar"><form><label className="module-search"><Search size={18} aria-hidden="true"/><span className="sr-only">Cliente o identificación</span><input name="q" defaultValue={q} placeholder="Buscar cotización o cliente…" /></label>{Object.entries({status:status||"",number:params.number||"",from:params.from||"",to:params.to||""}).map(([key,value])=>value&&<input key={key} type="hidden" name={key} value={value}/>)}</form><FilterDialog base="/cotizaciones" preserved={{q}} values={{number:params.number||"",from:params.from||"",to:params.to||"",status:status||""}} fields={[{name:"number",label:"Consecutivo de cotización"},{name:"from",label:"Fecha inicial",type:"date"},{name:"to",label:"Fecha final",type:"date"},{name:"status",label:"Estado de cotización",options:Object.entries(labels).map(([value,label])=>({value,label}))}]}/>{canCreate && <Link href="/cotizaciones/nueva" className="button primary toolbar-primary"><Plus size={16} />Nueva cotización</Link>}</div>
    <nav className="filter-chips" aria-label="Estado de las cotizaciones">
      <Link className={`chip ${!status ? "active" : ""}`} aria-current={!status ? "page" : undefined} href={`/cotizaciones?${new URLSearchParams({q,number:params.number||"",from:params.from||"",to:params.to||""})}`}>Todas <small>{statusCounts.reduce((sum, item) => sum + item._count._all, 0)}</small></Link>
      {Object.entries(labels).map(([key, label]) => <Link key={key} className={`chip ${status === key ? "active" : ""}`} aria-current={status === key ? "page" : undefined} href={`/cotizaciones?${new URLSearchParams({q, status:key,number:params.number||"",from:params.from||"",to:params.to||""})}`}>{label} <small>{statusCounts.find(item => item.status === key)?._count._all ?? 0}</small></Link>)}
    </nav>
    <div className="card table-card quote-table"><table aria-label="Cotizaciones"><thead><tr><th>Consecutivo</th><th>Cliente / prospecto</th><th>Fecha</th><th>Vence oferta</th><th>Total</th><th>Estado</th>{(canCreate || canDelete) && <th>Acciones</th>}</tr></thead><tbody>
      {rows.map(row => <tr key={row.id}><td><small>Consecutivo</small><Link href={`/cotizaciones/${row.id}`}>COT-{String(row.number).padStart(4, "0")}</Link></td><td><small>Cliente / prospecto</small><div className="quote-customer"><span className="avatar">{row.customerName.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join("").toUpperCase()}</span><span>{row.customerName}<small>{row.clientId?"Cliente":"Prospecto"}</small></span></div></td><td><small>Fecha</small>{date(row.issuedAt)}</td><td><small>Vence oferta</small>{row.expiresAt?date(row.expiresAt):"—"}</td><td><small>Total (COP)</small>{cop(row.total.toString())}</td><td><small>Estado</small><span className={`badge ${row.status === "ACCEPTED" ? "success" : row.status === "SENT" ? "info" : row.status === "EXPIRED" ? "warning" : row.status === "REJECTED" ? "danger" : ""}`}>{labels[row.status]}</span></td>{(canCreate || canDelete) && <td><small>Acciones</small><div className="form-actions" style={{ marginTop: 0 }}>
        {canCreate && <DuplicateQuoteButton id={row.id} number={row.number} />}
        <details className="row-actions"><summary role="button" className="row-icon" aria-label={`Acciones de COT-${String(row.number).padStart(4,"0")}`} title="Acciones"><MoreHorizontal size={20}/></summary><div className="row-actions-menu"><Link href={`/cotizaciones/${row.id}`}>Ver</Link>{row.status==="DRAFT"&&!row.convertedAt&&!row.paidAt&&canAccess(roles,"quotes.update")&&<Link href={`/cotizaciones/${row.id}/editar`}>Editar</Link>}{canAccess(roles,"quotes.update")&&<Link href={`/cotizaciones/${row.id}`}>Cambiar estado</Link>}{row.status==="ACCEPTED"&&canAccess(roles,"finance.create")&&canAccess(roles,"invoices.create")&&<Link href={`/cotizaciones/${row.id}`}>Concretar</Link>}{canDelete && !row.convertedAt && !row.paidAt && !row.invoice && <DeleteQuoteButton id={row.id} number={row.number} />}</div></details>
      </div></td>}</tr>)}
    </tbody></table>{!rows.length && <p className="empty" style={{ padding: 24 }}>No hay cotizaciones para estos filtros.</p>}<TablePager page={page} total={total} base="/cotizaciones" filters={{ q, status: status || "",number:params.number||"",from:params.from||"",to:params.to||"" }} /></div>
  </>;
}
