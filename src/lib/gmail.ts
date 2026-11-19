import "server-only";
import nodemailer from "nodemailer";
import {z} from "zod";
import {db} from "@/lib/db";
import {decryptSecret} from "@/lib/secrets";

export const gmailConfigSchema=z.object({email:z.string().email().max(254),encryptedPassword:z.string().min(1)});
export async function getGmailConfig(){
 const record=await db.appSetting.findUnique({where:{key:"GMAIL"}});
 const parsed=gmailConfigSchema.safeParse(record?.value);
 return parsed.success?parsed.data:null;
}
function gmailTransport(config:z.infer<typeof gmailConfigSchema>){
 return nodemailer.createTransport({host:"smtp.gmail.com",port:465,secure:true,auth:{user:config.email,pass:decryptSecret(config.encryptedPassword)},connectionTimeout:15000,greetingTimeout:15000,socketTimeout:20000});
}
export async function verifyGmail(config:z.infer<typeof gmailConfigSchema>){const transport=gmailTransport(config);try{await transport.verify()}finally{transport.close()}}
export async function sendRecoveryEmail(config:z.infer<typeof gmailConfigSchema>,to:string,url:string){
 const transport=gmailTransport(config);
 try{await transport.sendMail({from:{name:"Katio Business",address:config.email},to,subject:"Restablecer contraseña · Katio Business",text:`Recibimos una solicitud para restablecer tu contraseña. Abre este enlace para continuar:\n\n${url}\n\nEl enlace vence en 30 minutos y solo se puede usar una vez. Si no solicitaste este cambio, ignora este correo.`})}finally{transport.close()}
}
