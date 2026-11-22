import {describe,it,expect} from "vitest";
import {catalogPricingInputsSchema} from "./schemas";
describe("catalog pricing inputs",()=>{it("trata el costo vacío como cero",()=>{expect(catalogPricingInputsSchema.parse({pricingHours:"1.5",pricingDirectCost:""}).pricingDirectCost).toBe("0")});it("conserva importes válidos y rechaza importes inválidos",()=>{expect(catalogPricingInputsSchema.parse({pricingHours:"1",pricingDirectCost:"123.45"}).pricingDirectCost).toBe("123.45");expect(catalogPricingInputsSchema.safeParse({pricingHours:"1",pricingDirectCost:"1.234"}).success).toBe(false)})});
