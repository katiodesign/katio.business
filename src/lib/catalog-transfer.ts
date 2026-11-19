import ExcelJS from "exceljs";
import { z } from "zod";
import { Readable } from "node:stream";
import { validateXlsx } from "./validate-xlsx";

export const columns = ["id","name","description","category","contractType","periodicity","price","internalCost","active","isBundle","components"] as const;
export type ImportRow = { id:string; name:string; description:string; category:string; contractType:"ONE_TIME"|"RECURRING"; periodicity:""|"MONTHLY"|"QUARTERLY"|"YEARLY"; price:string; internalCost:string; active:boolean; isBundle:boolean; components:{id:string;quantity:string}[] };
const amount = z.string().regex(/^\d+(\.\d{1,2})?$/);
export const importRowSchema = z.object({ id:z.union([z.literal(""),z.cuid()]), name:z.string().trim().min(2).max(180), description:z.string().trim().max(5000), category:z.string().trim().min(2).max(100), contractType:z.enum(["ONE_TIME","RECURRING"]), periodicity:z.enum(["","MONTHLY","QUARTERLY","YEARLY"]), price:amount, internalCost:amount, active:z.boolean(), isBundle:z.boolean(), components:z.array(z.object({id:z.cuid(),quantity:amount})).max(100) }).superRefine((row,ctx)=>{if(row.contractType==="RECURRING"&&!row.periodicity)ctx.addIssue({code:"custom",message:"Falta la periodicidad."});if(row.isBundle&&!row.components.length)ctx.addIssue({code:"custom",message:"Un compuesto requiere componentes."});if(!row.isBundle&&row.components.length)ctx.addIssue({code:"custom",message:"Un elemento individual no tiene componentes."});if(new Set(row.components.map(c=>c.id)).size!==row.components.length)ctx.addIssue({code:"custom",message:"Componentes repetidos."});if(row.components.some(c=>!Number.isSafeInteger(Number(c.quantity))||Number(c.quantity)<=0))ctx.addIssue({code:"custom",message:"Cantidades inválidas."})});

export async function readCatalogFile(file: File) {
  if (file.size > 2_000_000) throw new Error("El archivo supera 2 MB.");
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension!=="csv"&&extension!=="xlsx") throw new Error("Usa un archivo CSV o XLSX.");
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  if (extension==="xlsx") {
    await validateXlsx(buffer);
    await workbook.xlsx.load(buffer as never);
  }
  else await workbook.csv.read(Readable.from([buffer]));
  const sheet=workbook.worksheets[0]; if(!sheet)throw new Error("El archivo está vacío.");
  const header=columns.map((_,i)=>String(sheet.getRow(1).getCell(i+1).text).trim());
  if(header.some((value,i)=>value!==columns[i]))throw new Error(`Encabezados requeridos: ${columns.join(", ")}`);
  if(sheet.rowCount>501)throw new Error("Máximo 500 filas por importación.");
  const rows:ImportRow[]=[];const errors:{row:number;message:string}[]=[];
  for(let n=2;n<=sheet.rowCount;n++){
    const cells=columns.map((_,i)=>sheet.getRow(n).getCell(i+1).text.trim());
    if(cells.every(c=>!c))continue;
    let components:unknown=[];try{components=cells[10]?JSON.parse(cells[10]):[]}catch{errors.push({row:n,message:"Componentes JSON inválidos."});continue}
    const raw={id:cells[0],name:cells[1],description:cells[2],category:cells[3],contractType:cells[4],periodicity:cells[5],price:cells[6],internalCost:cells[7],active:cells[8].toLowerCase()==="true"||cells[8]==="1",isBundle:cells[9].toLowerCase()==="true"||cells[9]==="1",components};
    const result=importRowSchema.safeParse(raw);
    if(result.success)rows.push(result.data);
    else errors.push({row:n,message:result.error.issues.map(i=>i.message).join("; ")});
  }
  return {rows,errors};
}
