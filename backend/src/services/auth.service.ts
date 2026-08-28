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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

// A precomputed bcrypt hash with no matching plaintext, used to keep the
// login path's timing constant when no user row exists. Without this,
// `if (!user) throw ...` returns almost instantly while a real user goes
// through a ~100ms bcrypt.compare, letting an attacker distinguish
// registered emails from unregistered ones by response time alone.
const DUMMY_PASSWORD_HASH =
  "$2a$12$CwTycUXWue0Thq9StjUM0uJ8i8u5FIRcaQCX9SZY0v7Y9lqQ.QW8u";

/**
 * Every user gets a permanent, unique, human-readable Voter ID derived from
 * their account UUID: VTR-XXXXXXXX. Unlike a name (which two different voters
 * or candidates can share), this ID always identifies exactly one person —
 * it's shown at registration and everywhere the user's identity is displayed
 * so there's never any confusion about who is who.
 */
export function toVoterId(userId: string): string {
  return "VTR-" + userId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function mapUser(user: typeof users.$inferSelect) {
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
    profilePhotoUrl: user.profilePhotoUrl,
  };
}

type EmailVerificationMethod = "otp" | "link";

// ─── Registration — Step 1: collect details and send email verification ───────

export async function initiateRegistration(
  body: {
    fullName: string;
    email: string;
    dob: string;
    emailVerificationMethod?: EmailVerificationMethod;
  },
  ipAddress?: string
): Promise<{ regToken: string }> {
  const emailLower = body.email.toLowerCase().trim();
  const existingEmail = await db.query.users.findFirst({ where: eq(users.email, emailLower) });
  if (existingEmail) {
    if (existingEmail.isVerified) throw new BadRequestError("An account with this Gmail address already exists");
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
  const verificationTokenHash = verificationToken
    ? crypto.createHash("sha256").update(verificationToken).digest("hex")
    : null;

  const [user] = await db
    .insert(users)
    .values({
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
      emailVerificationOtpExpiresAt: emailOtp
        ? new Date(Math.min(registrationExpiresAt.getTime(), Date.now() + 10 * 60 * 1000))
        : null,
    })
    .returning();

  // Confirm delivery before telling the user the challenge is ready. In
  // development the mail helper logs the message instead.
  const emailDelivery = emailVerificationMethod === "otp" && emailOtp
    ? sendRegistrationOtpEmail(user.email, user.fullName, emailOtp)
    : verificationToken
      ? sendVerificationEmail(user.email, verificationToken)
      : Promise.resolve();
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

// ─── Registration — Step 3: set password after email verification ─────────────

export async function setRegistrationPassword(
  setPasswordToken: string,
  password: string,
  ipAddress?: string
): Promise<{ voterId: string }> {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(setPasswordToken, env.JWT_SECRET) as typeof payload;
  } catch {
    throw new UnauthorizedError("Link has expired — please restart registration or request a new email");
  }
  if (payload.purpose !== "reg-setpwd") throw new UnauthorizedError("Invalid token");

  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
  if (!user) throw new UnauthorizedError("User not found");
  if (user.isVerified) throw new BadRequestError("Account is already active — please sign in");
  if (!user.emailVerified) throw new UnauthorizedError("Please verify your Gmail address first");
  if (user.registrationExpiresAt && user.registrationExpiresAt < new Date()) {
    throw new UnauthorizedError("Registration expired — please start again");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .update(users)
    .set({ passwordHash, passwordSetAt: new Date() })
    .where(eq(users.id, user.id));

  recordAudit(user.id, "REGISTER_PASSWORD_CREATED", undefined, undefined, ipAddress).catch(() => {});

  // Hand back the voter's permanent unique ID so the frontend can show it to
  // them right away — this is the ID that disambiguates them from anyone
  // sharing their name, on the ballot and everywhere else in the app.
  return { voterId: toVoterId(user.id) };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });

  // Always run bcrypt.compare, even for a missing user, against a dummy hash.
  // This keeps response time constant so timing can't be used to enumerate
  // which emails are registered.
  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !passwordOk) throw new UnauthorizedError("Invalid email or password");

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
    return { twoFactorRequired: true as const, challengeToken };
  }

  if (user.isBiometricRegistered) {
    const loginToken = jwt.sign(
      { userId: user.id, purpose: "login-bio" },
      env.JWT_SECRET,
      { expiresIn: "5m" }
    );
    return { biometricLoginRequired: true as const, loginToken };
  }

  if (!user.isVerified) {
    const kycToken = jwt.sign(
      { userId: user.id, purpose: "kyc-1" },
      env.JWT_SECRET,
      { expiresIn: "10m" }
    );
    return { kycRequired: true as const, kycToken };
  }

  const { rawToken } = await createSession({ userId: user.id, userAgent, ipAddress });
  const accessToken = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "15m" });
  return { accessToken, user: mapUser(user), rawToken };
}

