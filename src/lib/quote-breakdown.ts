export type SavedCommercialComponent={id:string;name:string;quantity:string};
export function preservedCommercialComponents(catalogId:string|undefined,ids:string[],previous:{catalogId:string|null;commercialComponents:unknown}[]):SavedCommercialComponent[]{
 for(const line of previous){
  if(!catalogId||line.catalogId!==catalogId||!Array.isArray(line.commercialComponents))continue;
  const parts=line.commercialComponents.filter((part):part is SavedCommercialComponent=>!!part&&typeof part==="object"&&!Array.isArray(part)&&typeof part.id==="string"&&typeof part.name==="string"&&typeof part.quantity==="string");
  if(parts.length===ids.length&&ids.every(id=>parts.some(part=>part.id===id)))return ids.map(id=>parts.find(part=>part.id===id)!);
 }
 throw new Error("No tienes permiso para añadir componentes del catálogo.");
}
