"use client";
import {useState} from "react";
import {Modal} from "@/components/modal";
import Link from "next/link";

export default function PricingHelp(){
 const [open,setOpen]=useState(false);
 return <><button type="button" className="text-link" onClick={()=>setOpen(true)}>¿Cómo configurar mis costos y precios?</button><Modal open={open} onClose={()=>setOpen(false)} title="Cómo calcular tus costos y precios"><div className="stack">
 <p><strong>Meta mensual:</strong> el monto que deseas ganar al mes por tu trabajo.</p>
 <p><strong>Gastos internos mensuales:</strong> se calculan automáticamente con los gastos operativos activos recurrentes. Los trimestrales y anuales se convierten a su equivalente mensual; los gastos únicos no se incluyen. Puedes agregarlos o modificarlos en <Link href="/gastos" className="text-link">Gastos operativos</Link>.</p>
 <p><strong>Horas disponibles:</strong> el total de horas que planeas trabajar al mes.</p>
 <p><strong>Horas facturables:</strong> el porcentaje de esas horas que estimas dedicar a trabajo pagado por clientes. El tiempo de administración, ventas y preparación de cotizaciones también ocupa parte de tu jornada.</p>
 <p>Por ejemplo, si trabajas 160 horas y estimas un 70 % facturable, tendrás 112 horas para repartir tu meta y tus gastos. Al aumentar el porcentaje, el costo por hora baja porque el mismo monto se reparte entre más horas.</p>
 <p><strong>Recargo sobre el costo:</strong> porcentaje que se suma al costo para sugerir un precio. Por ejemplo, un costo de $100.000 con un recargo del 40 % produce un precio sugerido de $140.000. Este recargo es distinto del margen calculado sobre el precio de venta.</p>
 <p>El costo por hora usa los ajustes guardados y los gastos activos actuales. Guarda los cambios de esta pantalla para aplicar una nueva meta, jornada o recargo.</p>
 <div><button type="button" className="button primary" onClick={()=>setOpen(false)}>Entendido</button></div>
 </div></Modal></>;
}
