"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";

export async function voidInvoice(invoiceId: string, form: FormData) {
  const actor = await requirePermission("invoices.update");
  const id = z.cuid().parse(invoiceId);
  const reason = z.string().trim().min(10).max(1000).parse(form.get("reason"));
  if (form.get("confirm") !== "VOID") throw new Error("Confirma la anulación del documento.");
  await db.$transaction(async tx => {
    const result = await tx.invoice.updateMany({ where: { id, status: "ISSUED" }, data: { status: "VOID", voidedAt: new Date(), voidReason: reason } });
    if (result.count !== 1) throw new Error("La factura ya fue anulada o no existe.");
    await tx.auditLog.create({ data: { userId: actor.id, action: "VOID", entity: "Invoice", entityId: id, metadata: { reason } } });
  });
  redirect(`/facturacion/${id}`);
}
