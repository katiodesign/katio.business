"use client";
import {useState} from "react";
import Decimal from "decimal.js";
import MoneyInput from "@/components/money-input";
import {cop} from "@/lib/format";
import styles from "./pricing-fields.module.css";
export default function PricingFields({hourlyRate,markup,initialPrice,initialCost,initialHours,initialDirectCost}:{hourlyRate:string;markup:string;initialPrice?:string;initialCost?:string;initialHours?:string;initialDirectCost?:string}){
 const [hours,setHours]=useState(initialHours??"0"),[direct,setDirect]=useState(initialDirectCost??"0"),[override,setOverride]=useState<string|null>(initialPrice??null);
 const [legacyCost,setLegacyCost]=useState(initialCost!==undefined&&initialHours===undefined&&initialDirectCost===undefined);
 let cost=new Decimal(0),directAmount=new Decimal(0);try{directAmount=new Decimal(direct==="."?"0":direct||"0");cost=new Decimal(hours||0).mul(hourlyRate).plus(directAmount);if(cost.isNegative())cost=new Decimal(0);if(legacyCost)cost=new Decimal(initialCost||"0")}catch{}
 const surcharge=cost.mul(new Decimal(markup).div(100));
 const suggested=cost.plus(surcharge).toFixed(2);
 return <>{legacyCost&&<p className="muted">Las horas y costos adicionales de este elemento no se guardaron por separado. El costo anterior se conserva hasta que modifiques alguno de estos campos.</p>}<label>Horas a dedicar<input name="pricingHours" type="number" min="0" step="0.1" required value={hours} onChange={e=>{setHours(e.target.value);setLegacyCost(false);setOverride(null)}}/></label><label>Costos Internos (COP)<MoneyInput name="pricingDirectCost" value={direct} onValueChange={v=>{setDirect(v);setLegacyCost(false);setOverride(null)}}/></label><label>Total (COP)<MoneyInput name="price" value={override??suggested} onValueChange={setOverride} required/></label><input type="hidden" name="internalCost" value={cost.toFixed(2)}/><input type="hidden" name="preserveLegacyPricing" value={legacyCost?"true":"false"}/><section className={styles.breakdown} aria-label="Desglose del precio sugerido" aria-live="polite"><strong>Así se calcula el precio sugerido</strong><dl><div><dt>Trabajo: {hours||"0"} h × {cop(hourlyRate)} por hora</dt><dd>{legacyCost?"No disponible":cop(cost.minus(directAmount).toFixed(2))}</dd></div><div><dt>Costos internos adicionales</dt><dd>{cop(directAmount.toString())}</dd></div><div><dt>Costo total</dt><dd>{cop(cost.toFixed(2))}</dd></div><div><dt>Recargo ({markup} %)</dt><dd>+ {cop(surcharge.toFixed(2))}</dd></div><div className={styles.total}><dt>Precio sugerido</dt><dd>{cop(suggested)}</dd></div></dl>{override!==null&&<p>El total puede ajustarse manualmente y ser diferente al precio sugerido.</p>}</section></>;
}
