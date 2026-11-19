import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { columns, readCatalogFile } from "./catalog-transfer";

describe("importación de catálogo", () => {
  it("lee CSV y marca filas inválidas", async () => {
    const csv = `${columns.join(",")}\n,Servicio prueba,Detalle,Diseño,ONE_TIME,,100.00,20.00,true,false,\n,Incompleto,Detalle,Diseño,RECURRING,,100.00,20.00,true,false,\n`;
    const result = await readCatalogFile(new File([csv],"catalogo.csv",{type:"text/csv"}));
    expect(result.rows).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
  });
  it("lee XLSX con el mismo esquema", async () => {
    const workbook = new ExcelJS.Workbook(); const sheet=workbook.addWorksheet("Catálogo");
    sheet.addRow([...columns]);sheet.addRow(["","Servicio mensual","Detalle","Soporte","RECURRING","MONTHLY","150.00","40.00","true","false",""]);
    const bytes=await workbook.xlsx.writeBuffer();
    const result=await readCatalogFile(new File([bytes as BlobPart],"catalogo.xlsx"));
    expect(result.rows[0].periodicity).toBe("MONTHLY");
    expect(result.errors).toHaveLength(0);
  });
  it("conserva las referencias de componentes en CSV y XLSX", async () => {
    const componentId = "cmr1234567890123456789012";
    const parts = JSON.stringify([{ id: componentId, quantity: "2.00" }]);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Catálogo");
    sheet.addRow([...columns]);
    sheet.addRow(["", "Paquete de prueba", "Dos componentes", "Diseño", "ONE_TIME", "", "200.00", "20.00", "true", "true", parts]);
    for (const format of ["csv", "xlsx"] as const) {
      const bytes = format === "csv" ? await workbook.csv.writeBuffer() : await workbook.xlsx.writeBuffer();
      const result = await readCatalogFile(new File([bytes as BlobPart], `catalogo.${format}`));
      expect(result.errors).toHaveLength(0);
      expect(result.rows[0].components).toEqual([{ id: componentId, quantity: "2.00" }]);
    }
  });
});
