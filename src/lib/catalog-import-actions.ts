"use server";
import {redirect} from "next/navigation";
import {z} from "zod";
import {db} from "@/lib/db";
import {requirePermission} from "@/lib/access";
import {importRowSchema,readCatalogFile,type ImportRow} from "@/lib/catalog-transfer";

export type PreviewState={rows:ImportRow[];errors:{row:number;message:string}[];create:number;update:number;duplicate:number;message:string;kinds?:Record<string,"create"|"update">};
async function authorized(){const actor=await requirePermission("catalog.create");await requirePermission("catalog.update");await requirePermission("finance.read");return actor}
export async function previewCatalogImport(_previous:PreviewState,form:FormData):Promise<PreviewState>{
  await authorized();const file=form.get("file");if(!(file instanceof File)||!file.size)return {rows:[],errors:[],create:0,update:0,duplicate:0,message:"Selecciona un archivo."};
  try{
    const {rows,errors}=await readCatalogFile(file);const current=await db.catalogItem.findMany({select:{id:true,name:true,category:true,isBundle:true}});
    let create=0,update=0,duplicate=0;const accepted:ImportRow[]=[];const seenIds=new Set<string>(),seenNames=new Set<string>();
    for(const [index,row] of rows.entries()){
      const nameKey=`${row.name.toLowerCase()}|${row.category.toLowerCase()}`;const existing=row.id?current.find(c=>c.id===row.id):null;
      if((row.id&&seenIds.has(row.id))||seenNames.has(nameKey)||(!existing&&current.some(c=>`${c.name.toLowerCase()}|${c.category.toLowerCase()}`===nameKey))){duplicate++;errors.push({row:index+2,message:"Duplicado por identificador o nombre y categoría."});continue}
      if(row.id)seenIds.add(row.id);seenNames.add(nameKey);if(existing)update++;else create++;accepted.push(row);
    }
    const validComponents=new Set([...current.filter(item=>!item.isBundle&&!accepted.some(row=>row.id===item.id&&row.isBundle)).map(item=>item.id),...accepted.filter(item=>!item.isBundle&&item.id).map(item=>item.id)]);
    const validRows=accepted.filter(row=>{if(row.components.every(component=>validComponents.has(component.id)&&component.id!==row.id))return true;errors.push({row:rows.indexOf(row)+2,message:"Un componente no existe o es un compuesto."});if(row.id&&current.some(item=>item.id===row.id))update--;else create--;return false});
    return {rows:validRows,errors,create,update,duplicate,kinds:Object.fromEntries(validRows.map((row,index)=>[String(index),row.id&&current.some(item=>item.id===row.id)?"update":"create"])),message:"Vista previa lista. Confirma para aplicar los cambios."};
  }catch(error){return {rows:[],errors:[],create:0,update:0,duplicate:0,message:error instanceof Error?error.message:"Archivo inválido."}}
}
export async function confirmCatalogImport(form:FormData){
  const actor=await authorized();const serialized=String(form.get("rows")||"");if(serialized.length>1_000_000)throw new Error("Importación demasiado grande.");
  const parsed=JSON.parse(serialized) as unknown;if(!Array.isArray(parsed)||parsed.length>500)throw new Error("Filas inválidas.");
  const indexes=form.getAll("selected").map(value=>z.coerce.number().int().nonnegative().parse(value));
  if(!indexes.length||new Set(indexes).size!==indexes.length||indexes.some(index=>index>=parsed.length))throw new Error("Selecciona las filas válidas que deseas importar.");
  const rows=indexes.map(index=>importRowSchema.parse(parsed[index]));
  const ids=rows.map(row=>row.id).filter(Boolean),names=rows.map(row=>`${row.name.toLowerCase()}|${row.category.toLowerCase()}`);if(new Set(ids).size!==ids.length||new Set(names).size!==names.length)throw new Error("Hay elementos repetidos en el archivo.");
  await db.$transaction(async tx=>{
    const resolvedIds:string[]=[];
    for(const row of rows){
      const id=row.id,data=row;const existing=id?await tx.catalogItem.findUnique({where:{id}}):null;
      const sameName=await tx.catalogItem.findFirst({where:{name:{equals:data.name,mode:"insensitive"},category:{equals:data.category,mode:"insensitive"},...(existing?{id:{not:existing.id}}:{})}});
      if(sameName)throw new Error(`Ya existe ${data.name} en ${data.category}.`);
      const payload={name:data.name,description:data.description,category:data.category,contractType:data.contractType,periodicity:data.contractType==="RECURRING"?data.periodicity||null:null,price:data.price,internalCost:data.internalCost,active:data.active,isBundle:data.isBundle,pricingHours:data.pricingHours||null,pricingDirectCost:data.pricingDirectCost||null,pricingManual:data.pricingManual,bundleFactor:data.bundleFactor};
      const item=existing?await tx.catalogItem.update({where:{id},data:payload}):await tx.catalogItem.create({data:{...payload,...(id?{id}:{})}});
      resolvedIds.push(item.id);
    }
    for(const [index,row] of rows.entries()){
      const bundleId=resolvedIds[index];await tx.catalogBundleComponent.deleteMany({where:{bundleId}});
      if(!row.isBundle)continue;
      const components=await tx.catalogItem.findMany({where:{id:{in:row.components.map(c=>c.id)},isBundle:false}});
      if(components.length!==row.components.length||row.components.some(c=>c.id===bundleId))throw new Error(`Componentes inválidos para ${row.name}.`);
      await tx.catalogBundleComponent.createMany({data:row.components.map(c=>({bundleId,componentId:c.id,quantity:c.quantity}))});
    }
    await tx.auditLog.create({data:{userId:actor.id,action:"IMPORT",entity:"CatalogItem",metadata:{rows:rows.length}}});
  },{timeout:30000});
  redirect("/catalogo");
}
