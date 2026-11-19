import "dotenv/config";
import path from "node:path";
import {createLocalBackup,restoreLocalBackup} from "../src/lib/backups";
const file=process.argv[2],confirmation=process.argv[3];
if(!file||confirmation!=="--confirmar-reemplazo"){console.error('Uso: pnpm restore -- "ruta-del-archivo.katio" --confirmar-reemplazo');process.exit(1)}
async function main(){const absolute=path.resolve(file);console.log("Creando respaldo preventivo del estado actual...");const preventive=await createLocalBackup();console.log(`Respaldo preventivo: ${preventive}`);await restoreLocalBackup(absolute);console.log("Restauración completa. Reinicia la aplicación e inicia sesión de nuevo.")}
main().catch(error=>{console.error(error instanceof Error?error.message:"No fue posible restaurar.");process.exitCode=1});
