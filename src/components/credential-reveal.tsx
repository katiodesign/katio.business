"use client";
import { useState } from "react";
import {Eye,EyeOff} from "lucide-react";
import { revealCredential } from "@/lib/client-actions";
export default function CredentialReveal({ id }: { id: string }) {
  const [secret, setSecret] = useState<string | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  return <div className="credential-reveal"><code>{secret ?? "••••••••••••"}</code><button type="button" className="icon-button" aria-label={secret?"Ocultar contraseña":"Revelar contraseña"} title={secret?"Ocultar contraseña":"Revelar contraseña"} disabled={busy} onClick={async()=>{if(secret){setSecret(null);return}setBusy(true);try{setSecret(await revealCredential(id));setError("")}catch{setError("No se pudo revelar la credencial.")}finally{setBusy(false)}}}>{secret ? <EyeOff size={16}/> : <Eye size={16}/>}</button>{error && <span className="error">{error}</span>}</div>;
}
