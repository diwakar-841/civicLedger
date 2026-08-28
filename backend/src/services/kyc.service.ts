import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, users } from "@voting/database";
import { eq } from "drizzle-orm";
import { env } from "../config/env";
import { BadRequestError, UnauthorizedError } from "../lib/errors";
import { sendPhoneVerificationOtp } from "../lib/sms";
import { recordAudit } from "../lib/audit";
import { logger } from "../lib/logger";
import { createSession } from "./session.service";
import { toVoterId } from "./auth.service";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function normalizeDob(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const dmY = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmY) return `${dmY[3]}-${dmY[2]}-${dmY[1]}`;
  const mdY = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (mdY) return `${mdY[3]}-${mdY[1]}-${mdY[2]}`;
  return trimmed;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 ? `+91${digits}` : raw.trim();
}

// ─── Step 1: verify DOB + unique phone, send OTP ──────────────────────────────

export async function verifyIdentity(
  kycToken: string,
  phone: string,
  dob: string
): Promise<{ kycToken: string; devOtp?: string }> {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(kycToken, env.JWT_SECRET) as typeof payload;
  } catch {
    throw new UnauthorizedError("Session expired — please sign in again");
  }
  if (payload.purpose !== "kyc-1") throw new UnauthorizedError("Invalid token purpose");

  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
  if (!user) throw new UnauthorizedError("User not found");

  const normalizedInputDob = normalizeDob(dob);
  const normalizedStoredDob = normalizeDob(user.dob ?? "");
  if (normalizedInputDob !== normalizedStoredDob) {
    throw new BadRequestError("Date of birth does not match the registration details");
  }

  const normalizedPhone = normalizePhone(phone);
  const existingPhone = await db.query.users.findFirst({ where: eq(users.phone, normalizedPhone) });
  if (existingPhone && existingPhone.id !== user.id) {
    throw new BadRequestError("This phone number is already linked to another account");
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 8);
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db
    .update(users)
    .set({
      phone: normalizedPhone,
      phoneVerified: false,
      phoneVerificationOtpHash: otpHash,
      phoneVerificationOtpExpiresAt: otpExpiry,
    })
    .where(eq(users.id, user.id));

  let delivered = true;
  try {
    ({ delivered } = await sendPhoneVerificationOtp(normalizedPhone, otp));
  } catch (err) {
    logger.error("Failed to send phone verification SMS", { userId: user.id, error: String(err) });
    if (env.NODE_ENV === "production") {
      await db.update(users).set({
        phoneVerificationOtpHash: null,
        phoneVerificationOtpExpiresAt: null,
      }).where(eq(users.id, user.id));
      throw new BadRequestError("Could not send the phone OTP. Please try again or contact the administrator.");
    }
    // Outside production, the OTP hash/expiry saved above is still valid even
    // though the send attempt failed (e.g. SMS provider misconfigured or
    // rejecting the request) — fall through and hand the code back on screen
    // instead of blocking the tester entirely.
    delivered = false;
  }

  if (env.NODE_ENV !== "production") {
    logger.info(`[Phone OTP — dev] Code for ${normalizedPhone}: ${otp}`);
  }

  const kycToken2 = jwt.sign(
    { userId: user.id, purpose: "kyc-2" },
    env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  recordAudit(user.id, "PHONE_VERIFICATION_INITIATED").catch(() => {});

  // Dev-only convenience: the OTP couldn't actually reach the phone — either
  // no SMS provider is configured, or the send attempt itself failed (e.g.
  // Twilio trial-account restrictions). Hand it back to the client so local
  // testing isn't blocked. This never happens in production.
  const devOtp = !delivered && env.NODE_ENV !== "production" ? otp : undefined;

  return { kycToken: kycToken2, devOtp };
}

// ─── Step 2: verify phone OTP and complete the account ─────────────────────────

export async function verifyOtp(
  kycToken: string,
  otp: string
): Promise<
  { accessToken: string; user: Record<string, unknown> }
> {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(kycToken, env.JWT_SECRET) as typeof payload;
  } catch {
    throw new UnauthorizedError("Session expired — please sign in again");
  }
  if (payload.purpose !== "kyc-2") throw new UnauthorizedError("Invalid token purpose");

  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
  if (!user) throw new UnauthorizedError("User not found");

  if (!user.phoneVerificationOtpHash || !user.phoneVerificationOtpExpiresAt) {
    throw new BadRequestError("No phone verification code found — request a new one");
  }
  if (user.phoneVerificationOtpExpiresAt < new Date()) {
    throw new BadRequestError("Phone verification code has expired — request a new one");
  }

  const otpOk = await bcrypt.compare(otp.trim(), user.phoneVerificationOtpHash);
  if (!otpOk) throw new BadRequestError("Incorrect verification code");

  await db.update(users).set({
    phoneVerified: true,
    isVerified: true,
    phoneVerificationOtpHash: null,
    phoneVerificationOtpExpiresAt: null,
  }).where(eq(users.id, user.id));

  recordAudit(user.id, "PHONE_VERIFIED").catch(() => {});

  const { rawToken } = await createSession({ userId: user.id, userAgent: "phone-verification" });

  const jwt2 = (await import("jsonwebtoken")).default;
  const accessToken = jwt2.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "15m" });

  return {
    accessToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      voterId: toVoterId(user.id),
      walletAddress: user.walletAddress,
      isVerified: true,
      emailVerified: user.emailVerified,
      phoneVerified: true,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      isBiometricRegistered: user.isBiometricRegistered,
      phone: user.phone,
      dob: user.dob,
    },
  };
}

// ─── Resend OTP ────────────────────────────────────────────────────────────────

export async function resendKycOtp(kycToken: string): Promise<{ devOtp?: string }> {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(kycToken, env.JWT_SECRET) as typeof payload;
  } catch {
    throw new UnauthorizedError("Session expired — please sign in again");
  }
  if (payload.purpose !== "kyc-2") throw new UnauthorizedError("Invalid token purpose");

  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
  if (!user) throw new UnauthorizedError("User not found");

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 8);
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  if (!user.phone) throw new BadRequestError("Please provide your phone number first");
  await db.update(users).set({
    phoneVerificationOtpHash: otpHash,
    phoneVerificationOtpExpiresAt: otpExpiry,
  }).where(eq(users.id, user.id));

  let delivered = true;
  try {
    ({ delivered } = await sendPhoneVerificationOtp(user.phone, otp));
  } catch (err) {
    logger.error("Failed to resend phone verification SMS", { userId: user.id, error: String(err) });
    if (env.NODE_ENV === "production") {
      await db.update(users).set({
        phoneVerificationOtpHash: null,
        phoneVerificationOtpExpiresAt: null,
      }).where(eq(users.id, user.id));
      throw new BadRequestError("Could not resend the phone OTP. Please try again or contact the administrator.");
    }
    delivered = false;
  }

  if (env.NODE_ENV !== "production") {
    logger.info(`[Phone OTP resend — dev] Code for ${user.phone}: ${otp}`);
  }

  const devOtp = !delivered && env.NODE_ENV !== "production" ? otp : undefined;
  return { devOtp };
}
