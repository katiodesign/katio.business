import Decimal from "decimal.js";
import {z} from "zod";

const amount=z.string().regex(/^\d+(\.\d{1,2})?$/);
export const pricingSettingsSchema=z.object({monthlyGoal:amount,monthlyExpenses:amount,monthlyHours:z.string().regex(/^\d+(\.\d{1,2})?$/),billablePercent:z.string().regex(/^\d+(\.\d{1,2})?$/),markupPercent:z.string().regex(/^\d+(\.\d{1,2})?$/),roundHourlyCost:z.boolean().optional()}).superRefine((v,ctx)=>{if(new Decimal(v.monthlyHours).lte(0))ctx.addIssue({code:"custom",path:["monthlyHours"],message:"Las horas deben ser mayores que cero."});if(new Decimal(v.billablePercent).lte(0)||new Decimal(v.billablePercent).gt(100))ctx.addIssue({code:"custom",path:["billablePercent"],message:"Indica un porcentaje entre 0 y 100."});});
export type PricingSettings=z.infer<typeof pricingSettingsSchema>;
export function hourlyCost(settings:PricingSettings){const s=pricingSettingsSchema.parse(settings);const cost=new Decimal(s.monthlyGoal).plus(s.monthlyExpenses).div(new Decimal(s.monthlyHours).mul(s.billablePercent).div(100));return s.roundHourlyCost?cost.div(1000).ceil().mul(1000):cost;}
export function suggestedPrice(cost:Decimal.Value,markup:Decimal.Value){return new Decimal(cost).mul(new Decimal(1).plus(new Decimal(markup).div(100)));}

/** Calcula el costo y precio de un servicio usando sus datos y la tarifa vigente. */
export function catalogHourlyPrice(hours:Decimal.Value,directCost:Decimal.Value,settings:PricingSettings){const rate=hourlyCost(settings).toDecimalPlaces(2);const cost=new Decimal(hours).mul(rate).plus(directCost);return {cost:cost.toFixed(2),price:suggestedPrice(cost,settings.markupPercent).toFixed(2)};}
