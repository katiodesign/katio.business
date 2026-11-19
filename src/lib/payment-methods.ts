import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
export const methodCode = z.string().regex(/^[A-Z0-9_]{2,40}$/);
export async function requireActiveMethod(tx:Prisma.TransactionClient,code:string){const method=await tx.paymentMethod.findUnique({where:{code}});if(!method?.active)throw new Error("El método de pago ya no está disponible.");return method}
