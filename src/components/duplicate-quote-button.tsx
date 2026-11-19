"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { duplicateQuote } from "@/lib/actions";
import { Modal } from "./modal";
import { Copy } from "lucide-react";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="button primary" type="submit" disabled={pending}>{pending ? "Duplicando…" : "Duplicar"}</button>;
}
export default function DuplicateQuoteButton({ id, number }: { id: string; number: number }) {
  const [open, setOpen] = useState(false);
  const label = `COT-${String(number).padStart(4, "0")}`;
  return <>
    <button type="button" className="row-icon" title="Duplicar cotización" aria-label="Duplicar" onClick={() => setOpen(true)}><Copy size={20}/></button>
    <Modal open={open} onClose={() => setOpen(false)} title={`Duplicar cotización ${label}`} className="duplicate-dialog">
      <p>Se creará un nuevo borrador con el siguiente consecutivo y la fecha de hoy. Conserva los datos comerciales de la original y no la modifica.</p>
      <div className="duplicate-actions">
        <button type="button" className="button secondary" onClick={() => setOpen(false)}>Cancelar</button>
        <form action={duplicateQuote.bind(null, id)}><Submit /></form>
      </div>
    </Modal>
  </>;
}
