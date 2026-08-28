import { Response, NextFunction } from "express";
import { Request } from "express";
import jwt from "jsonwebtoken";
import { AuthedRequest } from "../middlewares/auth.middleware";
import {
  initiateRegistration,
  setRegistrationPassword,
  loginUser,
  loginWithPin,
  setupPins,
  getCurrentUser,
  login2fa,
  verifyEmail,
  verifyRegistrationOtp,
  resendVerification,
  resendVerificationByEmail,
  forgotPassword,
  resetPassword,
  verifySessionLoginPin,
} from "../services/auth.service";
import {
  generateTotpSecret,
  generateTotpQrCode,
  encryptSecret,
  decryptSecret,
  verifyTotpCode,
  generateRecoveryCodes,
  verifyRecoveryCode,
} from "../services/totp.service";
import {
  rotateSession,
  revokeSessionByToken,
  revokeAllUserSessions,
  getUserActiveSessions,
  revokeSessionById,
} from "../services/session.service";
import { db, users } from "@voting/database";
import { eq } from "drizzle-orm";
import { env } from "../config/env";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../lib/errors";
import { recordAudit } from "../lib/audit";
import { setRefreshCookie, clearRefreshCookie } from "../lib/cookies";

// ── Registration ──────────────────────────────────────────────────────────────

export async function registerInitiate(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await initiateRegistration(req.body, req.ip);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function registerSetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { setPasswordToken, password } = req.body;
    const { voterId } = await setRegistrationPassword(setPasswordToken, password, req.ip);
    res.json({
      message: "Password created successfully. Sign in to verify your phone and finish registration.",
      voterId,
    });
  } catch (err) {
    next(err);
  }
}

export async function registerVerifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await verifyRegistrationOtp(req.body.email, req.body.otp));
  } catch (err) {
    next(err);
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password, req.ip, req.headers["user-agent"]);
    if ("rawToken" in result) {
      setRefreshCookie(res, result.rawToken);
      const { rawToken: _rawToken, ...safeResult } = result;
      return res.json(safeResult);
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function login2faHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { challengeToken, code } = req.body;
    const result = await login2fa(challengeToken, code, req.ip, req.headers["user-agent"]);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/login-pin
 * Body: { loginToken, pin }
 *
 * Alternative to biometric login for users who have a login PIN set.
 * loginToken is the same short-lived JWT issued when biometricLoginRequired.
 *
 * FIX: now sets the httpOnly refreshToken cookie so token refresh works.
 * Previously the rawToken from createSession was discarded by loginWithPin,
 * making silent token refresh impossible and causing "Missing authorization
 * token" errors once the 15-minute access token expired.
 */
export async function loginPinHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { loginToken, pin } = req.body;
    const result = await loginWithPin(loginToken, pin, req.ip, req.headers["user-agent"]);
    // Set the httpOnly refresh cookie so subsequent /auth/refresh calls work
    setRefreshCookie(res, result.rawToken);
    // Only expose accessToken + user to the client — never expose rawToken
    res.json({ accessToken: result.accessToken, user: result.user });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/pins/setup  (requires Bearer session token)
 * Body: { loginPin, votingPin }
 *
 * Called once after biometric registration to store the user's two PINs.
 */
export async function setupPinsHandler(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { loginPin, votingPin } = req.body;
    await setupPins(req.user!.userId, loginPin, votingPin, req.ip);
    res.json({ message: "PINs set up successfully." });
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await getCurrentUser(req.user!.userId));
  } catch (err) {
    next(err);
  }
}

// ── Session management ────────────────────────────────────────────────────────

/**
 * POST /auth/refresh
 *
 * FIX: corrected rotateSession call signature (was passing positional args
 * instead of an options object), fixed destructuring (rotateSession returns
 * { rawToken, sessionId, userId } — not { accessToken, rawRefreshToken }),
 * and added a DB lookup to obtain the user's role for signing a new access
 * token. Without these fixes the refresh endpoint always returned
 * { accessToken: undefined }, causing every subsequent API call to fail with
 * "Missing authorization token".
 */
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) throw new UnauthorizedError("No refresh token");

    const session = await rotateSession(rawToken, {
      userAgent: req.headers["user-agent"] as string | undefined,
      ipAddress: req.ip,
    });
    if (!session) throw new UnauthorizedError("Invalid or expired refresh token");

    const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
    if (!user) throw new UnauthorizedError("User not found");

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    setRefreshCookie(res, session.rawToken);
    res.json({ accessToken });
  } catch (err) {
    clearRefreshCookie(res);
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (rawToken) await revokeSessionByToken(rawToken).catch(() => {});
    clearRefreshCookie(res);
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

export async function logoutAll(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    await revokeAllUserSessions(req.user!.userId);
    clearRefreshCookie(res);
    res.json({ message: "All sessions revoked" });
  } catch (err) {
    next(err);
  }
}

