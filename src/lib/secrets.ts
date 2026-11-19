import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export function keyFromEnvironment() {
  const raw = process.env.MASTER_KEY;
  if (!raw || !/^[A-Za-z0-9+/]{43}=$/.test(raw)) throw new Error("MASTER_KEY debe contener 32 bytes en base64.");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("MASTER_KEY no es válida.");
  return key;
}
export function encryptSecret(value: string) {
  const nonce = randomBytes(12), cipher = createCipheriv("aes-256-gcm", keyFromEnvironment(), nonce);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return ["v1", nonce.toString("base64"), cipher.getAuthTag().toString("base64"), ciphertext.toString("base64")].join(":");
}
export function decryptSecret(value: string) {
  const [version, iv, tag, data, extra] = value.split(":");
  if (version !== "v1" || !iv || !tag || data === undefined || extra !== undefined) throw new Error("El secreto cifrado no es válido.");
  const decipher = createDecipheriv("aes-256-gcm", keyFromEnvironment(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
