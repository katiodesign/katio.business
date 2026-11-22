import {describe,it,expect} from "vitest";
import {catalogHourlyPrice} from "./pricing";
const settings={monthlyGoal:"1000000",monthlyExpenses:"0",monthlyHours:"100",billablePercent:"100",markupPercent:"20"};
describe("precio por horas del catálogo",()=>{it("recalcula el precio con la tarifa vigente y costos adicionales",()=>{expect(catalogHourlyPrice("1.5","5000",settings)).toEqual({cost:"20000.00",price:"24000.00"});expect(catalogHourlyPrice("1.5","5000",{...settings,monthlyGoal:"2000000"})).toEqual({cost:"35000.00",price:"42000.00"})});it("respeta el redondeo configurado para la tarifa",()=>{expect(catalogHourlyPrice("1","0",{...settings,monthlyGoal:"1050000",roundHourlyCost:true})).toEqual({cost:"11000.00",price:"13200.00"})})});
