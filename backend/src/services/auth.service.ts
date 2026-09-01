import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, users } from "@voting/database";
import { eq } from "drizzle-orm";
import { env } from "../config/env";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../lib/errors";
import { sendPasswordResetEmail, sendRegistrationOtpEmail, sendVerificationEmail } from "../lib/email";
import { createSession } from "./session.service";
import { recordAudit } from "../lib/audit";
import { logger } from "../lib/logger";

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

const DUMMY_PASSWORD_HASH =
"$2a$12$CwTycUXWue0Thq9StjUM0uJ8i8u5FIRcaQCX9SZY0v7Y9lqQ.QW8u";

export function toVoterId(userId) {
  return "VTR-" + userId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function mapUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    voterId: toVoterId(user.id),
    walletAddress: user.walletAddress,
    isVerified: user.isVerified,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
    isBiometricRegistered: user.isBiometricRegistered,
    phone: user.phone,
    dob: user.dob,
    bio: user.bio,
    qualifications: user.qualifications,
    experience: user.experience,
    profilePhotoUrl: user.profilePhotoUrl
  };
}

export async function initiateRegistration(
body,

ipAddress)
{
  const emailLower = body.email.toLowerCase().trim();
  const existingEmail = await db.query.users.findFirst({ where: eq(users.email, emailLower) });
  if (existingEmail) {
    if (existingEmail.isVerified) {throw new BadRequestError("An account with this Gmail address already exists");}
    if (!existingEmail.registrationExpiresAt || existingEmail.registrationExpiresAt > new Date()) {
      throw new BadRequestError("A registration is already in progress for this Gmail address");
    }
    await db.delete(users).where(eq(users.id, existingEmail.id));
  }

  const registrationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const placeholderHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 6);
  const emailVerificationMethod = body.emailVerificationMethod ?? "otp";
  const emailOtp = emailVerificationMethod === "otp" ? generateOtp() : null;
  const emailOtpHash = emailOtp ? await bcrypt.hash(emailOtp, 8) : null;
  const verificationToken = emailVerificationMethod === "link" ? crypto.randomBytes(32).toString("hex") : null;
  const verificationTokenHash = verificationToken ?
  crypto.createHash("sha256").update(verificationToken).digest("hex") :
  null;

  const [user] = await db.
  insert(users).
  values({
    fullName: body.fullName.trim(),
    email: emailLower,
    passwordHash: placeholderHash,
    dob: body.dob,
    isVerified: false,
    emailVerified: false,
    phoneVerified: false,
    emailVerificationMethod,
    registrationExpiresAt,
    emailVerificationTokenHash: verificationTokenHash,
    emailVerificationExpiresAt: verificationToken ? registrationExpiresAt : null,
    emailVerificationOtpHash: emailOtpHash,
    emailVerificationOtpExpiresAt: emailOtp ?
    new Date(Math.min(registrationExpiresAt.getTime(), Date.now() + 10 * 60 * 1000)) :
    null
  }).
  returning();

  const emailDelivery = emailVerificationMethod === "otp" && emailOtp ?
  sendRegistrationOtpEmail(user.email, user.fullName, emailOtp) :
  verificationToken ?
  sendVerificationEmail(user.email, verificationToken) :
  Promise.resolve();
  try {
    await emailDelivery;
  } catch (err) {
    logger.error("Failed to send registration email verification", { userId: user.id, error: String(err) });
    throw new BadRequestError("Could not send the Gmail verification message. Please try again.");
  }

  if (emailOtp && env.NODE_ENV !== "production") {
    logger.info(`[Registration email OTP — dev] Code for ${user.email}: ${emailOtp}`);
  }

  recordAudit(user.id, "REGISTER_INITIATED", undefined, undefined, ipAddress).catch(() => {});

  const regToken = jwt.sign(
    { userId: user.id, purpose: "reg-email" },
    env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  return { regToken };
}

