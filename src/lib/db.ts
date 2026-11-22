import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForDb = globalThis as unknown as { prisma?: PrismaClient; prismaSchemaVersion?: string };
// When Prisma is regenerated during development, Next can keep the old client in globalThis.
const schemaVersion = "20261122000003_dynamic_catalog_prices";
export const db = (globalForDb.prismaSchemaVersion === schemaVersion && globalForDb.prisma) || new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }) });
if (process.env.NODE_ENV !== "production") { globalForDb.prisma = db; globalForDb.prismaSchemaVersion = schemaVersion; }

