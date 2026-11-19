"use client";
import MoneyInput from "@/components/money-input";
import {useState} from "react";
import {monthlyEquivalent} from "@/lib/money";
import {cop} from "@/lib/format";
export default function ExpenseValues(){
 const [amount,setAmount]=useState(""),[period,setPeriod]=useState<""|"MONTHLY"|"QUARTERLY"|"YEARLY">("");
 let equivalent="—";try{if(amount)equivalent=cop(monthlyEquivalent(amount,period||null).toString())}catch{}
 return <><label>Importe (COP)<MoneyInput name="amount"    value={amount} onValueChange={setAmount} placeholder="0" required/></label><label>Periodicidad<select name="periodicity" value={period} onChange={e=>setPeriod(e.target.value as typeof period)}><option value="">Único</option><option value="MONTHLY">Mensual</option><option value="QUARTERLY">Trimestral</option><option value="YEARLY">Anual</option></select></label><label>Equivalente mensual estimado<output className="field-output">{equivalent}</output></label></>;
}
