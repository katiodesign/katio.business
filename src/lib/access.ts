import { getServerSession } from "next-auth";
import { redirect, forbidden } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccess, type PermissionKey } from "@/lib/permissions";

export async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.sessionId) return null;
  const activeSession = await db.authSession.findUnique({ where: { id: session.user.sessionId } });
  if (!activeSession || activeSession.userId !== session.user.id || activeSession.revokedAt || activeSession.expiresAt <= new Date()) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id }, include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } });
  if (!user || !user.active || user.sessionVersion !== session.user.sessionVersion) return null;
  return user;
}
export async function requireUser() { const user = await currentUser(); if (!user) redirect("/acceso"); return user; }
export async function requirePermission(permission: PermissionKey) {
  const user = await requireUser();
  if (!canAccess(user.roles.map((r) => r.role), permission)) {
    await db.auditLog.create({ data: { userId: user.id, action: "DENIED", entity: permission } });
    forbidden();
  }
  return user;
}
