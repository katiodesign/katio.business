export function statusColor(status:string):string {
  if (["Al día","Pagado","Pagada","ACTIVE","FINISHED","APPROVED"].includes(status)) return "success";
  if (["Vencido","Vencida","Cancelada","OVERDUE","REJECTED","CANCELLED"].includes(status)) return "danger";
  if (["Pendiente","PENDING","PENDING_SETUP"].includes(status)) return "warning";
  if (["PAUSED","IN_CORRECTION"].includes(status)) return "danger";
  if (["IN_PROGRESS","En proceso"].includes(status)) return "purple";
  if (["Configurado","CONFIGURED"].includes(status)) return "success";
  if (["SENT_TO_CLIENT"].includes(status)) return "info";
  return "";
}
