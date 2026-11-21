import CategoryInput from "@/components/category-input";
import DatePicker from "@/components/date-picker";
import { PageHeader } from "@/components/app-chrome";
import Link from "next/link";
import {requirePermission} from "@/lib/access";
import {createExpense} from "@/lib/operations-actions";
import {getGeneralSettings} from "@/lib/app-settings";
import ExpenseValues from "./expense-values";
export default async function NewExpense(){
 await requirePermission("expenses.create");const general=await getGeneralSettings();
 return <><PageHeader><div><small>Inicio / Gastos operativos</small><h1>Gastos operativos</h1></div></PageHeader><form action={createExpense}><div className="page-title"><div><h2>Registrar gasto</h2><p>Agrega los datos del gasto y su recurrencia.</p></div><div className="form-actions"><Link className="button secondary" href="/gastos">Cancelar</Link><button className="button primary">Guardar gasto</button></div></div><section className="card form-card"><h3>Datos del gasto</h3><div className="form-grid design-fields"><label>Gasto<input name="name" placeholder="Nombre del gasto" required/></label><label>Categoría<CategoryInput categories={general.expenseCategories} placeholder="Seleccionar categoría"/></label><ExpenseValues/><label>Fecha de pago<DatePicker name="paidAt" type="date"/></label><label>Próximo vencimiento<DatePicker name="nextDueAt" type="date"/></label></div><p className="muted" style={{marginTop:16}}>El equivalente mensual es una referencia de gestión. Los comprobantes pueden añadirse al detalle después de guardar.</p></section></form></>;
}
