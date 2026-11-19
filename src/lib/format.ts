export function cop(value: string | number) { return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 2 }).format(Number(value)); }
export function date(value: Date) { return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" }).format(value); }
export function periodicity(value: "MONTHLY" | "QUARTERLY" | "YEARLY" | null) {
  return value ? { MONTHLY: "Mensual", QUARTERLY: "Trimestral", YEARLY: "Anual" }[value] : "Único";
}
export function subscriptionStatus(value: string) {
  return ({ PENDING_SETUP: "Pendiente de configuración", ACTIVE: "Activa", PAUSED: "Pausada", CANCELLED: "Cancelada" } as Record<string, string>)[value] ?? value;
}
