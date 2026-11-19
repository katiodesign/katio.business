"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { allocateQuote, nextPeriod } from "@/lib/commercial";
import { milestonesFor } from "@/lib/operations";
import { methodCode, requireActiveMethod } from "@/lib/payment-methods";
import { canAccess } from "@/lib/permissions";

const quoteId = z.cuid();

export async function setQuoteStatus(id: string, form: FormData) {
  const actor = await requirePermission("quotes.update");
  const status = z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]).parse(form.get("status"));
  await db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
    const quote = await tx.quote.findUniqueOrThrow({ where: { id: quoteId.parse(id) } });
    if (quote.deletedAt) throw new Error("La cotización fue eliminada.");
    if (quote.convertedAt || quote.paidAt) throw new Error("La cotización pagada ya no puede cambiar de estado.");
    await tx.quote.update({ where: { id }, data: { status } });
    await tx.auditLog.create({ data: { userId: actor.id, action: "STATUS", entity: "Quote", entityId: id, metadata: { status } } });
  });
  redirect(`/cotizaciones/${id}`);
}

export async function convertPaidQuote(id: string, form: FormData) {
  const actor = await requirePermission("finance.create");
  await requirePermission("invoices.create");
  const data = z.object({
    method: methodCode,
    paidAt: z.iso.date(),
    receiptReference: z.string().trim().max(250),
    createClient: z.literal("yes").optional(),
    useExistingClient: z.literal("yes").optional(),
  }).parse(Object.fromEntries(form));
  await db.$transaction(async tx => {
    // Serializar por cotización evita dos facturas y dos grupos de trabajos.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
    const quote = await tx.quote.findUniqueOrThrow({ where: { id: quoteId.parse(id) }, include: { lines: true, client: true } });
    if (quote.deletedAt) throw new Error("La cotización fue eliminada.");
    if (quote.convertedAt) return;
    if (quote.paidAt) throw new Error("El pago existe sin una conversión completada; revisa el registro.");
    if (quote.status !== "ACCEPTED") throw new Error("Primero marca la cotización como aceptada.");
    await requireActiveMethod(tx,data.method);
    const { values, initialPayment } = allocateQuote(quote.lines, quote.multiplier.toString(), quote.discountType as "FIXED" | "PERCENT", quote.discount.toString());
    const hasRecurring = quote.lines.some(line => line.contractType === "RECURRING");
    let client = quote.client;
    if (client?.archivedAt) throw new Error("El cliente vinculado está archivado. Reactívalo antes de continuar.");
    if (!client && quote.identification) {
      const match = await tx.client.findUnique({ where: { identification: quote.identification } });
      if (match && data.useExistingClient !== "yes") throw new Error("Confirma el uso del cliente existente antes de concretar.");
      if (match?.archivedAt) throw new Error("El cliente coincidente está archivado. Reactívalo antes de continuar.");
      client = match;
    }
    if (hasRecurring && !client) {
      if (data.createClient !== "yes") throw new Error("Confirma la creación de la ficha del cliente para servicios recurrentes.");
      if (!canAccess(actor.roles.map(role => role.role), "clients.create")) throw new Error("Se requiere permiso para crear clientes antes de concretar servicios recurrentes.");
      client = await tx.client.create({ data: { name: quote.customerName, identification: quote.identification || null, email: quote.email, phone: quote.phone, address: quote.address } });
    }
    const now = new Date(`${data.paidAt}T12:00:00-05:00`);
    const template = await tx.documentTemplate.findUnique({ where: { kind: "INVOICE" } });
    const templateSnapshot = (template?.content || {}) as Record<string, string>;
    const invoice = await tx.invoice.create({ data: {
      quoteId: quote.id,
      total: quote.total,
      customerSnapshot: { name: quote.customerName, businessName: quote.businessName, identification: quote.identification, email: quote.email, phone: quote.phone, address: quote.address },
      templateSnapshot,
      lines: { create: quote.lines.map((line, index) => ({ snapshot: { name: line.name, description: line.description, contractType: line.contractType, periodicity: line.periodicity, quantity: line.quantity.toString(), unitPrice: line.unitPrice.toString(), total: values[index].toFixed(2), commercialComponents:quote.showBreakdown&&Array.isArray(line.commercialComponents)?line.commercialComponents:[] } })) },
    } });
    await tx.quotePayment.create({ data: { quoteId: quote.id, amount: initialPayment.toFixed(2), method: data.method, receiptReference: data.receiptReference || null, paidAt: now } });
    for (const [index, line] of quote.lines.entries()) {
      if (line.contractType === "ONE_TIME") {
        const milestones = milestonesFor(values[index].toFixed(2), "ONE_TIME");
        milestones[0] = { ...milestones[0], paidAt: now, method: data.method, receiptReference: data.receiptReference || null } as typeof milestones[number];
        await tx.workItem.create({ data: { sourceLineId: line.id, clientId: client?.id, customerName: quote.customerName, name: line.name, description: line.description, value: values[index].toFixed(2), status: "IN_PROGRESS", startedAt: now, milestones: { create: milestones } } });
      } else {
        if (!client || !line.periodicity) throw new Error("La contratación recurrente requiere cliente y periodicidad.");
        await tx.subscription.create({ data: { sourceLineId: line.id, clientId: client.id, name: line.name, price: values[index].toFixed(2), periodicity: line.periodicity, status: "PENDING_SETUP", paymentStatus: "CURRENT", startedAt: now, nextDueAt: nextPeriod(now, line.periodicity), events: { create: [{ kind: "CREATED" }, { kind: "PAYMENT", data: { amount: values[index].toFixed(2), method: data.method, receiptReference: data.receiptReference || null } }] } } });
      }
    }
    await tx.quote.update({ where: { id: quote.id }, data: { clientId: client?.id, paidAt: now, convertedAt: now } });
    await tx.auditLog.create({ data: { userId: actor.id, action: "CONVERT", entity: "Quote", entityId: quote.id, metadata: { invoiceId: invoice.id, initialPayment: initialPayment.toFixed(2), method: data.method } } });
  }, { timeout: 15000 });
  redirect(`/cotizaciones/${id}`);
}

export async function deleteQuote(id: string, form: FormData) {
  const actor = await requirePermission("quotes.delete");
  const validId = quoteId.parse(id);
  if (form.get("confirm") !== "DELETE") throw new Error("Confirma la eliminación de la cotización.");
  await db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${validId}))`;
    const quote = await tx.quote.findUniqueOrThrow({ where: { id: validId }, include: { invoice: { select: { id: true } }, payment: { select: { id: true } } } });
    if (quote.deletedAt) return;
    if (quote.convertedAt || quote.paidAt || quote.invoice || quote.payment) throw new Error("No se puede eliminar una cotización con pago o factura. Conserva su historial financiero.");
    const result = await tx.quote.updateMany({ where: { id: validId, deletedAt: null, convertedAt: null, paidAt: null }, data: { deletedAt: new Date() } });
    if (result.count !== 1) throw new Error("La cotización cambió mientras se eliminaba. Vuelve a intentarlo.");
    await tx.auditLog.create({ data: { userId: actor.id, action: "DELETE", entity: "Quote", entityId: validId, metadata: { number: quote.number } } });
  });
  redirect("/cotizaciones");
}
