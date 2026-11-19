"use client";
import MoneyInput from "@/components/money-input";
import DatePicker from "@/components/date-picker";
import {useState} from "react";
import {nextPeriod} from "@/lib/commercial";
import {bogotaDay} from "@/lib/operations";
type Item={id:string;name:string;price:string;periodicity:"MONTHLY"|"QUARTERLY"|"YEARLY"|null};
export default function ContractFields({items,today}:{items:Item[];today:string}){
 const [name,setName]=useState(""),[price,setPrice]=useState(""),[period,setPeriod]=useState<"MONTHLY"|"QUARTERLY"|"YEARLY">("MONTHLY"),[started,setStarted]=useState(today),[due,setDue]=useState(bogotaDay(nextPeriod(new Date(`${today}T12:00:00-05:00`),"MONTHLY")));
 function calculate(date:string,cycle:typeof period){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return "";return bogotaDay(nextPeriod(new Date(`${date}T12:00:00-05:00`),cycle))}
 function choose(value:string){const item=items.find(i=>i.id===value);if(item){const cycle=item.periodicity||"MONTHLY";setName(item.name);setPrice(item.price);setPeriod(cycle);setDue(calculate(started,cycle))}}
 return <>{items.length>0&&<label>Producto o servicio del catálogo<select defaultValue="" onChange={e=>choose(e.target.value)}><option value="">Seleccionar del catálogo</option>{items.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label>}<label>Servicio<input name="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre del servicio" required/></label><label>Precio (COP)<MoneyInput name="price"    value={price} onValueChange={setPrice} placeholder="0" required/></label><label>Periodicidad<select name="periodicity" value={period} onChange={e=>{const cycle=e.target.value as typeof period;setPeriod(cycle);setDue(calculate(started,cycle))}}><option value="MONTHLY">Mensual</option><option value="QUARTERLY">Trimestral</option><option value="YEARLY">Anual</option></select></label><label>Fecha de inicio<DatePicker type="date" name="startedAt" value={started} onChange={e=>{setStarted(e.target.value);setDue(calculate(e.target.value,period))}} required/></label><label>Próximo cobro<DatePicker name="nextDueAt" type="date" value={due} onChange={e=>setDue(e.target.value)} required/></label></>;
}