export async function setRegistrationPassword(
setPasswordToken,
password,
ipAddress)
{
  let payload;
  try {
    payload = jwt.verify(setPasswordToken, env.JWT_SECRET);
  } catch {
    throw new UnauthorizedError("Link has expired — please restart registration or request a new email");
  }
  if (payload.purpose !== "reg-setpwd") {throw new UnauthorizedError("Invalid token");}

  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
  if (!user) {throw new UnauthorizedError("User not found");}
  if (user.isVerified) {throw new BadRequestError("Account is already active — please sign in");}
  if (!user.emailVerified) {throw new UnauthorizedError("Please verify your Gmail address first");}
  if (user.registrationExpiresAt && user.registrationExpiresAt < new Date()) {
    throw new UnauthorizedError("Registration expired — please start again");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.
  update(users).
  set({ passwordHash, passwordSetAt: new Date() }).
  where(eq(users.id, user.id));

  recordAudit(user.id, "REGISTER_PASSWORD_CREATED", undefined, undefined, ipAddress).catch(() => {});

  return { voterId: toVoterId(user.id) };
}

export async function loginUser(
email,
password,
ipAddress,
userAgent)
{
  const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase().trim()) });

  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !passwordOk) {throw new UnauthorizedError("Invalid email or password");}

  if (!user.isVerified && (!user.emailVerified || !user.passwordSetAt)) {
    throw new UnauthorizedError("Please verify your Gmail address and create your password first");
  }

  recordAudit(user.id, "LOGIN_ATTEMPT", undefined, undefined, ipAddress).catch(() => {});

  if (user.isTwoFactorEnabled && user.twoFactorSecretEncrypted) {
    const challengeToken = jwt.sign(
      { userId: user.id, purpose: "2fa-challenge" },
      env.JWT_SECRET,
      { expiresIn: "10m" }
    );
    return { twoFactorRequired: true, challengeToken };
  }

  if (user.isBiometricRegistered) {
    const loginToken = jwt.sign(
      { userId: user.id, purpose: "login-bio" },
      env.JWT_SECRET,
      { expiresIn: "5m" }
    );
    return { biometricLoginRequired: true, loginToken };
  }

  if (!user.isVerified) {
    const kycToken = jwt.sign(
      { userId: user.id, purpose: "kyc-1" },
      env.JWT_SECRET,
      { expiresIn: "10m" }
    );
    return { kycRequired: true, kycToken };
  }

  const { rawToken } = await createSession({ userId: user.id, userAgent, ipAddress });
  const accessToken = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "15m" });
  return { accessToken, user: mapUser(user), rawToken };
}

export async function loginWithPin(
loginToken,
pin,
ipAddress,
userAgent)
{
  let payload;
  try {
    payload = jwt.verify(loginToken, env.JWT_SECRET);
  } catch {
    throw new UnauthorizedError("Login session expired — please sign in again");
  }
  if (payload.purpose !== "login-bio") {throw new UnauthorizedError("Invalid token purpose");}

  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
  if (!user) {throw new UnauthorizedError("User not found");}

  if (!user.loginPinHash) {
    throw new BadRequestError("Login PIN not set — please use biometric or contact support");
  }

  const pinOk = await bcrypt.compare(pin.trim(), user.loginPinHash);
  if (!pinOk) {throw new UnauthorizedError("Incorrect PIN — please try again");}

  const { rawToken } = await createSession({ userId: user.id, userAgent, ipAddress });
  const accessToken = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "15m" });

  recordAudit(user.id, "LOGIN_PIN", undefined, undefined, ipAddress).catch(() => {});

  const fresh = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  return { rawToken, accessToken, user: mapUser(fresh) };
}

export async function setupPins(
userId,
loginPin,
votingPin,
ipAddress)
{
  if (!/^\d{6}$/.test(loginPin)) {throw new BadRequestError("Login PIN must be exactly 6 digits");}
  if (!/^\d{6}$/.test(votingPin)) {throw new BadRequestError("Voting PIN must be exactly 6 digits");}
  if (loginPin === votingPin) {throw new BadRequestError("Login PIN and Voting PIN must be different");}

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {throw new UnauthorizedError("User not found");}

  const [loginPinHash, votingPinHash] = await Promise.all([
  bcrypt.hash(loginPin, 10),
  bcrypt.hash(votingPin, 10)]
  );

  await db.
  update(users).
  set({ loginPinHash, votingPinHash }).
  where(eq(users.id, userId));

  recordAudit(userId, "PINS_SETUP", undefined, undefined, ipAddress).catch(() => {});
}

