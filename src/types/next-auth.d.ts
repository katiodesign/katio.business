import "next-auth";
declare module "next-auth" {
  interface User { sessionVersion: number; sessionId?: string }
  interface Session { user: { id: string; sessionVersion: number; sessionId?: string; name?: string | null; email?: string | null; image?: string | null } }
}