export async function listSessions(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const sessions = await getUserActiveSessions(req.user!.userId);
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

export async function revokeSession(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    await revokeSessionById(req.user!.userId, req.params.id);
    res.json({ message: "Session revoked" });
  } catch (err) {
    next(err);
  }
}

// ── 2FA (TOTP) ────────────────────────────────────────────────────────────────

export async function setup2fa(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.userId) });
    if (!user) throw new NotFoundError("User not found");
    if (user.isTwoFactorEnabled) throw new BadRequestError("2FA is already enabled");

    const secret = generateTotpSecret();
    const qrCodeDataUrl = await generateTotpQrCode(secret, user.email);
    const encrypted = encryptSecret(secret);
    await db.update(users).set({ twoFactorSecretEncrypted: encrypted }).where(eq(users.id, user.id));

    res.json({ qrCodeDataUrl, secret });
  } catch (err) {
    next(err);
  }
}

export async function enable2fa(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.userId) });
    if (!user || !user.twoFactorSecretEncrypted) throw new BadRequestError("2FA setup not initiated");

    const secret = decryptSecret(user.twoFactorSecretEncrypted);
    const valid = await verifyTotpCode(secret, code.trim());
    if (!valid) throw new UnauthorizedError("Invalid TOTP code");

    // FIX: generateRecoveryCodes() returns { plain, hashes } — destructure correctly.
    // The hashes are SHA-256 digests (computed inside generateRecoveryCodes); store
    // those in the DB.  Return the plaintext codes to the user once.
    const { plain: recoveryCodes, hashes: codesHash } = generateRecoveryCodes();

    await db
      .update(users)
      .set({ isTwoFactorEnabled: true, twoFactorRecoveryCodesHash: JSON.stringify(codesHash) as any })
      .where(eq(users.id, user.id));

    recordAudit(user.id, "2FA_ENABLED").catch(() => {});
    res.json({ recoveryCodes });
  } catch (err) {
    next(err);
  }
}

export async function disable2fa(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.userId) });
    if (!user || !user.twoFactorSecretEncrypted || !user.isTwoFactorEnabled) {
      throw new BadRequestError("2FA is not enabled");
    }

    const secret = decryptSecret(user.twoFactorSecretEncrypted);
    const valid = await verifyTotpCode(secret, code.trim());
    if (!valid) throw new UnauthorizedError("Invalid TOTP code");

    await db
      .update(users)
      .set({ isTwoFactorEnabled: false, twoFactorSecretEncrypted: null, twoFactorRecoveryCodesHash: null })
      .where(eq(users.id, user.id));

    recordAudit(user.id, "2FA_DISABLED").catch(() => {});
    res.json({ message: "2FA disabled" });
  } catch (err) {
    next(err);
  }
}

// ── Email verification ─────────────────────────────────────────────────────────

export async function verifyEmailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;
    const result = await verifyEmail(token);
    res.json({ message: "Email verified successfully", ...result });
  } catch (err) {
    next(err);
  }
}

export async function resendVerificationHandler(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    await resendVerification(req.user!.userId, req.ip);
    res.json({ message: "Verification email sent" });
  } catch (err) {
    next(err);
  }
}

export async function resendVerificationPublicHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await resendVerificationByEmail(req.body.email, req.body.method, req.ip);
    res.json({ message: "If that email is registered and unverified, a new verification message has been sent." });
  } catch (err) {
    next(err);
  }
}

// ── Password reset ─────────────────────────────────────────────────────────────

export async function forgotPasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await forgotPassword(req.body.email, req.ip);
    res.json({ message: "If an account with that email exists, a password reset link has been sent." });
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    await resetPassword(token, password, req.ip);
    res.json({ message: "Password reset successfully. Please log in again." });
  } catch (err) {
    next(err);
  }
}

// ── Admin step-up via Login PIN (authenticated session) ───────────────────────

/**
 * POST /auth/session-pin
 * Body: { pin }
 * Requires: Bearer session token (requireAuth)
 *
 * Verifies the caller's Login PIN without needing a loginToken.
 * Used by the admin action confirmation modal as a biometric alternative.
 */
export async function sessionPinHandler(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { pin } = req.body;
    await verifySessionLoginPin(req.user!.userId, pin);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
