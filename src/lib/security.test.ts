import { describe, expect, it, vi } from "vitest";
import ExcelJS from "exceljs";
import { validateXlsx } from "./validate-xlsx";

const mocks = vi.hoisted(() => ({ hash: vi.fn(), find: vi.fn(), consume: vi.fn(), update: vi.fn(), lock: vi.fn() }));
vi.mock("bcryptjs", () => ({ hash: mocks.hash }));
vi.mock("@/lib/gmail", () => ({ getGmailConfig: vi.fn(), sendRecoveryEmail: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {
  $transaction: async (callback: (tx: unknown) => unknown) => callback({
    $executeRaw: mocks.lock,
    passwordReset: { findUnique: mocks.find, updateMany: mocks.consume },
    user: { update: mocks.update }, authSession: { updateMany: vi.fn() }, auditLog: { create: vi.fn() },
  }),
  catalogItem: { findMany: async () => [{ id: "test", name: "=1+1", description: "+SUM(1)", category: "@test", contractType: "ONE_TIME", price: 1, internalCost: 0, active: true, isBundle: false, components: [] }] },
} }));
vi.mock("@/lib/access", () => ({ requirePermission: vi.fn() }));
import { resetPassword } from "./recovery-actions";
import { GET } from "@/app/api/catalogo/exportar/route";

describe("controles de seguridad", () => {
  it("no calcula bcrypt para tokens inexistentes", async () => {
    mocks.hash.mockClear();
    mocks.find.mockResolvedValue(null);
    const form = new FormData();
    form.set("token", "a".repeat(64));
    form.set("password", "contraseña de prueba segura");
    form.set("confirm", "contraseña de prueba segura");
    expect(await resetPassword({}, form)).toHaveProperty("error");
    expect(mocks.hash).not.toHaveBeenCalled();
  });
  it("neutraliza fórmulas en la ruta de exportación CSV", async () => {
    const response = await GET(new Request("http://localhost/api/catalogo/exportar?format=csv"));
    const csv = await response.text();
    expect(csv).toContain("\t=1+1");
    expect(csv).toContain("\t+SUM(1)");
    expect(csv).toContain("\t@test");
  });
  it("rechaza XLSX con expansión excesiva", async () => {
    const book = new ExcelJS.Workbook();
    book.addWorksheet("test").addRow(["x".repeat(20_000_001)]);
    const bytes = Buffer.from(await book.xlsx.writeBuffer());
    expect(bytes.length).toBeLessThan(2_000_000);
    await expect(validateXlsx(bytes)).rejects.toThrow(/límites|20 MB/);
  });
});
