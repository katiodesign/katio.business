import { z } from "zod";
import { db } from "@/lib/db";

export const generalSettingsSchema = z.object({
  catalogCategories: z.array(z.string().min(2).max(100)).max(30),
  expenseCategories: z.array(z.string().min(2).max(100)).max(30),
  workAlertDays: z.number().int().min(0).max(90),
  subscriptionAlertDays: z.number().int().min(0).max(90),
  quoteAlertDays: z.number().int().min(1).max(90),
});
export type GeneralSettings = z.infer<typeof generalSettingsSchema>;
export const defaultGeneralSettings: GeneralSettings = {
  catalogCategories: ["Diseño gráfico", "Automatización", "Tecnología", "Producto digital"],
  expenseCategories: ["Infraestructura", "Software", "Marketing", "Servicios"],
  workAlertDays: 0,
  subscriptionAlertDays: 0,
  quoteAlertDays: 7,
};
export function parseCategories(value: string) {
  const items = value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
  const deduped = [...new Map(items.map(item => [item.toLocaleLowerCase("es-CO"), item])).values()];
  return z.array(z.string().min(2).max(100)).max(30).parse(deduped);
}
export async function getGeneralSettings() {
  const record = await db.appSetting.findUnique({ where: { key: "GENERAL" } });
  const result = generalSettingsSchema.safeParse(record?.value);
  return result.success ? result.data : defaultGeneralSettings;
}
