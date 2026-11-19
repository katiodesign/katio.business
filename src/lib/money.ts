import Decimal from "decimal.js";

Decimal.set({ rounding: Decimal.ROUND_HALF_UP });
const money = (value: Decimal.Value) => new Decimal(value).toDecimalPlaces(2);
export type CommercialLine = { quantity: Decimal.Value; unitPrice: Decimal.Value };

export function calculateQuote(lines: CommercialLine[], multiplier: Decimal.Value, discountType: "FIXED" | "PERCENT", discount: Decimal.Value) {
  if (lines.length === 0) throw new Error("Agrega al menos una línea.");
  const m = new Decimal(multiplier), d = new Decimal(discount);
  if (!m.isFinite() || m.lte(0) || !d.isFinite() || d.lt(0)) throw new Error("Multiplicador o descuento inválido.");
  if (discountType === "PERCENT" && d.gt(100)) throw new Error("El descuento no puede superar 100 %.");
  const subtotal = money(lines.reduce((sum, line) => {
    const q = new Decimal(line.quantity), price = new Decimal(line.unitPrice);
    if (!q.isFinite() || q.lte(0) || !price.isFinite() || price.lt(0)) throw new Error("Cantidad o precio inválido.");
    return sum.plus(q.mul(price));
  }, new Decimal(0)));
  const adjusted = money(subtotal.mul(m));
  const deduction = money(discountType === "PERCENT" ? adjusted.mul(d).div(100) : d);
  if (deduction.gt(adjusted)) throw new Error("El descuento no puede superar el valor de la cotización.");
  return { subtotal, adjusted, discount: deduction, total: money(adjusted.minus(deduction)) };
}

export function splitPayment(value: Decimal.Value) {
  const total = money(value);
  if (!total.isFinite() || total.lt(0)) throw new Error("El valor no es válido.");
  const first = money(total.div(2));
  return { first, second: total.minus(first) };
}

export function monthlyEquivalent(amount: Decimal.Value, periodicity: "MONTHLY" | "QUARTERLY" | "YEARLY" | null) {
  const value = money(amount);
  if (!value.isFinite() || value.lt(0)) throw new Error("El valor no es válido.");
  return periodicity ? money(value.div({ MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 }[periodicity])) : new Decimal(0);
}
