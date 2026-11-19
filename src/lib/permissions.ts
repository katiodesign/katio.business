export const PERMISSIONS = [
  "dashboard.read", "catalog.read", "catalog.create", "catalog.update", "catalog.export",
  "clients.read", "clients.create", "clients.update", "quotes.read", "quotes.create", "quotes.update", "quotes.delete",
  "invoices.read", "invoices.create", "invoices.update", "finance.read", "finance.create", "work.read", "work.update",
  "subscriptions.read", "subscriptions.update", "expenses.read", "expenses.create", "expenses.update",
  "credentials.read", "credentials.write", "credentials.reveal", "users.manage", "settings.manage", "backups.manage", "audit.read"
] as const;
export type PermissionKey = (typeof PERMISSIONS)[number];

export function canAccess(roles: { name: string; permissions: { permission: { key: string } }[] }[], permission: PermissionKey) {
  return roles.some((role) => role.name === "SUPER_ADMIN" || role.permissions.some((p) => p.permission.key === permission));
}
