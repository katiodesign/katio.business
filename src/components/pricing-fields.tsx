"use client";
import {useState} from "react";
import Decimal from "decimal.js";
import MoneyInput from "@/components/money-input";
import {cop} from "@/lib/format";
export default function PricingFields({hourlyRate,markup}:{hourlyRate:string;markup:string}){
 const [hours,setHours]=useState("0"),[direct,setDirect]=useState("0"),[override,setOverride]=useState<string|null>(null);
 let cost=new Decimal(0);try{cost=new Decimal(hours||0).mul(hourlyRate).plus(direct||0);if(cost.isNegative())cost=new Decimal(0)}catch{}
 const suggested=cost.mul(new Decimal(1).plus(new Decimal(markup).div(100))).toFixed(2);
 return <><label>Horas a dedicar<input type="number" min="0" step="0.01" value={hours} onChange={e=>{setHours(e.target.value);setOverride(null)}}/></label><label>Costos directos (COP)<MoneyInput value={direct} onValueChange={v=>{setDirect(v);setOverride(null)}}/></label><label>Precio de referencia (COP)<MoneyInput name="price" value={override??suggested} onValueChange={setOverride} required/></label><input type="hidden" name="internalCost" value={cost.toFixed(2)}/><p className="muted" style={{gridColumn:"1 / -1"}}>Costo calculado: {cop(cost.toFixed(2))} · Precio sugerido: {cop(suggested)} · Tarifa por hora: {cop(hourlyRate)} · Recargo: {markup} %</p></>;
}
