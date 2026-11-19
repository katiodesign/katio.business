import { describe, expect, it } from "vitest";
import { applyMilestone, milestonesFor, subscriptionPaymentLabel, workUrgency } from "./operations";
describe("reglas operativas", () => {
  it("el primer pago inicia el trabajo y el segundo no lo termina", () => { expect(applyMilestone("PENDING",1,false,false)).toEqual({workStatus:"IN_PROGRESS",paymentStatus:"PARTIAL"}); expect(applyMilestone("IN_CORRECTION",2,false,true)).toEqual({workStatus:"IN_CORRECTION",paymentStatus:"COMPLETED"}); });
  it("rechaza pagos duplicados y fuera de orden", () => { expect(() => applyMilestone("PENDING",1,true,false)).toThrow(); expect(() => applyMilestone("PENDING",2,false,false)).toThrow(); });
  it("no aplica 50/50 a los recurrentes", () => { expect(milestonesFor("100.01","RECURRING")).toEqual([]); expect(milestonesFor("100.01","ONE_TIME").map(p => p.amount)).toEqual(["50.01","50.00"]); });
  it("ordena vencido, hoy, próximo y sin fecha por día de Bogotá", () => { const now=new Date("2026-11-07T18:00:00Z"); expect(["2026-11-06T17:00:00Z","2026-11-07T17:00:00Z","2026-11-08T17:00:00Z"].map(d=>workUrgency(new Date(d),"PENDING",now))).toEqual([0,1,2]); expect(workUrgency(null,"PENDING",now)).toBe(3); expect(workUrgency(new Date("2020-01-01"),"FINISHED",now)).toBe(4); });
  it("muestra el cobro pendiente o vencido sin cambiar el estado operativo",()=>{const now=new Date("2026-11-07T18:00:00Z");expect(subscriptionPaymentLabel(new Date("2026-11-06"),"ACTIVE","CURRENT",now)).toBe("Vencido");expect(subscriptionPaymentLabel(new Date("2026-12-07"),"ACTIVE","PENDING",now)).toBe("Pendiente");expect(subscriptionPaymentLabel(new Date("2026-12-07"),"ACTIVE","CURRENT",now)).toBe("Al día");expect(subscriptionPaymentLabel(new Date("2026-11-06"),"CANCELLED","CURRENT",now)).toBe("Cancelada")});
});
