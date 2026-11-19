import {describe,it,expect} from "vitest";
import {statusColor} from "./status-color";
describe("colores de estado",()=>{
 it("distingue pagos pendientes, al día y vencidos",()=>{
  expect(statusColor("Pendiente")).toBe("warning");
  expect(statusColor("Al día")).toBe("success");
  expect(statusColor("Vencido")).toBe("danger");
 });
});
