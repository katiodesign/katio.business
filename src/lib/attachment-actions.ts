"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { storeAttachment, entities, type EntityType } from "@/lib/attachments";
export async function uploadAttachment(type:EntityType,id:string,form:FormData){const entityType=z.enum(Object.keys(entities) as [EntityType,...EntityType[]]).parse(type);const recordId=z.cuid().parse(id);const file=form.get("file");if(!(file instanceof File))throw new Error("Selecciona un archivo.");await storeAttachment(entityType,recordId,file);revalidatePath({CLIENT:`/clientes/${id}`,QUOTE:`/cotizaciones/${id}`,INVOICE:`/facturacion/${id}`,WORK:`/trabajos/${id}`,SUBSCRIPTION:`/contrataciones/${id}`,EXPENSE:`/gastos/${id}`}[entityType])}
