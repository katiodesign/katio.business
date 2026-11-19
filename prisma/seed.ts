import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PERMISSIONS } from "../src/lib/permissions";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
async function main() {
  for (const name of ["SUPER_ADMIN", "ADMIN", "USER"] as const) await db.role.upsert({ where: { name }, create: { name }, update: {} });
  for (const key of PERMISSIONS) await db.permission.upsert({ where: { key }, create: { key }, update: {} });
  for (const [index, [code, label]] of ([ ["TRANSFER", "Transferencia"], ["CASH", "Efectivo"], ["NEQUI", "Nequi"], ["DAVIPLATA", "Daviplata"], ["OTHER", "Otro"] ] as const).entries()) await db.paymentMethod.upsert({ where: { code }, create: { code, label, sortOrder: index }, update: {} });
  console.log("Roles y catálogo de permisos preparados. No se crearon usuarios ni datos comerciales.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
