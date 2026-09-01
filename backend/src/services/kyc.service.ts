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

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function normalizeDob(raw) {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {return trimmed.slice(0, 10);}
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {return trimmed;}
  const dmY = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmY) {return `${dmY[3]}-${dmY[2]}-${dmY[1]}`;}
  const mdY = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (mdY) {return `${mdY[3]}-${mdY[1]}-${mdY[2]}`;}
  return trimmed;
}

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 ? `+91${digits}` : raw.trim();
}

export async function verifyIdentity(kycToken, phone, dob) {
  let payload;
  try {
    payload = jwt.verify(kycToken, env.JWT_SECRET);
  } catch {
    throw new UnauthorizedError("Session expired — please sign in again");
  }
  if (payload.purpose !== "kyc-1") {throw new UnauthorizedError("Invalid token purpose");}

  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
  if (!user) {throw new UnauthorizedError("User not found");}

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
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await db.
  update(users).
  set({
    phone: normalizedPhone,
    phoneVerified: false,
    phoneVerificationOtpHash: otpHash,
    phoneVerificationOtpExpiresAt: otpExpiry
  }).
  where(eq(users.id, user.id));

  let delivered = true;
  try {
    ({ delivered } = await sendPhoneVerificationOtp(normalizedPhone, otp));
  } catch (err) {
    logger.error("Failed to send phone verification SMS", { userId: user.id, error: String(err) });

    delivered = false;
  }

  if (env.NODE_ENV !== "production") {
    logger.info(`[Phone OTP — dev] Code for ${normalizedPhone}: ${otp}`);
  }

  const kycToken2 = jwt.sign({ userId: user.id, purpose: "kyc-2" }, env.JWT_SECRET, { expiresIn: "15m" });
  recordAudit(user.id, "PHONE_VERIFICATION_INITIATED").catch(() => {});

  const devOtp = !delivered ? otp : undefined;

  return { kycToken: kycToken2, devOtp };
}

export async function verifyOtp(kycToken, otp) {
  let payload;
  try {
    payload = jwt.verify(kycToken, env.JWT_SECRET);
  } catch {
    throw new UnauthorizedError("Session expired — please sign in again");
  }
  if (payload.purpose !== "kyc-2") {throw new UnauthorizedError("Invalid token purpose");}

  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
  if (!user) {throw new UnauthorizedError("User not found");}

  if (!user.phoneVerificationOtpHash || !user.phoneVerificationOtpExpiresAt) {
    throw new BadRequestError("No phone verification code found — request a new one");
  }
  if (user.phoneVerificationOtpExpiresAt < new Date()) {
    throw new BadRequestError("Phone verification code has expired — request a new one");
  }

  const otpOk = await bcrypt.compare(otp.trim(), user.phoneVerificationOtpHash);
  if (!otpOk) {throw new BadRequestError("Incorrect verification code");}

  await db.
  update(users).
  set({
    phoneVerified: true,
    isVerified: true,
    phoneVerificationOtpHash: null,
    phoneVerificationOtpExpiresAt: null
  }).
  where(eq(users.id, user.id));

  recordAudit(user.id, "PHONE_VERIFIED").catch(() => {});

  const { rawToken } = await createSession({ userId: user.id, userAgent: "phone-verification" });
  const accessToken = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "15m" });

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
      dob: user.dob
    }
  };
}

export async function resendKycOtp(kycToken) {
  let payload;
  try {
    payload = jwt.verify(kycToken, env.JWT_SECRET);
  } catch {
    throw new UnauthorizedError("Session expired — please sign in again");
  }
  if (payload.purpose !== "kyc-2") {throw new UnauthorizedError("Invalid token purpose");}

  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
  if (!user) {throw new UnauthorizedError("User not found");}

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 8);
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  if (!user.phone) {throw new BadRequestError("Please provide your phone number first");}

  await db.
  update(users).
  set({
    phoneVerificationOtpHash: otpHash,
    phoneVerificationOtpExpiresAt: otpExpiry
  }).
  where(eq(users.id, user.id));

  let delivered = true;
  try {
    ({ delivered } = await sendPhoneVerificationOtp(user.phone, otp));
  } catch (err) {
    logger.error("Failed to resend phone verification SMS", { userId: user.id, error: String(err) });

    delivered = false;
  }

  if (env.NODE_ENV !== "production") {
    logger.info(`[Phone OTP resend — dev] Code for ${user.phone}: ${otp}`);
  }

  const devOtp = !delivered ? otp : undefined;

  return { devOtp };
}