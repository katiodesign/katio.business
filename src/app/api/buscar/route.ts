import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/access";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
export async function GET(request:NextRequest) {
  const actor=await currentUser();if(!actor)return NextResponse.json({error:"Inicia sesión."},{status:401});
  const q=(request.nextUrl.searchParams.get("q")||"").trim().slice(0,100);
  if(q.length<2)return NextResponse.json({groups:[]});
  const roles=actor.roles.map(r=>r.role),contains={contains:q,mode:"insensitive" as const},number=Number(q.replace(/^(COT|FAC|F)-0*/i,""));
  const [quotes,clients,works,subs,items,invoices,expenses]=await Promise.all([
    canAccess(roles,"quotes.read")?db.quote.findMany({where:{deletedAt:null,OR:[{customerName:contains},{identification:contains},...(Number.isSafeInteger(number)?[{number}]:[])]},take:6,select:{id:true,number:true,customerName:true}}):[],
    canAccess(roles,"clients.read")?db.client.findMany({where:{archivedAt:null,OR:[{name:contains},{identification:contains}]},take:6,select:{id:true,name:true}}):[],
    canAccess(roles,"work.read")?db.workItem.findMany({where:{OR:[{name:contains},{customerName:contains},{id:contains}]},take:6,select:{id:true,name:true}}):[],
    canAccess(roles,"subscriptions.read")?db.subscription.findMany({where:{OR:[{name:contains},{client:{name:contains}},{id:contains}]},take:6,select:{id:true,name:true}}):[],
    canAccess(roles,"catalog.read")?db.catalogItem.findMany({where:{OR:[{name:contains},{id:contains}]},take:6,select:{id:true,name:true}}):[],
    canAccess(roles,"invoices.read")?db.invoice.findMany({where:{OR:[{quote:{customerName:contains}},...(Number.isSafeInteger(number)?[{number}]:[])]},take:6,select:{id:true,number:true}}):[],
    canAccess(roles,"expenses.read")?db.operatingExpense.findMany({where:{name:contains,deletedAt:null},take:6,select:{id:true,name:true}}):[]
  ]);
  const groups=[{name:"Cotizaciones",items:quotes.map(x=>({label:`COT-${String(x.number).padStart(4,"0")} · ${x.customerName}`,href:`/cotizaciones/${x.id}`}))},...[["Clientes","clientes",clients],["Trabajos puntuales","trabajos",works],["Contrataciones","contrataciones",subs],["Catálogo","catalogo",items],["Gastos","gastos",expenses]].map(([name,route,rows])=>({name,items:(rows as {id:string;name:string}[]).map(x=>({label:x.name,href:`/${route}/${x.id}`}))})),{name:"Facturas",items:invoices.map(x=>({label:`FAC-${String(x.number).padStart(4,"0")}`,href:`/facturacion/${x.id}`}))}].filter(g=>g.items.length);
  return NextResponse.json({groups},{headers:{"Cache-Control":"private, no-store"}});
}
