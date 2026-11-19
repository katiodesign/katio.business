import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { allocateQuote, nextPeriod } from "./commercial";

describe("conversión comercial", () => {
  it("reparte el descuento y el redondeo sin perder centavos", () => {
    const result = allocateQuote([
      { quantity: "1", unitPrice: "100", contractType: "ONE_TIME" },
      { quantity: "1", unitPrice: "100", contractType: "RECURRING" },
    ], "1.15", "FIXED", "30");
    expect(result.values.map(v => v.toFixed(2))).toEqual(["100.00", "100.00"]);
    expect(result.initialPayment.toFixed(2)).toBe("150.00");
  });
  it("mantiene total exacto con varios renglones pequeños", () => {
    const result = allocateQuote(Array.from({ length: 3 }, () => ({ quantity: "1", unitPrice: "0.01", contractType: "ONE_TIME" as const })), "1", "FIXED", "0.02");
    expect(result.values.map(v=>v.toFixed(2))).toEqual(["0.00","0.01","0.00"]);
    expect(result.values.reduce((sum,v)=>sum.plus(v),new Decimal(0)).toFixed(2)).toBe("0.01");
  });
  it("calcula el próximo período en la fecha de inicio", () => {
    expect(nextPeriod(new Date("2026-01-15T12:00:00Z"), "QUARTERLY").toISOString()).toBe("2026-04-15T12:00:00.000Z");
  });
});
