import {access, mkdir} from "node:fs/promises";
import {constants} from "node:fs";
import path from "node:path";

const fail = message => { console.error(message); process.exit(1); };
const key = process.env.MASTER_KEY || "";
if (!/^[A-Za-z0-9+/]{43}=$/.test(key) || Buffer.from(key,"base64").length !== 32) fail("MASTER_KEY debe contener 32 bytes codificados en base64.");
if ((process.env.NEXTAUTH_SECRET || "").length < 32) fail("NEXTAUTH_SECRET debe tener al menos 32 caracteres.");
try { if (new URL(process.env.NEXTAUTH_URL || "").protocol !== "https:") throw new Error(); }
catch { fail("NEXTAUTH_URL debe ser una dirección HTTPS válida."); }
try { const url = new URL(process.env.DATABASE_URL || ""); if (!["postgres:","postgresql:"].includes(url.protocol)) throw new Error(); }
catch { fail("DATABASE_URL debe ser una dirección PostgreSQL válida."); }
if (!path.isAbsolute(process.env.STORAGE_PATH || "")) fail("STORAGE_PATH debe ser una ruta absoluta y persistente.");
try { await mkdir(process.env.STORAGE_PATH, {recursive:true}); await access(process.env.STORAGE_PATH, constants.W_OK); }
catch { fail("El almacenamiento no existe o no permite escritura para el usuario de la aplicación."); }
