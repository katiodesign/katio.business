import { splitPayment } from "./money";

export type WorkStatus = "PENDING" | "IN_PROGRESS" | "SENT_TO_CLIENT" | "IN_CORRECTION" | "APPROVED" | "FINISHED";
export function applyMilestone(workStatus: WorkStatus, milestone: 1 | 2, alreadyPaid: boolean, firstPaid: boolean) {
  if (alreadyPaid) throw new Error("El hito ya está registrado.");
  if (milestone === 2 && !firstPaid) throw new Error("Registra primero el pago inicial.");
  return { workStatus: milestone === 1 && workStatus === "PENDING" ? "IN_PROGRESS" as const : workStatus, paymentStatus: milestone === 2 ? "COMPLETED" as const : "PARTIAL" as const };
}
export function milestonesFor(total: string, contractType: "ONE_TIME" | "RECURRING") {
  if (contractType === "RECURRING") return [];
  const { first, second } = splitPayment(total);
  return [{ sequence: 1, amount: first.toFixed(2) }, { sequence: 2, amount: second.toFixed(2) }];
}

// Fechas de calendario en Bogotá: YYYY-MM-DD, sin depender de la zona del servidor.
export function bogotaDay(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (name: string) => parts.find(p => p.type === name)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function workUrgency(dueAt: Date | null, status: WorkStatus, now: Date): 0 | 1 | 2 | 3 | 4 {
  if (status === "FINISHED") return 4;
  if (!dueAt) return 3;
  const due = bogotaDay(dueAt), today = bogotaDay(now);
  return due < today ? 0 : due === today ? 1 : 2;
}
export function subscriptionPaymentLabel(nextDueAt:Date, status:string, paymentStatus:string, now:Date){
  if(status==="CANCELLED")return "Cancelada";
  if(nextDueAt<=now)return "Vencido";
  return paymentStatus==="PENDING"?"Pendiente":"Al día";
}
