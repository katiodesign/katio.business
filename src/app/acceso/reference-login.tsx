"use client";
import {useState,useSyncExternalStore} from "react";
import {useRouter} from "next/navigation";
import {signIn} from "next-auth/react";
import {ScreenContext} from "@/figma-reference/controls";
import DesktopLogin from "@/figma-reference/screens/30-3";
import MobileLogin from "@/figma-reference/screens/229-399";
const subscribe=(notify:()=>void)=>{const media=window.matchMedia("(max-width: 720px)");media.addEventListener("change",notify);return()=>media.removeEventListener("change",notify)};
const isMobile=()=>window.matchMedia("(max-width: 720px)").matches;
const serverMobile=()=>false;
const subscribeHydration=()=>()=>{};
const hydratedSnapshot=()=>true;
const serverHydration=()=>false;
export default function ReferenceLogin({destination}:{destination:string}) {
  const router=useRouter();const [error,setError]=useState("");const [pending,setPending]=useState(false);
  const mobile=useSyncExternalStore(subscribe,isMobile,serverMobile);
  const hydrated=useSyncExternalStore(subscribeHydration,hydratedSnapshot,serverHydration);
  const go=(target:string)=>router.push(target);
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(pending)return;setPending(true);setError("");const data=new FormData(event.currentTarget);try{const result=await signIn("credentials",{email:data.get("email"),password:data.get("password"),remember:data.get("remember")?"true":"false",redirect:false});if(result?.ok){router.replace(destination);router.refresh()}else setError("No fue posible iniciar sesión. Revisa tus datos o intenta más tarde.")}catch{setError("No fue posible iniciar sesión. Intenta de nuevo.")}finally{setPending(false)}}
  const context={path:"/acceso",go,run:()=>{},filter:"",setFilter:()=>{},setSearch:()=>{},setGlobalSearch:()=>{}};
  return <ScreenContext.Provider value={context}><main className="screen reference-login" data-access="true" data-mobile-design={mobile||undefined} style={{"--frame-height":"900px"} as React.CSSProperties}>{hydrated?<form className="screen-form" onSubmit={submit}>{mobile?<MobileLogin/>:<DesktopLogin/>}{error&&<p className="reference-error" role="alert">{error}</p>}{pending&&<p className="reference-error" role="status">Ingresando…</p>}</form>:<p className="muted" role="status">Cargando acceso…</p>}</main></ScreenContext.Provider>;
}
