import {createReadStream} from "node:fs";
import {stat} from "node:fs/promises";
import {Readable} from "node:stream";
import {db} from "@/lib/db";
import {requirePermission} from "@/lib/access";
import {backupPath} from "@/lib/backups";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){await requirePermission("backups.manage");const {id}=await params;const record=await db.backupRecord.findUnique({where:{id}});if(!record||record.status!=="COMPLETED"||!record.storageKey)return new Response("No encontrado",{status:404});const file=backupPath(record.storageKey);const info=await stat(file);const stream=Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>;return new Response(stream,{headers:{"Content-Type":"application/octet-stream","Content-Length":String(info.size),"Content-Disposition":`attachment; filename="${record.storageKey}"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}})}
