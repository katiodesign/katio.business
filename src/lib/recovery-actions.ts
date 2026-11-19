"use server";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/secrets";
import {getGmailConfig,sendRecoveryEmail} from "@/lib/gmail";

export type RecoveryState = { error?: string; sent?: boolean; completed?: boolean };
export async function requestRecovery(_: RecoveryState, form: FormData): Promise<RecoveryState> {
  const parsed = z.string().trim().email().max(254).safeParse(form.get("email"));
  if (!parsed.success) return { error: "Escribe un correo electrónico válido." };
  const email = parsed.data.toLowerCase();
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const key = createHash("sha256").update(`recovery:${email}`).digest("hex");
  try {
    const record = await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
      const attempt = await tx.loginAttempt.findUnique({ where: { key } });
      if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) return null;
      await tx.loginAttempt.upsert({ where: { key }, create: { key, failures: 1, lockedUntil: new Date(Date.now() + 60_000) }, update: { lockedUntil: new Date(Date.now() + 60_000) } });
      const user = await tx.user.findUnique({ where: { email } });
      if (!user?.active) return null;
      await tx.passwordReset.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
      return tx.passwordReset.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60_000) } });
    });
    if (record) {
      const origin = new URL(process.env.NEXTAUTH_URL || "http://127.0.0.1:3000").origin;
      const url = `${origin}/acceso/restablecer?token=${token}`;
      const config = await getGmailConfig();
      if(config) await sendRecoveryEmail(config,email,url);
      else if(process.env.NODE_ENV!=="production") {
        const directory = path.resolve(process.env.STORAGE_PATH || "./private-storage", "buzon-local");
        await mkdir(directory, { recursive: true });
        await writeFile(path.join(directory, `${record.id}.mail`), encryptSecret(JSON.stringify({ to: email, subject: "Restablecer contraseña · Katio Business", url, expiresAt: record.expiresAt })), { mode: 0o600 });
      }
    }
    return { sent: true };
  } catch { return { sent: true }; }
}

export async function resetPassword(_: RecoveryState, form: FormData): Promise<RecoveryState> {
  const parsed = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password: z.string().min(14).max(128), confirm: z.string() }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Usa el enlace recibido y una contraseña de al menos 14 caracteres." };
  if (parsed.data.password !== parsed.data.confirm) return { error: "Las contraseñas no coinciden." };
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  try {
    const changed = await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${tokenHash}))`;
      const record = await tx.passwordReset.findUnique({ where: { tokenHash }, include: { user: true } });
      if (!record || record.usedAt || record.expiresAt <= new Date() || !record.user.active) return false;
      const consumed = await tx.passwordReset.updateMany({ where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
      if (!consumed.count) return false;
      const passwordHash = await hash(parsed.data.password, 12);
      await tx.user.update({ where: { id: record.userId }, data: { passwordHash, sessionVersion: { increment: 1 } } });
      await tx.authSession.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.auditLog.create({ data: { userId: record.userId, entity: "User", entityId: record.userId, action: "PASSWORD_RESET" } });
      return true;
    });
    return changed ? { completed: true } : { error: "El enlace venció o ya fue utilizado. Solicita nuevas instrucciones." };
  } catch { return { error: "No fue posible cambiar la contraseña. Intenta de nuevo." }; }
}
