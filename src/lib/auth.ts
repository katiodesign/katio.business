import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";

const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(256) });
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/acceso" },
  providers: [CredentialsProvider({
    name: "Acceso",
    credentials: { email: { label: "Correo", type: "email" }, password: { label: "Contraseña", type: "password" }, remember: { label: "Recordarme", type: "text" } },
    async authorize(credentials) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) return null;
      const email = parsed.data.email.toLowerCase();
      const key = createHash("sha256").update(email).digest("hex");
      return db.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
        const attempt = await tx.loginAttempt.findUnique({ where: { key } });
        if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) return null;
        const user = await tx.user.findUnique({ where: { email } });
        // La comparación se ejecuta también para cuentas inexistentes.
        const matches = await compare(parsed.data.password, user?.passwordHash ?? "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYEDkKZ6gPLB.9x/cTXlbSMBGwhb9j9a");
        if (!user || !user.active || !matches) {
          const failures = (attempt?.lockedUntil && attempt.lockedUntil <= new Date() ? 0 : attempt?.failures ?? 0) + 1;
          await tx.loginAttempt.upsert({ where: { key }, create: { key, failures, lockedUntil: failures >= 5 ? new Date(Date.now() + 15 * 60_000) : null }, update: { failures, lockedUntil: failures >= 5 ? new Date(Date.now() + 15 * 60_000) : null } });
          return null;
        }
        await tx.loginAttempt.deleteMany({ where: { key } });
        await tx.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        const session = await tx.authSession.create({ data: { userId: user.id, expiresAt: new Date(Date.now() + (credentials?.remember === "true" ? 30 * 24 : 8) * 60 * 60_000) } });
        return { id: user.id, name: user.name, email: user.email, sessionVersion: user.sessionVersion, sessionId: session.id };
      });
    }
  })],
  callbacks: {
    async jwt({ token, user }) { if (user) { token.userId = user.id; token.sessionVersion = user.sessionVersion; token.sessionId = user.sessionId; } return token; },
    async session({ session, token }) { if (session.user && typeof token.userId === "string" && typeof token.sessionVersion === "number") { session.user.id = token.userId; session.user.sessionVersion = token.sessionVersion; session.user.sessionId = typeof token.sessionId === "string" ? token.sessionId : undefined; } return session; }
  },
  events: { async signOut({ token }) { if (typeof token?.sessionId === "string") await db.authSession.updateMany({ where: { id: token.sessionId, revokedAt: null }, data: { revokedAt: new Date() } }); } }
};

