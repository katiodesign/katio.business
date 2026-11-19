import { requireUser } from "@/lib/access";
import { AppChrome } from "@/components/app-chrome";
import { notificationView } from "@/lib/notification-view";
export default async function PrivateLayout({children}:{children:React.ReactNode}) {
  const user=await requireUser(),roles=user.roles.map(r=>r.role);
  const alerts=await notificationView(user.id,roles);
  return <AppChrome name={user.name} email={user.email} roles={roles} theme={user.theme} alerts={alerts}>{children}</AppChrome>;
}
