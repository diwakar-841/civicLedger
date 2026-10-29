import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, users } from "@voting/database";
import { eq } from "drizzle-orm";
import { env } from "../config/env";
import { UnauthorizedError, BadRequestError } from "../lib/errors";
import { sendPhoneVerificationOtp } from "../lib/sms";
import { recordAudit } from "../lib/audit";
import { logger } from "../lib/logger";
import { createSession } from "./session.service";
import { toVoterId } from "./auth.service";
import { isValidAadhaar, hashAadhaar } from "./aadhaar.service";
import {
  assertNotLockedOut,
  recordFailure,
  recordSuccess,
} from "../lib/attemptLimiter";

function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

function normalizeDob(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const dmY = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmY) return `${dmY[3]}-${dmY[2]}-${dmY[1]}`;
  return trimmed;
}

// The OTP is echoed back to the client ONLY outside production, and only when
// SMS delivery did not happen (dev without Twilio). In production a failed SMS
// send (which an attacker can trigger with a number Twilio rejects) used to
// hand the OTP straight back in the API response, bypassing phone ownership.
function otpForClient(delivered: boolean, otp: string): string | undefined {
  return !delivered && env.NODE_ENV !== "production" ? otp : undefined;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 ? `+91${digits}` : raw.trim();
}

// ─── Step 1: verify DOB + Aadhaar + unique phone, send OTP ────────────────────
export async function verifyIdentity(
  kycToken: string,
  phone: string,
  dob: string,
  aadhaar: string,
) {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(kycToken, env.JWT_SECRET, { algorithms: ["HS256"] }) as {
      userId: string;
      purpose: string;
    };
  } catch {
    throw new UnauthorizedError("Session expired — please sign in again");
  }
  if (payload.purpose !== "kyc-1")
    throw new UnauthorizedError("Invalid token purpose");

  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.userId),
  });
  if (!user) throw new UnauthorizedError("User not found");
  if (user.isVerified) {
    // A leftover kyc-1 token must not let an already-verified account swap
    // its phone / Aadhaar hash and drop phoneVerified.
    throw new BadRequestError("This account is already verified");
  }

  const normalizedInputDob = normalizeDob(dob);
  const normalizedStoredDob = normalizeDob(user.dob ?? "");
  if (normalizedInputDob !== normalizedStoredDob) {
    throw new BadRequestError(
      "Date of birth does not match the registration details",
    );
  }

  const normalizedAadhaar = aadhaar.replace(/\D/g, "");
  if (!isValidAadhaar(normalizedAadhaar)) {
    throw new BadRequestError(
      "Please enter a valid 12-digit Aadhaar number",
    );
  }
  const aadhaarHash = hashAadhaar(normalizedAadhaar);
  const existingAadhaar = await db.query.users.findFirst({
    where: eq(users.aadhaarHash, aadhaarHash),
  });
  if (existingAadhaar && existingAadhaar.id !== user.id) {
    throw new BadRequestError(
      "This Aadhaar number is already linked to another account — each person may register only once",
    );
  }

  const normalizedPhone = normalizePhone(phone);
  const existingPhone = await db.query.users.findFirst({
    where: eq(users.phone, normalizedPhone),
  });
  if (existingPhone && existingPhone.id !== user.id) {
    throw new BadRequestError(
      "This phone number is already linked to another account",
    );
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 8);
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await db
      .update(users)
      .set({
        phone: normalizedPhone,
        phoneVerified: false,
        aadhaarHash,
        phoneVerificationOtpHash: otpHash,
        phoneVerificationOtpExpiresAt: otpExpiry,
      })
      .where(eq(users.id, user.id));
  } catch (err: any) {
    // 23505 = unique_violation — catches the rare race where two requests
    // pass the "already linked" check above for the same Aadhaar number at
    // the same time. The DB's unique index on aadhaar_hash is the backstop.
    if (err?.code === "23505") {
      throw new BadRequestError(
        "This Aadhaar number is already linked to another account — each person may register only once",
      );
    }
    throw err;
  }

  let delivered = true;
  try {
    ({ delivered } = await sendPhoneVerificationOtp(normalizedPhone, otp));
  } catch (err) {
    logger.error("Failed to send phone verification SMS", {
      userId: user.id,
      error: String(err),
    });

    delivered = false;
  }

  if (env.NODE_ENV !== "production") {
    logger.info(`[Phone OTP — dev] Code for ${normalizedPhone}: ${otp}`);
  }

  const kycToken2 = jwt.sign(
    { userId: user.id, purpose: "kyc-2" },
    env.JWT_SECRET,
    { expiresIn: "15m" },
  );
  recordAudit(user.id, "PHONE_VERIFICATION_INITIATED").catch(() => {});

  const devOtp = otpForClient(delivered, otp);

  return { kycToken: kycToken2, devOtp };
}

