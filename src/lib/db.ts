import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForDb = globalThis as unknown as { prisma?: PrismaClient; prismaSchemaVersion?: string };
// When Prisma is regenerated during development, Next can keep the old client in globalThis.
const schemaVersion = "20261112000000_credential_details";
export const db = (globalForDb.prismaSchemaVersion === schemaVersion && globalForDb.prisma) || new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }) });
if (process.env.NODE_ENV !== "production") { globalForDb.prisma = db; globalForDb.prismaSchemaVersion = schemaVersion; }