// ─── Login with PIN (alternative to biometric) ───────────────────────────────

/**
 * Verifies a 6-digit login PIN for a user who has biometrics registered.
 * loginToken is the same short-lived JWT issued by loginUser when biometricLoginRequired.
 *
 * FIX: now captures and returns the rawToken from createSession so that
 * loginPinHandler can set the httpOnly refreshToken cookie. Previously the
 * rawToken was discarded, making silent token refresh impossible.
 */
export async function loginWithPin(
  loginToken: string,
  pin: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ rawToken: string; accessToken: string; user: ReturnType<typeof mapUser> }> {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(loginToken, env.JWT_SECRET) as typeof payload;
  } catch {
    throw new UnauthorizedError("Login session expired — please sign in again");
  }
  if (payload.purpose !== "login-bio") throw new UnauthorizedError("Invalid token purpose");

  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
  if (!user) throw new UnauthorizedError("User not found");

  if (!user.loginPinHash) {
    throw new BadRequestError("Login PIN not set — please use biometric or contact support");
  }

  const pinOk = await bcrypt.compare(pin.trim(), user.loginPinHash);
  if (!pinOk) throw new UnauthorizedError("Incorrect PIN — please try again");

  // FIX: capture rawToken so the caller can set the refresh cookie
  const { rawToken } = await createSession({ userId: user.id, userAgent, ipAddress });
  const accessToken = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "15m" });

  recordAudit(user.id, "LOGIN_PIN", undefined, undefined, ipAddress).catch(() => {});

  const fresh = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  return { rawToken, accessToken, user: mapUser(fresh!) };
}

// ─── PIN setup (authenticated — called after biometric registration) ──────────

/**
 * Stores bcrypt hashes for both the login PIN and the voting PIN.
 * Both PINs are exactly 6 digits.
 */
export async function setupPins(
  userId: string,
  loginPin: string,
  votingPin: string,
  ipAddress?: string
): Promise<void> {
  if (!/^\d{6}$/.test(loginPin)) throw new BadRequestError("Login PIN must be exactly 6 digits");
  if (!/^\d{6}$/.test(votingPin)) throw new BadRequestError("Voting PIN must be exactly 6 digits");
  if (loginPin === votingPin) throw new BadRequestError("Login PIN and Voting PIN must be different");

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new UnauthorizedError("User not found");

  // bcrypt cost 10 — PINs are long-lived credentials (unlike short-lived OTPs)
  const [loginPinHash, votingPinHash] = await Promise.all([
    bcrypt.hash(loginPin, 10),
    bcrypt.hash(votingPin, 10),
  ]);

  await db
    .update(users)
    .set({ loginPinHash, votingPinHash })
    .where(eq(users.id, userId));

  recordAudit(userId, "PINS_SETUP", undefined, undefined, ipAddress).catch(() => {});
}

// ─── 2FA login (admin TOTP) ───────────────────────────────────────────────────

