"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm({ destination = "/inicio" }: { destination?: string }) {
  const [visible, setVisible] = useState(false);
  const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", { email: data.get("email"), password: data.get("password"), remember: data.get("remember") ? "true" : "false", redirect: false });
      if (!result?.ok) setError("No fue posible iniciar sesión. Revisa tus datos o intenta más tarde.");
      else { router.replace(destination); router.refresh(); }
    } catch { setError("No fue posible iniciar sesión. Intenta de nuevo."); }
    finally { setPending(false); }
  }
  return <form className="stack" method="post" onSubmit={submit}><label>Correo electrónico<span className="access-field"><img src="/figma/access-mail.svg" alt=""/><input name="email" type="email" placeholder="correo@empresa.com" autoComplete="username" required /></span></label><label>Contraseña<span className="password-field access-field"><img src="/figma/access-lock.svg" alt=""/><input name="password" type={visible ? "text" : "password"} autoComplete="current-password" required /><button type="button" className="icon-button" onClick={() => setVisible(!visible)} aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label><div className="split-row"><label className="check-label"><input type="checkbox" name="remember"/>Recordarme</label><Link className="text-link" href="/acceso/recuperar">¿Olvidaste tu contraseña?</Link></div>{error && <p className="error" role="alert">{error}</p>}<button className="button primary wide" disabled={pending}>{pending ? "Ingresando…" : "Iniciar sesión"}</button></form>;
}
