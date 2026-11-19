"use client";
import Link from "next/link";
import { useActionState } from "react";
import { requestRecovery, resetPassword } from "@/lib/recovery-actions";
export default function RecoveryForm({ token }: { token?: string }) {
  const [state, action, pending] = useActionState(token ? resetPassword : requestRecovery, {});
  if (state.completed) return <div className="stack"><h2>Contraseña actualizada</h2><p>Inicia sesión con tu nueva contraseña.</p><Link className="button primary" href="/acceso">Volver a iniciar sesión</Link></div>;
  if (state.sent) return <div className="stack"><h2>Revisa tu correo</h2><p>Si tu correo está registrado y el servicio de correo está configurado, recibirás instrucciones.</p><Link className="button primary" href="/acceso">Volver a iniciar sesión</Link><p className="notice">El enlace vence en 30 minutos. Si no recibes el correo, contacta al administrador.</p></div>;
  return <><h2>{token ? "Nueva contraseña" : "Restablecer contraseña"}</h2><p>{token ? "Elige una contraseña de al menos 14 caracteres." : "Recibe un enlace para cambiar tu contraseña."}</p><form action={action} className="stack">{token ? <><input type="hidden" name="token" value={token}/><label>Nueva contraseña<input type="password" name="password" autoComplete="new-password" minLength={14} maxLength={128} required/></label><label>Confirmar contraseña<input type="password" name="confirm" autoComplete="new-password" minLength={14} maxLength={128} required/></label></> : <label>Correo electrónico<input type="email" name="email" autoComplete="email" placeholder="usuario@empresa.com" required/></label>}{state.error && <p role="alert" className="error">{state.error}</p>}<button disabled={pending} className="button primary">{pending ? "Procesando…" : token ? "Guardar contraseña" : "Enviar instrucciones"}</button><Link className="text-link" href="/acceso">Volver a iniciar sesión</Link></form><p className="login-note">Usa el correo registrado por el superadministrador.</p></>;
}

