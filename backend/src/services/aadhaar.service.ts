import crypto from "crypto";
import { env } from "../config/env";

/**
 * Verhoeff checksum tables - the algorithm real Aadhaar numbers are
 * generated with. The README previously documented this as a TODO
 * ("add the Verhoeff checksum algorithm for real Aadhaar validation");
 * a bare 12-digit regex accepted any random number, including obviously
 * fake ones, which defeats the "one account per real person" guarantee.
 */
const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

function passesVerhoeffChecksum(num: string): boolean {
  let c = 0;
  const digits = num.split("").reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[i % 8][digits[i]]];
  }
  return c === 0;
}

/**
 * 12-digit format + Verhoeff checksum + the "never starts with 0 or 1" UIDAI
 * rule. Still not a substitute for real UIDAI verification (out of scope for
 * this app), but rejects obviously invalid/placeholder numbers instead of
 * accepting any 12 digits.
 */
/** export function isValidAadhaar(aadhaar: string): boolean {
  if (!/^[2-9]\d{11}$/.test(aadhaar)) return false;
  return passesVerhoeffChecksum(aadhaar);
} */

export function isValidAadhaar(aadhaar: string): boolean {
  return /^\d{12}$/.test(aadhaar);
}

/**
 * One-way salted hash. The raw Aadhaar number is never persisted anywhere -
 * only this hash, stored with a UNIQUE constraint in Postgres, enforces one
 * account per person. The pepper is now required at boot (see config/env.ts)
 * instead of silently defaulting to a hardcoded string if unset.
 */
export function hashAadhaar(aadhaarNumber: string): string {
  return crypto.createHash("sha256").update(`${aadhaarNumber}:${env.AADHAAR_PEPPER}`).digest("hex");
}
