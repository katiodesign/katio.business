"use client";
import { useEffect, useState } from "react";
import DatePicker from "@/components/date-picker";

export function HomeGreeting({ initialTime }: { initialTime: string }) {
  const [now, setNow] = useState(() => new Date(initialTime));
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(timer); }, []);
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "2-digit", hourCycle: "h23", timeZone: "America/Bogota" }).format(now));
  const greeting = hour >= 5 && hour < 12 ? "Buenos días" : hour >= 12 && hour < 19 ? "Buenas tardes" : "Buenas noches";
  return <div><h2>{greeting}</h2><p>{new Intl.DateTimeFormat("es-CO", { dateStyle: "full", timeZone: "America/Bogota" }).format(now)} · Qué requiere tu atención primero</p></div>;
}
export function HomeMonthPicker({ month }: { month: string }) {
  return <form><DatePicker type="month" aria-label="Mes del resumen" name="month" defaultValue={month} onValueChange={(_value,input) => input.form?.requestSubmit()}/></form>;
}
