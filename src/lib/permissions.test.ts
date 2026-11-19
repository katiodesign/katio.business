import { describe, expect, it } from "vitest";
import { canAccess } from "./permissions";
describe("permisos", () => {
  it("deniega por defecto y no infiere permisos para administradores", () => expect(canAccess([{ name: "ADMIN", permissions: [] }], "users.manage")).toBe(false));
  it("exige asignación explícita para usuarios", () => { const roles = [{ name: "USER", permissions: [{ permission: { key: "quotes.read" } }] }]; expect(canAccess(roles, "quotes.read")).toBe(true); expect(canAccess(roles, "quotes.update")).toBe(false); });
  it("permite acceso completo al superadministrador", () => expect(canAccess([{ name: "SUPER_ADMIN", permissions: [] }], "users.manage")).toBe(true));
});
