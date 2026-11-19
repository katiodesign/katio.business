import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { access, appendFile, copyFile, mkdir, mkdtemp, open, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import * as tar from "tar";
import { db } from "@/lib/db";
import { storageRoot, attachmentPath } from "@/lib/attachments";
import { keyFromEnvironment } from "@/lib/secrets";

const magic = Buffer.from("KATIOBK1");
const backupRoot = () => path.join(storageRoot(), "backups");
export const backupPath = (key: string) => { if (!/^[a-f0-9-]{36}\.katio$/.test(key)) throw new Error("Respaldo inválido."); return path.join(backupRoot(), key); };
const database = () => { const url = new URL(process.env.DATABASE_URL || ""); return { host:url.hostname, port:url.port||"5432", user:decodeURIComponent(url.username), password:decodeURIComponent(url.password), name:url.pathname.slice(1) }; };
async function pgBinary(name: "pg_dump" | "pg_restore") { const local=path.join(process.cwd(),".local","postgresql","pgsql","bin",`${name}${process.platform==="win32"?".exe":""}`);try{await access(local);return local}catch{return name} }
async function command(binary:string,args:string[],password:string){await new Promise<void>((resolve,reject)=>{const child=spawn(binary,args,{env:{...process.env,PGPASSWORD:password},windowsHide:true,stdio:["ignore","ignore","pipe"]});let stderr="";child.stderr.on("data",chunk=>{stderr+=String(chunk).slice(0,2000)});child.on("error",reject);child.on("close",code=>code===0?resolve():reject(new Error(`La operación de PostgreSQL falló (${code}): ${stderr.slice(0,500)}`)))});}
function safeTempRemove(directory:string){const base=path.resolve(tmpdir())+path.sep;if(!path.resolve(directory).startsWith(base))throw new Error("Ruta temporal inválida.");return rm(directory,{recursive:true,force:true})}
async function digest(file:string){const hash=createHash("sha256");for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest("hex")}

export async function createLocalBackup(actorId?:string){
  const record=await db.backupRecord.create({data:{status:"RUNNING",scope:"DATABASE_AND_ATTACHMENTS"}});
  const temp=await mkdtemp(path.join(tmpdir(),"katio-backup-"));const key=`${randomUUID()}.katio`;const output=backupPath(key);
  try{
    const conn=database();const dump=path.join(temp,"database.dump");await command(await pgBinary("pg_dump"),["-h",conn.host,"-p",conn.port,"-U",conn.user,"-Fc","-f",dump,conn.name],conn.password);
    const files=path.join(temp,"attachments");await mkdir(files);
    const attachments=await db.attachment.findMany({select:{storageKey:true}});
    for(const attachment of attachments)await copyFile(attachmentPath(attachment.storageKey),path.join(files,attachment.storageKey));
    const manifest={version:1,createdAt:new Date().toISOString(),attachments:attachments.length};await writeFile(path.join(temp,"manifest.json"),JSON.stringify(manifest));
    const archive=path.join(temp,"archive.tar.gz");await tar.c({gzip:true,file:archive,cwd:temp},["database.dump","manifest.json","attachments"]);
    await mkdir(backupRoot(),{recursive:true});const nonce=randomBytes(12);await writeFile(output,Buffer.concat([magic,nonce]),{flag:"wx"});const cipher=createCipheriv("aes-256-gcm",keyFromEnvironment(),nonce);await pipeline(createReadStream(archive),cipher,createWriteStream(output,{flags:"a"}));await appendFile(output,cipher.getAuthTag());
    const size=(await stat(output)).size;const checksum=await digest(output);await db.$transaction(async tx=>{await tx.backupRecord.update({where:{id:record.id},data:{status:"COMPLETED",storageKey:key,size:BigInt(size),checksum}});if(actorId)await tx.auditLog.create({data:{userId:actorId,action:"BACKUP",entity:"BackupRecord",entityId:record.id,metadata:{size}}})});return record.id;
  }catch(error){await rm(output,{force:true}).catch(()=>{});await db.backupRecord.update({where:{id:record.id},data:{status:"FAILED"}});throw error}
  finally{await safeTempRemove(temp)}
}

export async function restoreLocalBackup(file:string){
  const absolute=path.resolve(file);const info=await stat(absolute);if(info.size<magic.length+12+16)throw new Error("Respaldo demasiado pequeño.");
  const temp=await mkdtemp(path.join(tmpdir(),"katio-restore-"));
  try{
    const handle=await open(absolute,"r");const header=Buffer.alloc(20),tag=Buffer.alloc(16);try{await handle.read(header,0,20,0);await handle.read(tag,0,16,info.size-16)}finally{await handle.close()}
    if(!header.subarray(0,8).equals(magic))throw new Error("Formato de respaldo inválido.");
    const decipher=createDecipheriv("aes-256-gcm",keyFromEnvironment(),header.subarray(8,20));decipher.setAuthTag(tag);const archive=path.join(temp,"archive.tar.gz");await pipeline(createReadStream(absolute,{start:20,end:info.size-17}),decipher,createWriteStream(archive));
    const names:string[]=[];await tar.t({file:archive,onReadEntry:entry=>{names.push(entry.path)}});
    if(!names.includes("database.dump")||!names.includes("manifest.json")||names.some(name=>name.startsWith("/")||name.includes("..")||!(/^(database\.dump|manifest\.json|attachments(?:\/[a-f0-9-]{36})?\/?)$/.test(name))))throw new Error("El contenido del respaldo no es válido.");
    await tar.x({file:archive,cwd:temp,strict:true});const manifest=JSON.parse(await readFile(path.join(temp,"manifest.json"),"utf8"));if(manifest.version!==1)throw new Error("Versión de respaldo incompatible.");
    const conn=database();await db.$disconnect();await command(await pgBinary("pg_restore"),["-h",conn.host,"-p",conn.port,"-U",conn.user,"-d",conn.name,"--clean","--if-exists","--no-owner","--no-privileges",path.join(temp,"database.dump")],conn.password);
    const namesOnDisk=await readdir(path.join(temp,"attachments"));await mkdir(storageRoot(),{recursive:true});for(const name of namesOnDisk){if(!/^[a-f0-9-]{36}$/.test(name))throw new Error("Nombre de adjunto inválido.");await copyFile(path.join(temp,"attachments",name),attachmentPath(name))}
    await db.user.updateMany({data:{sessionVersion:{increment:1}}});
  }finally{await safeTempRemove(temp)}
}
