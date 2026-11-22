"use client";
import {useState} from "react";
import MoneyInput from "@/components/money-input";
export default function BundlePriceFields({price,manual}:{price:string;manual:boolean}){const [custom,setCustom]=useState(manual),[value,setValue]=useState(price);return <><label className="check-label"><input type="checkbox" name="bundleManual" checked={custom} onChange={e=>{setCustom(e.target.checked);if(!e.target.checked)setValue(price)}}/>Usar precio personalizado</label><label>Total (COP)<MoneyInput name="price" value={value} onValueChange={setValue} readOnly={!custom} required/></label><p className="muted">{custom?"El precio permanecerá fijo.":"El precio sigue el valor de sus componentes."}</p></>}
