"use client";
import {useState} from "react";
import Decimal from "decimal.js";
import MoneyInput from "@/components/money-input";
import {cop} from "@/lib/format";
import styles from "./pricing-fields.module.css";
export default function PricingFields({hourlyRate,markup,initialPrice,initialCost,initialHours,initialDirectCost}:{hourlyRate:string;markup:string;initialPrice?:string;initialCost?:string;initialHours?:string;initialDirectCost?:string}){
 const [hours,setHours]=useState(initialHours??"0"),[direct,setDirect]=useState(initialDirectCost??initialCost??"0"),[override,setOverride]=useState<string|null>(initialPrice??null);
 let cost=new Decimal(0);try{cost=new Decimal(hours||0).mul(hourlyRate).plus(direct||0);if(cost.isNegative())cost=new Decimal(0)}catch{}
 const surcharge=cost.mul(new Decimal(markup).div(100));
 const suggested=cost.plus(surcharge).toFixed(2);
 return <>{initialCost!==undefined&&initialHours===undefined&&<p className="muted">El costo guardado aparece en costos internos porque las horas anteriores no se guardaron por separado. Ajusta ambos valores para recalcular.</p>}<label>Horas a dedicar<input name="pricingHours" type="number" min="0" step="0.1" required value={hours} onChange={e=>{setHours(e.target.value);setOverride(null)}}/></label><label>Costos Internos (COP)<MoneyInput name="pricingDirectCost" value={direct} onValueChange={v=>{setDirect(v);setOverride(null)}}/></label><label>Total (COP)<MoneyInput name="price" value={override??suggested} onValueChange={setOverride} required/></label><input type="hidden" name="internalCost" value={cost.toFixed(2)}/><section className={styles.breakdown} aria-label="Desglose del precio sugerido" aria-live="polite"><strong>Así se calcula el precio sugerido</strong><dl><div><dt>Trabajo: {hours||"0"} h × {cop(hourlyRate)} por hora</dt><dd>{cop(cost.minus(new Decimal(direct||0)).toFixed(2))}</dd></div><div><dt>Costos internos adicionales</dt><dd>{cop(direct||"0")}</dd></div><div><dt>Costo total</dt><dd>{cop(cost.toFixed(2))}</dd></div><div><dt>Recargo ({markup} %)</dt><dd>+ {cop(surcharge.toFixed(2))}</dd></div><div className={styles.total}><dt>Precio sugerido</dt><dd>{cop(suggested)}</dd></div></dl>{override!==null&&<p>El total puede ajustarse manualmente y ser diferente al precio sugerido.</p>}</section></>;
}
