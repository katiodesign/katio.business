import { describe, expect, it } from "vitest";
import { bogotaRange } from "./date-range";
describe("rango de fechas de Bogotá",()=>{
 it("incluye el día final completo en hora colombiana",()=>{const range=bogotaRange("2026-01-15","2026-01-16");expect(range?.gte?.toISOString()).toBe("2026-01-15T05:00:00.000Z");expect(range?.lt?.toISOString()).toBe("2026-01-17T05:00:00.000Z")});
 it("ignora fechas inválidas",()=>{expect(bogotaRange("2026-02-30",undefined)).toBeUndefined()});
});
