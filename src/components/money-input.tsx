"use client";
import { useState } from "react";

export default function MoneyInput({name, value, defaultValue = "", onValueChange, required, placeholder}: {name?: string; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; required?: boolean; placeholder?: string}) {
  const [internal, setInternal] = useState(defaultValue);
  const raw = value ?? internal;
  const [whole, fraction] = raw.split(".");
  const display = (whole || (fraction !== undefined ? "0" : "")).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (fraction !== undefined ? "," + fraction : "");
  return <><input type="text" inputMode="decimal" value={display} required={required} placeholder={placeholder} onKeyDown={event => {
    const input = event.currentTarget, position = input.selectionStart;
    if (event.key === "Backspace" && position !== null && position === input.selectionEnd && position > 0 && input.value[position - 1] === ".") {
      input.setSelectionRange(Math.max(0, position - 2), position - 1);
    }
  }} onChange={event => {
    const input = event.currentTarget;
    const digitsBefore = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/[^\d,]/g, "").length;
    const text = event.target.value.replace(/[^\d,]/g, "");
    const parts = text.split(",");
    const integer = parts[0].replace(/^0+(?=\d)/, "");
    const next = integer + (parts.length > 1 ? "." + parts.slice(1).join("").slice(0, 2) : "");
    setInternal(next); onValueChange?.(next);
    requestAnimationFrame(() => {
      let position = 0, seen = 0;
      while (position < input.value.length && seen < digitsBefore) if (/[\d,]/.test(input.value[position++])) seen++;
      input.setSelectionRange(position, position);
    });
  }}/>{name && <input type="hidden" name={name} value={raw.endsWith(".") ? raw.slice(0, -1) : raw}/>}</>;
}

