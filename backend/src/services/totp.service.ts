import crypto from "crypto";
import { TOTP, generate, verify, generateSecret } from "otplib";
import QRCode from "qrcode";
import { env } from "../config/env";

const ALGORITHM = "aes-256-gcm";

function getDerivedKey() {
  return crypto.createHash("sha256").update(env.TOTP_ENCRYPTION_KEY).digest();
}

export function encryptSecret(plaintext) {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(stored) {
  const key = getDerivedKey();
  const parts = stored.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const ciphertext = Buffer.from(parts[2], "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function generateTotpSecret() {
  return generateSecret();
}

export async function generateTotpQrCode(secret, email) {
  const totp = new TOTP();
  const otpauth = totp.toURI({ label: email, issuer: "BlockchainVoting", secret });
  return QRCode.toDataURL(otpauth);
}

export async function verifyTotpCode(secret, code) {
  try {
    const result = await verify({ token: code, secret });
    return result.valid;
  } catch {
    return false;
  }
}

export function generateRecoveryCodes() {
  const plain = [];
  const hashes = [];
  for (let i = 0; i < 8; i++) {
    const code = crypto.randomBytes(10).toString("hex").toUpperCase();
    plain.push(code);
    hashes.push(crypto.createHash("sha256").update(code).digest("hex"));
  }
  return { plain, hashes };
}

export function verifyRecoveryCode(code, storedHashes) {
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  const idx = storedHashes.indexOf(hash);
  if (idx === -1) {return { valid: false, remaining: storedHashes };}
  const remaining = storedHashes.filter((_, i) => {return i !== idx;});
  return { valid: true, remaining };
}