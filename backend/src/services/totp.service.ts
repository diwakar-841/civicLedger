import crypto from "crypto";
import { TOTP, generate, verify, generateSecret } from "otplib";
import QRCode from "qrcode";
import { env } from "../config/env";

const ALGORITHM = "aes-256-gcm";

function getDerivedKey(): Buffer {
  return crypto.createHash("sha256").update(env.TOTP_ENCRYPTION_KEY).digest();
}

export function encryptSecret(plaintext: string): string {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(stored: string): string {
  const key = getDerivedKey();
  const parts = stored.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const ciphertext = Buffer.from(parts[2], "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

export function generateTotpSecret(): string {
  return generateSecret();
}

export async function generateTotpQrCode(
  secret: string,
  email: string,
): Promise<string> {
  const totp = new TOTP();
  const otpauth = totp.toURI({
    label: email,
    issuer: "BlockchainVoting",
    secret,
  });
  return QRCode.toDataURL(otpauth);
}

export async function verifyTotpCode(
  secret: string,
  code: string,
): Promise<boolean> {
  try {
    const result = await verify({ token: code, secret });
    return result.valid;
  } catch {
    return false;
  }
}

export function generateRecoveryCodes(): { plain: string[]; hashes: string[] } {
  const plain: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const raw = crypto.randomBytes(10).toString("hex").toUpperCase();
    // Formatted with a dash (e.g. "3F9A2B1C4D-8E7F6A5B9C") so it's easier to
    // read, and so that callers who distinguish "is this a recovery code or
    // a 6-digit TOTP code?" by checking for a dash actually get one.
    const code = `${raw.slice(0, 10)}-${raw.slice(10)}`;
    plain.push(code);
    hashes.push(hashRecoveryCode(code));
  }
  return { plain, hashes };
}

function hashRecoveryCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function verifyRecoveryCode(
  code: string,
  storedHashes: string[],
): { valid: boolean; remaining: string[] } {
  const hash = hashRecoveryCode(code);
  const idx = storedHashes.indexOf(hash);
  if (idx === -1) return { valid: false, remaining: storedHashes };
  const remaining = storedHashes.filter((_, i) => i !== idx);
  return { valid: true, remaining };
}
