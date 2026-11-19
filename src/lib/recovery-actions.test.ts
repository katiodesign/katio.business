import {beforeEach,describe,expect,it,vi} from "vitest";

const mocks=vi.hoisted(()=>({send:vi.fn(),config:vi.fn(),user:vi.fn(),create:vi.fn()}));
vi.mock("@/lib/gmail",()=>({getGmailConfig:mocks.config,sendRecoveryEmail:mocks.send}));
vi.mock("@/lib/db",()=>({db:{$transaction:async (callback:(tx:unknown)=>unknown)=>callback({$executeRaw:vi.fn(),loginAttempt:{findUnique:vi.fn().mockResolvedValue(null),upsert:vi.fn()},user:{findUnique:mocks.user},passwordReset:{updateMany:vi.fn(),create:mocks.create}})}}));

import {requestRecovery} from "./recovery-actions";
describe("recuperación por Gmail",()=>{
 beforeEach(()=>{vi.clearAllMocks();mocks.user.mockResolvedValue({id:"user",active:true});mocks.create.mockResolvedValue({id:"reset",expiresAt:new Date()});mocks.config.mockResolvedValue({email:"sender@gmail.com",encryptedPassword:"cifrada"});mocks.send.mockResolvedValue(undefined)});
 it("envía el enlace a la cuenta registrada sin exponer la clave",async()=>{
  const form=new FormData();form.set("email","cliente@example.invalid");
  expect(await requestRecovery({},form)).toEqual({sent:true});
  expect(mocks.send).toHaveBeenCalledOnce();
  expect(mocks.send.mock.calls[0][1]).toBe("cliente@example.invalid");
  expect(mocks.send.mock.calls[0][2]).toMatch(/\/acceso\/restablecer\?token=[a-f0-9]{64}$/);
 });
 it("no revela si una cuenta existe ni si el envío falló",async()=>{
  const form=new FormData();form.set("email","cliente@example.invalid");
  mocks.send.mockRejectedValue(new Error("SMTP falló"));
  expect(await requestRecovery({},form)).toEqual({sent:true});
  mocks.user.mockResolvedValue(null);
  expect(await requestRecovery({},form)).toEqual({sent:true});
 });
});
