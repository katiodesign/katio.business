"use server";
import { unlink } from "node:fs/promises";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { applyMilestone } from "@/lib/operations";
import { methodCode, requireActiveMethod } from "@/lib/payment-methods";
import { attachmentPath, preparePaymentReceipt } from "@/lib/attachments";

export async function registerInvoicePayment(invoiceId:string,form:FormData) {
  const actor=await requirePermission("finance.create");
  await requirePermission("invoices.read");
  const invoice=z.cuid().parse(invoiceId),workId=z.cuid().parse(form.get("workId"));
  const sequence=z.coerce.number().int().min(1).max(2).parse(form.get("sequence")) as 1|2;
  const paidAt=z.iso.date().parse(form.get("paidAt")),method=methodCode.parse(form.get("method"));
  const file=form.get("receipt");
  const receipt=file instanceof File && file.size ? await preparePaymentReceipt(file) : null;
  try {
    await db.$transaction(async tx=>{
      await requireActiveMethod(tx,method);
      const work=await tx.workItem.findUniqueOrThrow({where:{id:workId},include:{milestones:true}});
      const source=await tx.invoice.findFirst({where:{id:invoice,quote:{lines:{some:{id:work.sourceLineId}}}},select:{id:true}});
      if(!source)throw new Error("El trabajo no corresponde a esta factura.");
      const first=work.milestones.find(m=>m.sequence===1),target=work.milestones.find(m=>m.sequence===sequence);
      if(!target)throw new Error("No existe el hito.");
      const change=applyMilestone(work.status,sequence,!!target.paidAt,!!first?.paidAt);
      const attachment=receipt?await tx.attachment.create({data:{entityType:"INVOICE",entityId:invoice,...receipt}}):null;
      const updated=await tx.paymentMilestone.updateMany({where:{id:target.id,paidAt:null},data:{paidAt:new Date(`${paidAt}T12:00:00-05:00`),method,receiptReference:attachment?`attachment:${attachment.id}`:null}});
      if(updated.count!==1)throw new Error("El pago ya fue registrado.");
      if(change.workStatus!==work.status)await tx.workItem.update({where:{id:work.id},data:{status:change.workStatus}});
      await tx.auditLog.create({data:{userId:actor.id,action:"PAYMENT",entity:"WorkItem",entityId:work.id,metadata:{sequence,amount:target.amount.toString(),method,invoiceId:invoice,attachmentId:attachment?.id||null}}});
    });
  } catch(error) {if(receipt)await unlink(attachmentPath(receipt.storageKey)).catch(()=>{});throw error}
  redirect(`/facturacion/${invoice}`);
}
