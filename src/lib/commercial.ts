import Decimal from "decimal.js";
import { calculateQuote, splitPayment } from "./money";

export type PricedLine = { quantity: Decimal.Value; unitPrice: Decimal.Value; contractType: "ONE_TIME" | "RECURRING" };

/** Reparte el total negociado entre líneas; el último peso absorbe el redondeo. */
export function allocateQuote(lines: PricedLine[], multiplier: Decimal.Value, discountType: "FIXED" | "PERCENT", discount: Decimal.Value) {
  const { total } = calculateQuote(lines, multiplier, discountType, discount);
  const weights = lines.map(line => new Decimal(line.quantity).mul(line.unitPrice));
  const weightTotal = weights.reduce((sum, weight) => sum.plus(weight), new Decimal(0));
  let assigned = new Decimal(0);
  let cumulativeWeight = new Decimal(0);
  const values = weights.map((weight, index) => {
    cumulativeWeight = cumulativeWeight.plus(weight);
    const value = index === weights.length - 1
      ? total.minus(assigned)
      : weightTotal.isZero() ? new Decimal(0) : total.mul(cumulativeWeight).div(weightTotal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).minus(assigned);
    assigned = assigned.plus(value);
    return value;
  });
  const initialPayment = values.reduce((sum, value, index) => sum.plus(lines[index].contractType === "ONE_TIME" ? splitPayment(value).first : value), new Decimal(0));
  return { values, total, initialPayment };
}

export function nextPeriod(start: Date, periodicity: "MONTHLY" | "QUARTERLY" | "YEARLY") {
  const result = new Date(start);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + { MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 }[periodicity]);
  result.setUTCDate(Math.min(day, new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()));
  return result;
}
