"use server";
import {redirect} from "next/navigation";
import {db} from "@/lib/db";
import {requirePermission} from "@/lib/access";
import {pricingSettingsSchema} from "@/lib/pricing";
import {getMonthlyPricingExpenses} from "@/lib/pricing-expenses";
export async function savePricingSettings(form:FormData){
 const actor=await requirePermission("settings.manage");
 const value=pricingSettingsSchema.parse({...Object.fromEntries(form),roundHourlyCost:form.get("roundHourlyCost")==="on",monthlyExpenses:await getMonthlyPricingExpenses()});
 for(const key of ["monthlyHours","billablePercent","markupPercent"] as const){if(!/^\d+$/.test(value[key]))throw new Error("Las horas y los porcentajes deben ser números enteros.");}
 await db.$transaction(async tx=>{await tx.appSetting.upsert({where:{key:"PRICING"},create:{key:"PRICING",value},update:{value}});await tx.auditLog.create({data:{userId:actor.id,action:"UPDATE",entity:"AppSetting",entityId:"PRICING"}})});
 redirect("/configuracion/costos");
}
