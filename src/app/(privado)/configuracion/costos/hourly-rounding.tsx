"use client";
import {useState} from "react";
import Decimal from "decimal.js";
import {cop} from "@/lib/format";

export default function HourlyRounding({initialEnabled,unroundedCost}:{initialEnabled:boolean;unroundedCost:string}) {
 const [enabled,setEnabled]=useState(initialEnabled);
 const cost=new Decimal(unroundedCost);
 const displayed=enabled?cost.div(1000).ceil().mul(1000):cost;
 return <><p>Costo por hora con ajustes guardados y gastos actuales: <strong>{cop(displayed.toFixed(2))}</strong></p><label className="check-label switch-label"><input type="checkbox" role="switch" name="roundHourlyCost" checked={enabled} onChange={event=>setEnabled(event.target.checked)}/>Redondear el costo por hora al siguiente múltiplo de $1.000</label></>;
}
