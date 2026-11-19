import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { z } from "zod";
import { PERMISSIONS } from "../src/lib/permissions";

const input = z.object({ BOOTSTRAP_NAME: z.string().trim().min(2), BOOTSTRAP_EMAIL: z.string().trim().email(), BOOTSTRAP_PASSWORD: z.string().min(14).max(128) }).safeParse(process.env);
if (!input.success) { console.error("Defina BOOTSTRAP_NAME, BOOTSTRAP_EMAIL y BOOTSTRAP_PASSWORD (mínimo 14 caracteres) como variables temporales."); process.exit(1); }
const bootstrap = input.data;
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
async function main() {
  const { BOOTSTRAP_NAME: name, BOOTSTRAP_EMAIL: email, BOOTSTRAP_PASSWORD: password } = bootstrap;
  const passwordHash = await hash(password, 12);
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(8472391)`;
    if (await tx.userRole.count({ where: { role: { name: "SUPER_ADMIN" } } })) throw new Error("Ya existe un superadministrador; no se creó otra cuenta.");
    const roles = await Promise.all((["SUPER_ADMIN", "ADMIN", "USER"] as const).map((role) => tx.role.upsert({ where: { name: role }, create: { name: role }, update: {} })));
    for (const key of PERMISSIONS) await tx.permission.upsert({ where: { key }, create: { key }, update: {} });
    const user = await tx.user.create({ data: { name, email: email.toLowerCase(), passwordHash, roles: { create: { roleId: roles[0].id } } } });
    await tx.auditLog.create({ data: { userId: user.id, action: "BOOTSTRAP", entity: "User", entityId: user.id } });
  });
  console.log("Superadministrador creado. Elimina las variables temporales de la sesión.");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Error de inicialización"); process.exitCode = 1; }).finally(() => db.$disconnect());
