import Decimal from "decimal.js";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
type Template={companyName?:string;taxId?:string;address?:string;contact?:string;introduction?:string;terms?:string;closing?:string;validity?:string};
type Line={name:string;description?:string;quantity:string;unitPrice:string;total:string;periodicity?:string|null;commercialComponents?:{name:string;quantity:string}[]};
export type CommercialDocument={kind:"QUOTE"|"INVOICE";number:number;issuedAt:Date;expiresAt?:Date|null;voided?:boolean;customer:{name:string;businessName?:string|null;identification?:string|null;email?:string|null;phone?:string|null;address?:string|null};template:Template;lines:Line[];subtotal:string;multiplier:string;discount:string;discountType:string;total:string;observations?:string;extraTerms?:string};
const currency=(v:string)=>new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:2}).format(Number(v));
const day=(v:Date)=>new Intl.DateTimeFormat("es-CO",{timeZone:"America/Bogota",day:"2-digit",month:"long",year:"numeric"}).format(v);
export async function renderCommercialPdf(data:CommercialDocument){
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const ink=rgb(24/255,27/255,38/255),secondary=rgb(75/255,82/255,99/255),muted=rgb(111/255,118/255,138/255),brand=rgb(74/255,114/255,1),surface=rgb(244/255,246/255,249/255),border=rgb(229/255,233/255,240/255),lime=rgb(210/255,246/255,105/255),white=rgb(1,1,1);
 let page:PDFPage=pdf.addPage([612,792]),y=765;
 const clean=(value:unknown)=>[...String(value??"").replace(/\r\n?/g,"\n")].map(char=>{if(char==="\n"||char==="\t")return char;try{font.encodeText(char);return char}catch{return "?"}}).join("");
 const text=(value:string,x:number,at:number,size:number,face:PDFFont=font,color:RGB=ink)=>page.drawText(clean(value),{x,y:at,size,font:face,color});
 const right=(value:string,x:number,at:number,size:number,face:PDFFont=font,color:RGB=ink)=>{const v=clean(value);text(v,x-face.widthOfTextAtSize(v,size),at,size,face,color)};
 function wrap(value:string,width:number,size:number,face:PDFFont=font){const out:string[]=[];for(const para of clean(value).split("\n")){let line="";for(const word of para.split(/\s+/).filter(Boolean)){let remaining=word;while(face.widthOfTextAtSize(remaining,size)>width){if(line){out.push(line);line=""}let count=remaining.length;while(count>1&&face.widthOfTextAtSize(remaining.slice(0,count),size)>width)count--;out.push(remaining.slice(0,count));remaining=remaining.slice(count)}const candidate=line?`${line} ${remaining}`:remaining;if(face.widthOfTextAtSize(candidate,size)>width&&line){out.push(line);line=remaining}else line=candidate}out.push(line)}return out}
 function fresh(){page=pdf.addPage([612,792]);y=760;text(data.kind==="QUOTE"?"COTIZACIÓN · CONTINUACIÓN":"FACTURA · CONTINUACIÓN",30,y,9,bold,brand);y-=15;page.drawLine({start:{x:30,y},end:{x:582,y},color:brand,thickness:1.2});y-=16}
 function ensure(height:number){if(y-height<50)fresh()}
 function block(value:string,width=552,size=8,color:RGB=secondary){const lines=wrap(value,width,size);for(const line of lines){ensure(13);text(line,30,y,size,font,color);y-=13}}
 function heading(value:string){ensure(30);text(value.toLocaleUpperCase("es-CO"),30,y,8,bold,brand);y-=17}
 // Encabezado, proporciones derivadas del documento carta del archivo de referencia.
 text("KATIO",30,y-2,19,bold,brand);text("DESIGN",96,y-2,19,bold,ink);
 const badge=data.kind==="QUOTE"?"COTIZACIÓN / OFERTA MERCANTIL":"FACTURA INTERNA";
 const badgeWidth=bold.widthOfTextAtSize(badge,7)+16;page.drawRectangle({x:582-badgeWidth,y:y-4,width:badgeWidth,height:16,color:brand});text(badge,590-badgeWidth,y+1,7,bold,white);
 right(`${data.kind==="QUOTE"?"COT":"FAC"}-${String(data.number).padStart(4,"0")}`,582,y-26,15,bold,ink);
 right(`Fecha: ${day(data.issuedAt)}`,582,y-41,8,font,muted);
 if(data.expiresAt)right(`Vigencia: ${day(data.expiresAt)}`,582,y-53,8,font,muted);
 y-=28;for(const s of [data.template.companyName||"Katio Business",data.template.taxId?`NIT: ${data.template.taxId}`:"",data.template.address||"",data.template.contact||""]){if(!s)continue;const lines=wrap(s,290,8);for(const line of lines){text(line,30,y,8,font,secondary);y-=11}}
 y=Math.min(y-8,690);page.drawLine({start:{x:30,y},end:{x:582,y},color:brand,thickness:1.4});y-=19;
 if(data.voided){heading("DOCUMENTO ANULADO");}
 if(data.template.introduction){const lines=wrap(data.template.introduction,526,8);for(const value of lines){ensure(24);page.drawRectangle({x:30,y:y-14,width:552,height:14,color:surface});page.drawRectangle({x:30,y:y-14,width:3,height:14,color:brand});text(value,42,y-8,8,font,secondary);y-=14}y-=14}
 const customerLines=[data.customer.name,data.customer.businessName?`Razón social: ${data.customer.businessName}`:"",data.customer.identification?`NIT / identificación: ${data.customer.identification}`:"",data.customer.address?`Dirección: ${data.customer.address}`:""].filter(Boolean).flatMap(s=>wrap(s,280,8));
 const contactLines=[data.customer.email||"",data.customer.phone?`Tel: ${data.customer.phone}`:""].filter(Boolean).flatMap(s=>wrap(s,185,8));
 const customerHeight=Math.max(customerLines.length,contactLines.length)*12+32;ensure(customerHeight+12);page.drawRectangle({x:30,y:y-customerHeight+9,width:552,height:customerHeight,color:surface});text("CLIENTE / PROSPECTO",45,y-5,7,bold,brand);right("CONTACTO",567,y-5,7,bold,brand);
 customerLines.forEach((s,i)=>text(s,45,y-20-i*12,8,i===0?bold:font,i===0?ink:muted));contactLines.forEach((s,i)=>right(s,567,y-20-i*12,8,i===0?bold:font,i===0?ink:muted));y-=customerHeight+12;
 function tableHeader(){ensure(35);page.drawRectangle({x:30,y:y-24,width:552,height:24,color:surface});text("CONCEPTO / SERVICIO",39,y-15,7,bold,brand);right("CANT.",340,y-15,7,bold,brand);right("VALOR UNITARIO",456,y-15,7,bold,brand);right("TOTAL",573,y-15,7,bold,brand);y-=24;page.drawLine({start:{x:30,y},end:{x:582,y},color:brand,thickness:1.2});y-=10}
 tableHeader();
 for(const item of data.lines){const name=wrap(item.name,265,9,bold).map(s=>({s,face:bold,color:ink})),description=item.description?wrap(item.description,265,8).map(s=>({s,face:font,color:muted})):[];const lines=[...name,...description];let first=true;for(const part of lines){if(y<75){fresh();tableHeader()}text(part.s,39,y,part.face===bold?9:8,part.face,part.color);if(first){right(item.quantity,340,y,8);right(currency(new Decimal(item.quantity).gt(0)?new Decimal(item.total).div(item.quantity).toDecimalPlaces(2).toString():"0"),456,y,8);right(currency(item.total),573,y,8,bold);first=false}y-=12}for(const component of item.commercialComponents||[]){for(const line of wrap(`Incluye: ${component.name} · Cant. ${component.quantity}`,260,8)){if(y<75){fresh();tableHeader()}text(line,47,y,8,font,muted);y-=12}}page.drawLine({start:{x:30,y:y+4},end:{x:582,y:y+4},color:border,thickness:.6});y-=10}
 ensure(55);y-=4;page.drawRectangle({x:380,y:y-9,width:202,height:26,color:lime});text("TOTAL",390,y,10,bold,ink);right(currency(data.total),573,y,11,bold,ink);y-=31;
 if(data.template.validity){heading("Vigencia");block(data.template.validity);y-=8}if(data.observations){heading("Observaciones");block(data.observations);y-=8}if(data.extraTerms){heading("Condiciones comerciales");block(data.extraTerms);y-=8}if(data.template.terms){heading("Condiciones");block(data.template.terms);y-=8}if(data.template.closing)block(data.template.closing);
 const count=pdf.getPageCount();pdf.getPages().forEach((p,index)=>{p.drawLine({start:{x:30,y:35},end:{x:582,y:35},color:border,thickness:.6});p.drawText(`${index+1} / ${count}`,{x:555,y:21,font,size:7,color:muted})});
 return pdf.save();
}
