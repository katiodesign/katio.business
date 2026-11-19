import { AccessShell } from "@/components/access-shell";
import RecoveryForm from "../recovery-form";
export default async function ResetPage({searchParams}:{searchParams:Promise<{token?:string}>}) { const {token} = await searchParams; return <AccessShell><RecoveryForm token={token || "invalid"}/></AccessShell>; }
