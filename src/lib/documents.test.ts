import { describe, expect, it } from "vitest";
import { PDFArray, PDFDocument, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import { renderCommercialPdf } from "./documents";

describe("documentos comerciales", () => {
  it("muestra el desglose comercial sin multiplicador ni costos internos", async () => {
    const bytes=await renderCommercialPdf({kind:"QUOTE",number:2,issuedAt:new Date("2026-11-11T12:00:00Z"),customer:{name:"Cliente"},template:{},lines:[{name:"Paquete",quantity:"2",unitPrice:"100000",total:"207000",commercialComponents:[{name:"Servicio comercial",quantity:"1"}]}],subtotal:"200000",multiplier:"1.15",discount:"10",discountType:"PERCENT",total:"207000"});
    const pdf=await PDFDocument.load(bytes);
    const content=pdf.getPages().flatMap(page=>{const entries=page.node.Contents();return entries instanceof PDFArray?entries.asArray().map(ref=>pdf.context.lookup(ref)):[pdf.context.lookup(entries)];}).filter((stream):stream is PDFRawStream=>stream instanceof PDFRawStream).map(stream=>Buffer.from(decodePDFRawStream(stream).decode()).toString("ascii")).join("\n");
    const encoded=(text:string)=>Buffer.from(text,"latin1").toString("hex").toUpperCase();
    expect(content).toContain(encoded("Servicio comercial"));
    expect(content).not.toContain(encoded("Multiplicador"));
    expect(content).not.toContain(encoded("Costo"));
    expect(content).not.toContain(encoded("100.000"));
    expect(content).toContain(encoded("103.500"));
  });
  it("genera tamaño carta y crea páginas adicionales para textos largos", async () => {
    const bytes = await renderCommercialPdf({
      kind: "QUOTE", number: 1, issuedAt: new Date("2026-11-07T12:00:00Z"),
      customer: { name: "Nombre de cliente" },
      template: { companyName: "Katio Business", introduction: "Texto de presentación ".repeat(100) },
      lines: Array.from({ length: 15 }, (_, index) => ({ name: `Servicio ${index + 1}`, description: "Descripción extensa ".repeat(30), quantity: "1", unitPrice: "100.00", total: "100.00" })),
      subtotal: "1500.00", multiplier: "1", discount: "0", discountType: "FIXED", total: "1500.00",
    });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
    expect(pdf.getPages().every(page => page.getWidth() === 612 && page.getHeight() === 792)).toBe(true);
  });
});
