import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LEN = 32;
const IV_LEN = 12;
const TAG_LEN = 16;
const SALT = "civic-ledger-wallet-v1";

function deriveKey(secret: string): Buffer {
  return crypto.scryptSync(secret, SALT, KEY_LEN);
}

export function encryptPrivateKey(privateKey: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(privateKey, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptPrivateKey(
  encryptedData: string,
  secret: string,
): string {
  const key = deriveKey(secret);
  const data = Buffer.from(encryptedData, "base64");
  if (data.length < IV_LEN + TAG_LEN + 1) {
    throw new Error("Encrypted private key is too short — data may be corrupt");
  }
  const iv = data.subarray(0, IV_LEN);
  const authTag = data.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const encrypted = data.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}