export async function login2fa(
challengeToken,
code,
ipAddress,
userAgent)
{
  let payload;
  try {
    payload = jwt.verify(challengeToken, env.JWT_SECRET);
  } catch {
    throw new UnauthorizedError("Challenge token expired or invalid");
  }

  if (payload.purpose !== "2fa-challenge") {throw new UnauthorizedError("Invalid challenge token");}

  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
  if (!user || !user.twoFactorSecretEncrypted) {throw new UnauthorizedError("2FA not configured");}

  const { decryptSecret, verifyTotpCode, verifyRecoveryCode } = await import("./totp.service");

  const isRecovery = code.includes("-");
  if (isRecovery) {
    if (!user.twoFactorRecoveryCodesHash) {throw new UnauthorizedError("No recovery codes configured");}
    const codesHash = JSON.parse(user.twoFactorRecoveryCodesHash);

    const { valid, remaining } = verifyRecoveryCode(code.trim(), codesHash);
    if (!valid) {throw new UnauthorizedError("Invalid recovery code");}

    await db.
    update(users).
    set({ twoFactorRecoveryCodesHash: JSON.stringify(remaining) }).
    where(eq(users.id, user.id));
  } else {
    const secret = decryptSecret(user.twoFactorSecretEncrypted);

    const valid = await verifyTotpCode(secret, code.trim());
    if (!valid) {throw new UnauthorizedError("Invalid authentication code");}
  }

  recordAudit(user.id, "2FA_VERIFIED", undefined, undefined, ipAddress).catch(() => {});

  if (user.isBiometricRegistered) {
    const loginToken = jwt.sign(
      { userId: user.id, purpose: "login-bio" },
      env.JWT_SECRET,
      { expiresIn: "5m" }
    );
    return { biometricLoginRequired: true, loginToken };
  }

  const kycToken = jwt.sign(
    { userId: user.id, purpose: "kyc-1" },
    env.JWT_SECRET,
    { expiresIn: "10m" }
  );
  return { kycRequired: true, kycToken };
}

export async function getCurrentUser(userId) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {throw new NotFoundError("User not found");}
  return mapUser(user);
}

export async function forgotPassword(email, ipAddress) {
  const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase().trim()) });
  if (!user) {return;}

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await db.
  update(users).
  set({ passwordResetTokenHash: resetTokenHash, passwordResetExpiresAt: resetExpiry }).
  where(eq(users.id, user.id));

  sendPasswordResetEmail(user.email, resetToken).catch((err) =>
  {return logger.error("Failed to send password reset email", { userId: user.id, error: String(err) });}
  );

  recordAudit(user.id, "PASSWORD_RESET_REQUESTED", undefined, undefined, ipAddress).catch(() => {});
}

export async function resetPassword(token, newPassword, ipAddress) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await db.query.users.findFirst({ where: eq(users.passwordResetTokenHash, tokenHash) });
  if (!user || !user.passwordResetExpiresAt) {throw new BadRequestError("Invalid or expired reset link");}
  if (user.passwordResetExpiresAt < new Date()) {throw new BadRequestError("Reset link has expired");}

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.
  update(users).
  set({ passwordHash, passwordResetTokenHash: null, passwordResetExpiresAt: null }).
  where(eq(users.id, user.id));

  recordAudit(user.id, "PASSWORD_RESET", undefined, undefined, ipAddress).catch(() => {});
}

async function completeEmailVerification(user) {
  await db.
  update(users).
  set({
    emailVerified: true,
    emailVerificationTokenHash: null,
    emailVerificationExpiresAt: null,
    emailVerificationOtpHash: null,
    emailVerificationOtpExpiresAt: null
  }).
  where(eq(users.id, user.id));

  recordAudit(user.id, "REGISTER_EMAIL_VERIFIED").catch(() => {});

  return {
    setPasswordToken: jwt.sign(
      { userId: user.id, purpose: "reg-setpwd" },
      env.JWT_SECRET,
      { expiresIn: "15m" }
    )
  };
}

export async function verifyRegistrationOtp(email, otp) {
  const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase().trim()) });
  if (!user || user.emailVerified || user.emailVerificationMethod !== "otp") {
    throw new BadRequestError("Invalid or expired email verification code");
  }
  if (user.registrationExpiresAt && user.registrationExpiresAt < new Date()) {
    throw new BadRequestError("Registration expired — please start again");
  }
  if (!user.emailVerificationOtpHash || !user.emailVerificationOtpExpiresAt) {
    throw new BadRequestError("No email verification code found — request a new one");
  }
  if (user.emailVerificationOtpExpiresAt < new Date()) {
    throw new BadRequestError("Email verification code has expired — request a new one");
  }
  if (!(await bcrypt.compare(otp.trim(), user.emailVerificationOtpHash))) {
    throw new BadRequestError("Incorrect email verification code");
  }

  return completeEmailVerification(user);
}

