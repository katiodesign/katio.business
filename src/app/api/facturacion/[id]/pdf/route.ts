import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { renderCommercialPdf } from "@/lib/documents";

type SnapshotLine = { name: string; description: string; quantity: string; unitPrice: string; total: string; periodicity: string | null; commercialComponents?:{name:string;quantity:string}[] };
type SnapshotCustomer = { name: string; businessName?: string | null; identification?: string | null; email?: string | null; phone?: string | null; address?: string | null };
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("invoices.read");
  const { id } = await params;
  const invoice = await db.invoice.findUnique({ where: { id }, include: { lines: true, quote: true } });
  if (!invoice) return new Response("No encontrada", { status: 404 });
  const pdf = await renderCommercialPdf({
    kind: "INVOICE", number: invoice.number, issuedAt: invoice.createdAt, voided: invoice.status === "VOID",
    customer: invoice.customerSnapshot as SnapshotCustomer,
    template: invoice.templateSnapshot as Record<string, string>,
    lines: invoice.lines.map(line => line.snapshot as SnapshotLine),
    subtotal: invoice.quote.subtotal.toString(), multiplier: invoice.quote.multiplier.toString(), discount: invoice.quote.discount.toString(), discountType: invoice.quote.discountType, total: invoice.total.toString(), observations: invoice.quote.observations, extraTerms: invoice.quote.terms,
  });
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="FAC-${String(invoice.number).padStart(4, "0")}.pdf"`, "Cache-Control": "private, no-store" } });
}
