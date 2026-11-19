import {describe,expect,it} from "vitest";
import {preservedCommercialComponents} from "./quote-breakdown";
describe("componentes comerciales sin acceso al catálogo",()=>{
 const previous=[{catalogId:"bundle",commercialComponents:[{id:"a",name:"Servicio permitido",quantity:"1"}]}];
 it("conserva la selección que ya estaba guardada",()=>expect(preservedCommercialComponents("bundle",["a"],previous)).toEqual(previous[0].commercialComponents));
 it("impide añadir o consultar otros componentes",()=>{expect(()=>preservedCommercialComponents("bundle",["b"],previous)).toThrow(/permiso/);expect(()=>preservedCommercialComponents("otro",["a"],previous)).toThrow(/permiso/)});
});