export async function verifyEmail(token) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await db.query.users.findFirst({ where: eq(users.emailVerificationTokenHash, tokenHash) });
  if (!user) {throw new NotFoundError("Invalid or expired verification link");}
  if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date()) {
    throw new BadRequestError("Verification link has expired");
  }
  if (user.isVerified) {throw new BadRequestError("This account is already fully verified");}

  return completeEmailVerification(user);
}

export async function resendVerification(userId, ipAddress) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {throw new NotFoundError("User not found");}
  if (user.emailVerified) {throw new BadRequestError("Email is already verified");}

  await sendEmailVerificationChallenge(user);
  recordAudit(user.id, "REGISTER_EMAIL_VERIFICATION_RESENT", undefined, undefined, ipAddress).catch(() => {});
}

async function sendEmailVerificationChallenge(
user,
requestedMethod)
{
  const method = requestedMethod ?? user.emailVerificationMethod ?? "otp";
  const registrationExpiry = user.registrationExpiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
  const otp = method === "otp" ? generateOtp() : null;
  const token = method === "link" ? crypto.randomBytes(32).toString("hex") : null;

  await db.update(users).set({
    emailVerificationMethod: method,
    emailVerificationTokenHash: token ?
    crypto.createHash("sha256").update(token).digest("hex") :
    null,
    emailVerificationExpiresAt: token ? registrationExpiry : null,
    emailVerificationOtpHash: otp ? await bcrypt.hash(otp, 8) : null,
    emailVerificationOtpExpiresAt: otp ?
    new Date(Math.min(registrationExpiry.getTime(), Date.now() + 10 * 60 * 1000)) :
    null
  }).where(eq(users.id, user.id));

  const delivery = method === "otp" && otp ?
  sendRegistrationOtpEmail(user.email, user.fullName, otp) :
  token ?
  sendVerificationEmail(user.email, token) :
  Promise.resolve();
  try {
    await delivery;
  } catch (err) {
    logger.error("Failed to resend registration email verification", { userId: user.id, error: String(err) });
    throw new BadRequestError("Could not send the Gmail verification message. Please try again.");
  }

  if (otp && env.NODE_ENV !== "production") {
    logger.info(`[Registration email OTP resend — dev] Code for ${user.email}: ${otp}`);
  }
}

export async function resendVerificationByEmail(
email,
requestedMethod,
ipAddress)
{
  const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase().trim()) });
  if (!user || user.emailVerified || user.registrationExpiresAt && user.registrationExpiresAt < new Date()) {return;}

  await sendEmailVerificationChallenge(user, requestedMethod);
  recordAudit(user.id, "REGISTER_EMAIL_VERIFICATION_RESENT", undefined, undefined, ipAddress).catch(() => {});
}

export async function verifyAdminStepUp(
userId,
password,
code,
ipAddress)
{
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {throw new NotFoundError("User not found");}

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    recordAudit(user.id, "ADMIN_STEP_UP_FAILED", { reason: "bad_password" }, undefined, ipAddress).catch(() => {});
    throw new UnauthorizedError("Incorrect password");
  }

  if (!user.isTwoFactorEnabled || !user.twoFactorSecretEncrypted) {
    throw new UnauthorizedError("Two-factor authentication must be enabled for this action");
  }

  const { decryptSecret, verifyTotpCode } = await import("./totp.service");
  const secret = decryptSecret(user.twoFactorSecretEncrypted);
  const codeOk = await verifyTotpCode(secret, code.trim());
  if (!codeOk) {
    recordAudit(user.id, "ADMIN_STEP_UP_FAILED", { reason: "bad_totp" }, undefined, ipAddress).catch(() => {});
    throw new UnauthorizedError("Invalid authentication code");
  }

  recordAudit(user.id, "ADMIN_STEP_UP_VERIFIED", undefined, undefined, ipAddress).catch(() => {});
}

export async function verifySessionLoginPin(userId, pin) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {throw new NotFoundError("User not found");}

  if (!user.loginPinHash) {
    throw new UnauthorizedError("No Login PIN is set on this account — please set one in Security settings");
  }

  const ok = await bcrypt.compare(pin.trim(), user.loginPinHash);
  if (!ok) {
    recordAudit(userId, "ADMIN_PIN_STEPUP_FAILED", {}, undefined, undefined).catch(() => {});
    throw new UnauthorizedError("Incorrect PIN — please try again");
  }

  recordAudit(userId, "ADMIN_PIN_STEPUP_OK", {}, undefined, undefined).catch(() => {});
}