export async function login2fa(
  challengeToken: string,
  code: string,
  ipAddress?: string,
  userAgent?: string
) {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(challengeToken, env.JWT_SECRET) as any;
  } catch {
    throw new UnauthorizedError("Challenge token expired or invalid");
  }

  if (payload.purpose !== "2fa-challenge") throw new UnauthorizedError("Invalid challenge token");

  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
  if (!user || !user.twoFactorSecretEncrypted) throw new UnauthorizedError("2FA not configured");

  const { decryptSecret, verifyTotpCode, verifyRecoveryCode } = await import("./totp.service");

  const isRecovery = code.includes("-");
  if (isRecovery) {
    if (!user.twoFactorRecoveryCodesHash) throw new UnauthorizedError("No recovery codes configured");
    const codesHash: string[] = JSON.parse(user.twoFactorRecoveryCodesHash as any);
    // FIX: verifyRecoveryCode returns { valid, remaining } — check .valid
    const { valid, remaining } = verifyRecoveryCode(code.trim(), codesHash);
    if (!valid) throw new UnauthorizedError("Invalid recovery code");

    // Consume the used code
    await db
      .update(users)
      .set({ twoFactorRecoveryCodesHash: JSON.stringify(remaining) as any })
      .where(eq(users.id, user.id));
  } else {
    const secret = decryptSecret(user.twoFactorSecretEncrypted);
    // FIX: correct arg order — (secret, code) — and awaited (verifyTotpCode is async)
    const valid = await verifyTotpCode(secret, code.trim());
    if (!valid) throw new UnauthorizedError("Invalid authentication code");
  }

  recordAudit(user.id, "2FA_VERIFIED", undefined, undefined, ipAddress).catch(() => {});

  if (user.isBiometricRegistered) {
    const loginToken = jwt.sign(
      { userId: user.id, purpose: "login-bio" },
      env.JWT_SECRET,
      { expiresIn: "5m" }
    );
    return { biometricLoginRequired: true as const, loginToken };
  }

  const kycToken = jwt.sign(
    { userId: user.id, purpose: "kyc-1" },
    env.JWT_SECRET,
    { expiresIn: "10m" }
  );
  return { kycRequired: true as const, kycToken };
}

// ─── Current user ─────────────────────────────────────────────────────────────

export async function getCurrentUser(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new NotFoundError("User not found");
  return mapUser(user);
}

// ─── Password reset ────────────────────────────────────────────────────────────

export async function forgotPassword(email: string, ipAddress?: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });
  if (!user) return;

  // The raw token goes in the email link; only its SHA-256 hash is stored.
  // (Previously the raw token itself was stored in passwordResetTokenHash,
  // so anyone who read the users table — a DB backup leak, an insider, a
  // SQL-injection bug elsewhere — could use it directly to take over any
  // account with a live reset request, no email access needed.)
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await db
    .update(users)
    .set({ passwordResetTokenHash: resetTokenHash, passwordResetExpiresAt: resetExpiry })
    .where(eq(users.id, user.id));

  sendPasswordResetEmail(user.email, resetToken).catch((err) =>
    logger.error("Failed to send password reset email", { userId: user.id, error: String(err) })
  );

  recordAudit(user.id, "PASSWORD_RESET_REQUESTED", undefined, undefined, ipAddress).catch(() => {});
}

export async function resetPassword(token: string, newPassword: string, ipAddress?: string) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await db.query.users.findFirst({ where: eq(users.passwordResetTokenHash, tokenHash) });
  if (!user || !user.passwordResetExpiresAt) throw new BadRequestError("Invalid or expired reset link");
  if (user.passwordResetExpiresAt < new Date()) throw new BadRequestError("Reset link has expired");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash, passwordResetTokenHash: null, passwordResetExpiresAt: null })
    .where(eq(users.id, user.id));

  recordAudit(user.id, "PASSWORD_RESET", undefined, undefined, ipAddress).catch(() => {});
}

