import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { allocateQuote } from "@/lib/commercial";
import { renderCommercialPdf } from "@/lib/documents";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("quotes.read");
  const { id } = await params;
  const quote = await db.$transaction(async tx => {
    const record = await tx.quote.findUnique({ where: { id }, include: { lines: true } });
    if (!record || record.deletedAt) return null;
    if (record.templateSnapshot) return record;
    const template = await tx.documentTemplate.findUnique({ where: { kind: "QUOTE" } });
    return tx.quote.update({ where: { id }, data: { templateSnapshot: (template?.content || {}) as Record<string, string> }, include: { lines: true } });
  });
  if (!quote) return new Response("No encontrada", { status: 404 });
  const { values } = allocateQuote(quote.lines, quote.multiplier.toString(), quote.discountType as "FIXED" | "PERCENT", quote.discount.toString());
  const pdf = await renderCommercialPdf({
    kind: "QUOTE", number: quote.number, issuedAt: quote.issuedAt, expiresAt: quote.expiresAt,
    customer: { name: quote.customerName, businessName: quote.businessName, identification: quote.identification, email: quote.email, phone: quote.phone, address: quote.address },
    template: quote.templateSnapshot as Record<string, string>,
    lines: quote.lines.map((line, index) => ({ name: line.name, description: line.description, quantity: line.quantity.toString(), unitPrice: line.unitPrice.toString(), total: values[index].toFixed(2), periodicity: line.periodicity, commercialComponents: quote.showBreakdown&&Array.isArray(line.commercialComponents)?line.commercialComponents.flatMap(part=>part&&typeof part==="object"&&!Array.isArray(part)&&typeof part.name==="string"&&typeof part.quantity==="string"?[{name:part.name,quantity:part.quantity}]:[]):[] })),
    subtotal: quote.subtotal.toString(), multiplier: quote.multiplier.toString(), discount: quote.discount.toString(), discountType: quote.discountType, total: quote.total.toString(), observations: quote.observations, extraTerms: quote.terms,
  });
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="COT-${String(quote.number).padStart(4, "0")}.pdf"`, "Cache-Control": "private, no-store" } });
}
