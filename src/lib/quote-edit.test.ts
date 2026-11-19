import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks=vi.hoisted(()=>{
 const tx={
  $executeRaw:vi.fn(async()=>0),
  quote:{findUniqueOrThrow:vi.fn(),update:vi.fn(async()=>({}))},
  quoteLine:{deleteMany:vi.fn(async()=>({count:1}))},
  auditLog:{create:vi.fn(async (_arg:{data:{action:string;metadata:{previous:{customerName:string;lines:{name:string}[]}}}})=>({}))},
  catalogBundleComponent:{findMany:vi.fn(async()=>[])},
  client:{findFirst:vi.fn(async()=>({id:"cmvalidclient00000000000001"}))},
 };
 return {tx,transaction:vi.fn(async (fn:(value:typeof tx)=>Promise<unknown>)=>fn(tx))};
});
vi.mock("@/lib/db",()=>({db:{$transaction:mocks.transaction}}));
vi.mock("@/lib/access",()=>({requirePermission:vi.fn(async()=>({id:"cmvaliduser0000000000000001",roles:[{role:{name:"SUPER_ADMIN",permissions:[]}}]}))}));
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error(`REDIRECT:${url}`)}}));
import { updateQuote } from "./actions";

const quoteId="cmvalidquote000000000000001";
function form(){const data=new FormData();for(const [key,value] of Object.entries({clientId:"",customerName:"Cliente de prueba",businessName:"",identification:"",email:"",phone:"",address:"",issuedAt:"2026-01-15",expiresAt:"",multiplier:"1",discountType:"FIXED",discount:"0",observations:"",terms:"",lines:JSON.stringify([{catalogId:"",name:"Servicio",description:"",contractType:"ONE_TIME",periodicity:"",quantity:"1",unitPrice:"100"}])}))data.set(key,value);return data}
function existing(overrides:Record<string,unknown>={}){return {id:quoteId,number:101,status:"DRAFT",customerName:"Nombre anterior",clientId:null,deletedAt:null,paidAt:null,convertedAt:null,issuedAt:new Date("2026-01-15T17:00:00Z"),templateSnapshot:{companyName:"Empresa anterior"},lines:[{name:"Servicio anterior",quantity:"1",unitPrice:"100"}],...overrides}}

describe("edición de borradores con PDF previo",()=>{
 beforeEach(()=>{vi.clearAllMocks();mocks.tx.quote.findUniqueOrThrow.mockResolvedValue(existing())});
 it("conserva los datos de la versión anterior antes de guardar el borrador",async()=>{
  await expect(updateQuote(quoteId,form())).rejects.toThrow(`REDIRECT:/cotizaciones/${quoteId}`);
  const revision=mocks.tx.auditLog.create.mock.calls.find(([arg])=>arg.data.action==="QUOTE_REVISION");
  expect(revision?.[0].data.metadata.previous.customerName).toBe("Nombre anterior");
  expect(revision?.[0].data.metadata.previous.lines[0].name).toBe("Servicio anterior");
  expect(mocks.tx.quote.update).toHaveBeenCalledOnce();
  expect(mocks.tx.quoteLine.deleteMany).toHaveBeenCalledOnce();
 });
 it("rechaza una cotización pagada sin borrar sus líneas",async()=>{
  mocks.tx.quote.findUniqueOrThrow.mockResolvedValue(existing({paidAt:new Date()}));
  await expect(updateQuote(quoteId,form())).rejects.toThrow(/borradores activos/);
  expect(mocks.tx.quoteLine.deleteMany).not.toHaveBeenCalled();
  expect(mocks.tx.quote.update).not.toHaveBeenCalled();
 });
});