async function completeEmailVerification(user: typeof users.$inferSelect) {
  await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
      emailVerificationOtpHash: null,
      emailVerificationOtpExpiresAt: null,
    })
    .where(eq(users.id, user.id));

  recordAudit(user.id, "REGISTER_EMAIL_VERIFIED").catch(() => {});

  return {
    setPasswordToken: jwt.sign(
      { userId: user.id, purpose: "reg-setpwd" },
      env.JWT_SECRET,
      { expiresIn: "15m" }
    ),
  };
}

export async function verifyRegistrationOtp(email: string, otp: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });
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

export async function verifyEmail(token: string) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await db.query.users.findFirst({
    where: eq(users.emailVerificationTokenHash, tokenHash),
  });
  if (!user) throw new NotFoundError("Invalid or expired verification link");
  if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date()) {
    throw new BadRequestError("Verification link has expired");
  }
  if (user.isVerified) throw new BadRequestError("This account is already fully verified");

  return completeEmailVerification(user);
}

export async function resendVerification(userId: string, ipAddress?: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new NotFoundError("User not found");
  if (user.emailVerified) throw new BadRequestError("Email is already verified");

  await sendEmailVerificationChallenge(user);
  recordAudit(user.id, "REGISTER_EMAIL_VERIFICATION_RESENT", undefined, undefined, ipAddress).catch(() => {});
}

async function sendEmailVerificationChallenge(
  user: typeof users.$inferSelect,
  requestedMethod?: EmailVerificationMethod
) {
  const method = requestedMethod ?? (user.emailVerificationMethod as EmailVerificationMethod) ?? "otp";
  const registrationExpiry = user.registrationExpiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
  const otp = method === "otp" ? generateOtp() : null;
  const token = method === "link" ? crypto.randomBytes(32).toString("hex") : null;

  await db.update(users).set({
    emailVerificationMethod: method,
    emailVerificationTokenHash: token
      ? crypto.createHash("sha256").update(token).digest("hex")
      : null,
    emailVerificationExpiresAt: token ? registrationExpiry : null,
    emailVerificationOtpHash: otp ? await bcrypt.hash(otp, 8) : null,
    emailVerificationOtpExpiresAt: otp
      ? new Date(Math.min(registrationExpiry.getTime(), Date.now() + 10 * 60 * 1000))
      : null,
  }).where(eq(users.id, user.id));

  const delivery = method === "otp" && otp
    ? sendRegistrationOtpEmail(user.email, user.fullName, otp)
    : token
      ? sendVerificationEmail(user.email, token)
      : Promise.resolve();
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
  email: string,
  requestedMethod?: EmailVerificationMethod,
  ipAddress?: string
) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });
  if (!user || user.emailVerified || (user.registrationExpiresAt && user.registrationExpiresAt < new Date())) return;

  await sendEmailVerificationChallenge(user, requestedMethod);
  recordAudit(user.id, "REGISTER_EMAIL_VERIFICATION_RESENT", undefined, undefined, ipAddress).catch(() => {});
}

// ─── Admin step-up auth (used before destructive actions like election deletion) ─

/**
 * Re-verifies a currently-logged-in admin's identity with their password and
 * current 2FA code before allowing a destructive, irreversible action.
 * Admin accounts are required to have 2FA enabled (see requireTwoFactor
 * middleware), so both factors are always available to check here.
 */
export async function verifyAdminStepUp(
  userId: string,
  password: string,
  code: string,
  ipAddress?: string
) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new NotFoundError("User not found");

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

// ─── Session-authenticated PIN verification ──────────────────────────────────

/**
 * Verifies the login PIN for an already-authenticated user (no loginToken
 * required). Used by the admin step-up modal when the admin chooses the
 * "Login PIN" tab instead of biometric.
 *
 * Intentionally shares the same PIN as the login flow so admins don't need
 * to remember a separate admin PIN.
 */
export async function verifySessionLoginPin(userId: string, pin: string): Promise<void> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new NotFoundError("User not found");

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
