import { describe, expect, it } from "vitest";
import { calculateQuote, monthlyEquivalent, splitPayment } from "./money";

describe("cálculos comerciales", () => {
  it("aplica multiplicador antes del descuento sin errores de punto flotante", () => {
    const result = calculateQuote([{ quantity: "3", unitPrice: "0.10" }, { quantity: "1", unitPrice: "100000" }], "1.15", "PERCENT", "10");
    expect(result.subtotal.toFixed(2)).toBe("100000.30");
    expect(result.total.toFixed(2)).toBe("103500.31");
  });
  it("rechaza descuentos mayores que la cotización", () => expect(() => calculateQuote([{ quantity: 1, unitPrice: 5 }], 1, "FIXED", 6)).toThrow());
  it("asigna el remanente del 50/50 al segundo hito", () => { const r = splitPayment("100.01"); expect(r.first.toFixed(2)).toBe("50.01"); expect(r.second.toFixed(2)).toBe("50.00"); });
  it("calcula equivalentes mensuales sin confundir gastos únicos", () => { expect(monthlyEquivalent("600000", "YEARLY").toFixed(2)).toBe("50000.00"); expect(monthlyEquivalent("10", null).toFixed(2)).toBe("0.00"); });
});
