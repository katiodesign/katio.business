import {notFound} from "next/navigation";
import {PageHeader} from "@/components/app-chrome";
import CredentialForm from "@/components/credential-form";
import {requirePermission} from "@/lib/access";
import {canAccess} from "@/lib/permissions";
import {db} from "@/lib/db";
export default async function NewCredential({params}:{params:Promise<{id:string}>}) {
 const actor=await requirePermission("credentials.write"),{id}=await params;
 const client=await db.client.findFirst({where:{id,archivedAt:null},select:{id:true,name:true}});if(!client)notFound();
 const subscriptions=canAccess(actor.roles.map(r=>r.role),"subscriptions.read")?await db.subscription.findMany({where:{clientId:id},select:{id:true,name:true},orderBy:{name:"asc"}}):[];
 return <><PageHeader><div><small>Clientes / {client.name} / Credenciales</small><h1>Credenciales y accesos</h1></div></PageHeader><CredentialForm clientId={id} subscriptions={subscriptions}/></>;
}
