import { redirect } from "next/navigation";
import { currentUser } from "@/lib/access";
import { safeDestination } from "@/lib/safe-destination";
import ReferenceLogin from "./reference-login";
export default async function LoginPage({searchParams}:{searchParams:Promise<{callbackUrl?:string}>}) {
  const {callbackUrl}=await searchParams;const destination=safeDestination(callbackUrl);
  if(await currentUser())redirect(destination);
  return <ReferenceLogin destination={destination}/>;
}
