"use client";
import Link from "next/link";
import DatePicker from "@/components/date-picker";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Modal } from "@/components/modal";

type Field = { name: string; label: string; type?: "date" | "text"; options?: { value: string; label: string }[] };
export default function FilterDialog({ base, fields, values, preserved = {} }: { base: string; fields: Field[]; values: Record<string,string>; preserved?: Record<string,string> }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" className="button secondary" onClick={() => setOpen(true)}><SlidersHorizontal size={16}/>Filtros</button><Modal open={open} onClose={() => setOpen(false)} title="Filtros"><form action={base} className="stack">{Object.entries(preserved).map(([key,value]) => value && <input key={key} type="hidden" name={key} value={value}/>)}{fields.map(field => <label key={field.name}>{field.label}{field.options ? <select name={field.name} defaultValue={values[field.name] || ""}><option value="">Todos</option>{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "date" ? <DatePicker name={field.name} defaultValue={values[field.name] || ""}/> : <input name={field.name} type="text" defaultValue={values[field.name] || ""}/>}</label>)}<div className="form-actions"><Link href={base} className="button secondary">Limpiar filtros</Link><button type="button" className="button secondary" onClick={() => setOpen(false)}>Cancelar</button><button type="submit" className="button primary">Aplicar filtros</button></div></form></Modal></>;
}
