"use client";
import { useState } from "react";
import { revealCredential } from "@/lib/client-actions";
export default function CredentialReveal({ id }: { id: string }) {
  const [secret, setSecret] = useState<string | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  return <div className="credential-reveal"><code>{secret ?? "••••••••••••"}</code><button type="button" className="button secondary" disabled={busy} onClick={async()=>{if(secret){setSecret(null);return}setBusy(true);try{setSecret(await revealCredential(id));setError("")}catch{setError("No se pudo revelar la credencial.")}finally{setBusy(false)}}}>{secret ? "Ocultar" : busy ? "Revelando…" : "Revelar"}</button>{error && <span className="error">{error}</span>}</div>;
}