export async function verifyOtp(kycToken: string, otp: string) {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(kycToken, env.JWT_SECRET, { algorithms: ["HS256"] }) as {
      userId: string;
      purpose: string;
    };
  } catch {
    throw new UnauthorizedError("Session expired — please sign in again");
  }
  if (payload.purpose !== "kyc-2")
    throw new UnauthorizedError("Invalid token purpose");

  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.userId),
  });
  if (!user) throw new UnauthorizedError("User not found");

  if (!user.phoneVerificationOtpHash || !user.phoneVerificationOtpExpiresAt) {
    throw new BadRequestError(
      "No phone verification code found — request a new one",
    );
  }
  if (user.phoneVerificationOtpExpiresAt < new Date()) {
    throw new BadRequestError(
      "Phone verification code has expired — request a new one",
    );
  }

  const otpKey = `kyc-phone-otp:${user.id}`;
  assertNotLockedOut(otpKey);
  const otpOk = await bcrypt.compare(otp.trim(), user.phoneVerificationOtpHash);
  if (!otpOk) {
    recordFailure(otpKey);
    throw new BadRequestError("Incorrect verification code");
  }
  recordSuccess(otpKey);

  await db
    .update(users)
    .set({
      phoneVerified: true,
      isVerified: true,
      phoneVerificationOtpHash: null,
      phoneVerificationOtpExpiresAt: null,
    })
    .where(eq(users.id, user.id));

  recordAudit(user.id, "PHONE_VERIFIED").catch(() => {});

  const { rawToken } = await createSession({
    userId: user.id,
    userAgent: "phone-verification",
  });
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  return {
    accessToken,
    rawToken,
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
      hasVotingPin: Boolean(user.votingPinHash ?? user.pinHash),
      phone: user.phone,
      dob: user.dob,
    },
  };
}

export async function resendKycOtp(kycToken: string) {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(kycToken, env.JWT_SECRET, { algorithms: ["HS256"] }) as {
      userId: string;
      purpose: string;
    };
  } catch {
    throw new UnauthorizedError("Session expired — please sign in again");
  }
  if (payload.purpose !== "kyc-2")
    throw new UnauthorizedError("Invalid token purpose");

  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.userId),
  });
  if (!user) throw new UnauthorizedError("User not found");

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 8);
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  if (!user.phone)
    throw new BadRequestError("Please provide your phone number first");

  await db
    .update(users)
    .set({
      phoneVerificationOtpHash: otpHash,
      phoneVerificationOtpExpiresAt: otpExpiry,
    })
    .where(eq(users.id, user.id));

  let delivered = true;
  try {
    ({ delivered } = await sendPhoneVerificationOtp(user.phone, otp));
  } catch (err) {
    logger.error("Failed to resend phone verification SMS", {
      userId: user.id,
      error: String(err),
    });

    delivered = false;
  }

  if (env.NODE_ENV !== "production") {
    logger.info(`[Phone OTP resend — dev] Code for ${user.phone}: ${otp}`);
  }

  const devOtp = otpForClient(delivered, otp);

  return { devOtp };
}
