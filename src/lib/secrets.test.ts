import { afterEach, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { decryptSecret, encryptSecret } from "./secrets";
afterEach(() => { delete process.env.MASTER_KEY; });
describe("cifrado de secretos", () => {
  it("cifra con nonce aleatorio y detecta modificaciones", () => {
    process.env.MASTER_KEY = randomBytes(32).toString("base64");
    const a = encryptSecret("secreto de prueba"), b = encryptSecret("secreto de prueba");
    expect(a).not.toContain("secreto de prueba"); expect(a).not.toBe(b); expect(decryptSecret(a)).toBe("secreto de prueba");
    const parts=a.split(":"); const data=Buffer.from(parts[3],"base64"); data[0]^=1; parts[3]=data.toString("base64"); expect(()=>decryptSecret(parts.join(":"))).toThrow();
  });
  it("rechaza claves ausentes o inválidas",()=>expect(()=>encryptSecret("prueba")).toThrow());
});
