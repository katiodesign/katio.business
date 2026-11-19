import { PageHeader } from "@/components/app-chrome";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import PermissionMatrix from "@/components/permission-matrix";
import ActionDialog from "@/components/action-dialog";
import { createUser, toggleUser, updateUser } from "@/lib/settings-actions";
import { date } from "@/lib/format";

export default async function Users() {
  const actor = await requirePermission("users.manage");
  if (!actor.roles.some(r => r.role.name === "SUPER_ADMIN")) throw new Error("Acceso restringido.");
  const [users, roles] = await Promise.all([
    db.user.findMany({ include: { roles: { include: { role: true } } }, orderBy: { createdAt: "asc" } }),
    db.role.findMany({ where: { name: { in: ["ADMIN", "USER"] } }, include: { permissions: { include: { permission: true } } } }),
  ]);
  return <>
    <PageHeader><div><small>Inicio / Configuración / Usuarios</small><h1>Usuarios y permisos</h1></div></PageHeader>
    <div className="page-title"><div><h2>Usuarios, roles y permisos</h2><p>Administra las cuentas y sus permisos de acceso.</p></div>
      <ActionDialog label="Crear usuario" title="Crear usuario" variant="primary"><form action={createUser} className="stack"><label>Nombre<input name="name" placeholder="Nombre de usuario" required /></label><label>Correo<input name="email" type="email" placeholder="correo@ejemplo.com" required /></label><label>Contraseña temporal<input name="password" type="password" minLength={14} required /></label><label>Rol<select name="role"><option value="USER">Usuario</option><option value="ADMIN">Administrador</option></select></label><button className="button primary">Crear cuenta</button></form></ActionDialog>
    </div>
    <section className="card table-card catalog-table"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th>Acciones</th></tr></thead><tbody>{users.map(user => {
      const superAdmin = user.roles.some(r => r.role.name === "SUPER_ADMIN");
      const initials = user.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
      return <tr key={user.id}><td><small>Usuario</small><div className="form-actions" style={{ marginTop: 0 }}><span className="avatar" aria-label={`Avatar de ${user.name}`}>{initials}</span><div><strong>{user.name}</strong><p className="muted">{user.email}</p></div></div></td><td><small>Rol</small>{superAdmin ? "Superadministrador" : user.roles.some(r => r.role.name === "ADMIN") ? "Administrador" : "Usuario"}</td><td><small>Estado</small><span className={`badge ${user.active ? "success" : ""}`}>{user.active ? "Activo" : "Inactivo"}</span></td><td><small>Último acceso</small>{user.lastLoginAt ? date(user.lastLoginAt) : "Nunca"}</td><td><small>Acciones</small>{!superAdmin && <div className="form-actions" style={{ marginTop: 0 }}><ActionDialog label="Editar" title={`Editar usuario: ${user.name}`}><form action={updateUser.bind(null, user.id)} className="stack"><label>Nombre<input name="name" defaultValue={user.name} required /></label><label>Correo<input name="email" type="email" defaultValue={user.email} required /></label><label>Rol<select name="role" defaultValue={user.roles[0]?.role.name}><option value="USER">Usuario</option><option value="ADMIN">Administrador</option></select></label><label>Nueva contraseña (opcional)<input name="password" type="password" minLength={14} autoComplete="new-password" /></label><button className="button primary">Guardar cuenta y revocar sesiones</button></form></ActionDialog><ActionDialog label={user.active ? "Desactivar" : "Reactivar"} title={user.active ? "Desactivar usuario" : "Reactivar usuario"}><p>{user.active ? "La cuenta perderá acceso y sus sesiones activas se cerrarán." : "La cuenta podrá volver a iniciar sesión."}</p><form action={toggleUser.bind(null, user.id)} style={{ marginTop: 16 }}><input type="hidden" name="active" value={String(!user.active)} /><button className="button primary">{user.active ? "Desactivar usuario" : "Reactivar usuario"}</button></form></ActionDialog></div>}</td></tr>;
    })}</tbody></table></section>
    <PermissionMatrix values={roles.map(role => ({ name: role.name as "ADMIN" | "USER", permissions: role.permissions.map(p => p.permission.key) }))} />
  </>;
}
