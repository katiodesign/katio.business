import HourlyRounding from "./hourly-rounding";
import {PageHeader} from "@/components/app-chrome";
import MoneyInput from "@/components/money-input";
import {requirePermission} from "@/lib/access";
import {db} from "@/lib/db";
import {pricingSettingsSchema,hourlyCost} from "@/lib/pricing";
import {savePricingSettings} from "@/lib/pricing-actions";
import {cop} from "@/lib/format";
import {getMonthlyPricingExpenses} from "@/lib/pricing-expenses";
import PricingHelp from "./pricing-help";
export default async function PricingSettings(){
 await requirePermission("settings.manage");
 const record=await db.appSetting.findUnique({where:{key:"PRICING"}}),parsed=pricingSettingsSchema.safeParse(record?.value);
 const data={...(parsed.success?parsed.data:{monthlyGoal:"0",monthlyExpenses:"0",monthlyHours:"160",billablePercent:"70",markupPercent:"0"}),monthlyExpenses:await getMonthlyPricingExpenses()};
 return <><PageHeader><div><small>Inicio / Configuración</small><h1>Costos y precios</h1></div></PageHeader><form action={savePricingSettings} className="card form-card stack"><p className="muted">Los gastos se calculan a partir de los gastos operativos activos.</p><div className="form-grid"><label>Meta mensual (COP)<MoneyInput name="monthlyGoal" defaultValue={data.monthlyGoal} required/></label><label>Gastos internos mensuales (COP)<output className="field-output">{cop(data.monthlyExpenses)}</output></label><label>Horas disponibles al mes<input name="monthlyHours" type="number" min="1" step="1" defaultValue={data.monthlyHours} required/></label><label>Horas facturables (%)<input name="billablePercent" type="number" min="1" max="100" step="1" defaultValue={data.billablePercent} required/></label><label>Recargo sobre el costo (%)<input name="markupPercent" type="number" min="0" step="1" defaultValue={data.markupPercent} required/></label></div><HourlyRounding initialEnabled={data.roundHourlyCost ?? false} unroundedCost={hourlyCost({...data,roundHourlyCost:false}).toString()}/><p className="muted">El recargo se suma al costo; no representa el porcentaje de margen sobre el precio de venta.</p><div><button className="button primary">Guardar configuración</button></div></form><div style={{marginTop:16}}><PricingHelp/></div></>;
}
