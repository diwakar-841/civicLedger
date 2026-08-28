/**
 * WebAuthn / biometric service
 *
 * Biometric registration — SINGLE STEP:
 *   1. getRegistrationOptions(setupToken)  → PublicKeyCredentialCreationOptions
 *   2. completeRegistration(setupToken, credential)  → { accessToken, user }
 *
 * The device's platform authenticator (iOS Face ID / Touch ID, Android
 * fingerprint / face) handles the actual biometric prompt. The backend does
 * not need to know WHICH biometric the OS used — it simply verifies the
 * signed challenge. Both fingerprint and face ID work transparently because
 * they share the same platform authenticator binding.
 *
 * Previous two-step design (finalize=false / finalize=true) registered two
 * separate WebAuthn credentials. After the first credential was added to
 * excludeCredentials, most phones couldn't produce a DIFFERENT platform
 * credential, so the second registration consistently failed. The simplified
 * single-step flow registers ONE credential and issues a session immediately.
 *
 * PIN alternatives: users can use either biometric OR a PIN for login and
 * vote auth. See loginWithPin (auth.service) and verifyVotePinAuth below.
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db, users, webauthnCredentials, candidateRequests } from "@voting/database";
import { eq } from "drizzle-orm";
import { env } from "../config/env";
import { BadRequestError, UnauthorizedError } from "../lib/errors";
import { createSession } from "./session.service";
import { recordAudit } from "../lib/audit";
import { and } from "drizzle-orm";
import { candidateRequestService } from "./candidateRequest.service";

// ─── Helpers ──────────────────────────────────────────────────────────�[...]

function mapUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    walletAddress: user.walletAddress,
    isVerified: user.isVerified,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
    isBiometricRegistered: user.isBiometricRegistered,
  };
}

/**
 * Parse the WEBAUTHN_ORIGIN env var — allows comma-separated list so the app
 * works on both localhost and a deployed origin without rebuilding.
 * e.g. WEBAUTHN_ORIGIN=http://localhost:5173,https://civic-ledger.example.com
 */
function getAllowedOrigins(): string[] {
  return env.WEBAUTHN_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);
}

// ─── Registration — Step 1: generate challenge ────────────────────────────────

export async function getRegistrationOptions(setupToken: string) {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(setupToken, env.JWT_SECRET) as typeof payload;
  } catch {
    throw new UnauthorizedError("Setup session expired — please sign in again");
  }
  if (payload.purpose !== "biometric-setup") throw new UnauthorizedError("Invalid token");

  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
  if (!user) throw new UnauthorizedError("User not found");

  // Exclude credentials already registered so the authenticator creates a
  // fresh key pair if this endpoint is called again (e.g. re-registration).
  const existing = await db.query.webauthnCredentials.findMany({
    where: eq(webauthnCredentials.userId, user.id),
  });

  const options = await generateRegistrationOptions({
    rpName: env.WEBAUTHN_RP_NAME,
    rpID: env.WEBAUTHN_RP_ID,
    userName: user.email,
    userDisplayName: user.fullName,
    userID: Buffer.from(user.id),
    attestationType: "none",
    authenticatorSelection: {
      // "platform" binds to the device's built-in authenticator (Touch ID,
      // Face ID, Android fingerprint, Windows Hello, etc.).  The OS decides
      // which biometric to use; the app doesn't need to distinguish.
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred",
    },
    excludeCredentials: existing.map((c) => ({
      id: c.credentialId,
      transports: (c.transports ?? []) as AuthenticatorTransportFuture[],
    })),
  });

  // Persist challenge so we can verify the response in completeRegistration
  await db.update(users).set({ webauthnChallenge: options.challenge }).where(eq(users.id, user.id));

  return options;
}

// ─── Registration — Step 2: verify & complete (SINGLE STEP) ──────────────────
//
// FIX: replaced the old two-step finalize=false / finalize=true flow.
//
// Old flow required two separate credential registrations (fingerprint first,
// then face ID). After the first credential was added to excludeCredentials,
// the device had no other platform credential to offer, so the second
// registration call always failed — the user saw a continuous error loop.
//
// New flow: ONE credential, registered once. The OS biometric (fingerprint OR
// face ID, whichever the device uses) is tied to this credential. The backend
// verifies the signed challenge and immediately issues an access token.

export async function completeRegistration(
  setupToken: string,
  credential: RegistrationResponseJSON
): Promise<{ rawToken: string; accessToken: string; user: ReturnType<typeof mapUser> }> {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(setupToken, env.JWT_SECRET) as typeof payload;
  } catch {
    throw new UnauthorizedError("Setup session expired — please sign in again");
  }
  if (payload.purpose !== "biometric-setup") throw new UnauthorizedError("Invalid token");

  const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
  if (!user || !user.webauthnChallenge) throw new UnauthorizedError("No pending registration challenge — please restart");

  const verification = await verifyRegistrationResponse({
    response: credential,
    expectedChallenge: user.webauthnChallenge,
    // FIX: accept any of the configured origins (supports comma-separated list)
    expectedOrigin: getAllowedOrigins(),
    expectedRPID: env.WEBAUTHN_RP_ID,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new BadRequestError("Biometric registration failed — please try again");
  }

  const { credential: cred, credentialDeviceType } = verification.registrationInfo;

  // Delete any stale credentials for this user before inserting the new one
  // so re-registration doesn't accumulate orphan rows.
  await db.delete(webauthnCredentials).where(eq(webauthnCredentials.userId, user.id));

  // Store the new credential
  await db.insert(webauthnCredentials).values({
    userId: user.id,
    credentialId: cred.id,
    publicKey: Buffer.from(cred.publicKey).toString("base64url"),
    counter: cred.counter,
    deviceType: credentialDeviceType,
    transports: (credential.response.transports ?? []) as string[],
  });

  // Mark user as fully set up and clear the challenge
  await db
    .update(users)
    .set({ isBiometricRegistered: true, webauthnChallenge: null })
    .where(eq(users.id, user.id));

  // FIX: capture rawToken so the controller can set the httpOnly refresh cookie
  const { rawToken } = await createSession({ userId: user.id, userAgent: "biometric-setup" });

  const accessToken = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "15m" });

  recordAudit(user.id, "BIOMETRIC_REGISTERED").catch(() => {});

  const fresh = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  return { rawToken, accessToken, user: mapUser(fresh!) };
}

// ─── Vote authentication — biometric ─────────────────────────────────────────

export async function getAuthenticationOptions(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new UnauthorizedError("User not found");
  if (!user.isBiometricRegistered) throw new BadRequestError("Biometric not set up");

  const userCreds = await db.query.webauthnCredentials.findMany({
    where: eq(webauthnCredentials.userId, userId),
  });
  if (userCreds.length === 0) throw new BadRequestError("No credentials found — please re-register biometrics");

  const options = await generateAuthenticationOptions({
    rpID: env.WEBAUTHN_RP_ID,
    userVerification: "required",
    allowCredentials: userCreds.map((c) => ({
      id: c.credentialId,
      transports: (c.transports ?? []) as AuthenticatorTransportFuture[],
    })),
  });

  await db.update(users).set({ webauthnChallenge: options.challenge }).where(eq(users.id, userId));
  return options;
}

export async function verifyVoteAuth(
  userId: string,
  credential: AuthenticationResponseJSON
): Promise<{ voteToken: string }> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || !user.webauthnChallenge) throw new UnauthorizedError("Not authenticated");

  const userCreds = await db.query.webauthnCredentials.findMany({
    where: eq(webauthnCredentials.userId, userId),
  });
  const stored = userCreds.find((c) => c.credentialId === credential.id);
  if (!stored) throw new UnauthorizedError("Unrecognized credential");

  const verification = await verifyAuthenticationResponse({
    response: credential,
    expectedChallenge: user.webauthnChallenge,
    // FIX: accept any of the configured origins
    expectedOrigin: getAllowedOrigins(),
    expectedRPID: env.WEBAUTHN_RP_ID,
    credential: {
      id: stored.credentialId,
      publicKey: Buffer.from(stored.publicKey, "base64url"),
      counter: stored.counter,
      transports: (stored.transports ?? []) as AuthenticatorTransportFuture[],
    },
    requireUserVerification: true,
  });

  if (!verification.verified) throw new UnauthorizedError("Biometric verification failed");

  await db
    .update(webauthnCredentials)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq(webauthnCredentials.id, stored.id));
  await db.update(users).set({ webauthnChallenge: null }).where(eq(users.id, userId));

  // Short-lived vote token (2 minutes)
  const voteToken = jwt.sign(
    { userId, purpose: "vote" },
    env.JWT_SECRET,
    { expiresIn: "2m" }
  );

  return { voteToken };
}

// ─── Vote authentication — PIN alternative ────────────────────────────────────

/**
 * Issues a voteToken using the user's 6-digit voting PIN as an alternative
 * to biometric verification.  Requires an active Bearer session.
 */
export async function verifyVotePinAuth(
  userId: string,
  pin: string
): Promise<{ voteToken: string }> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new UnauthorizedError("User not found");

  // Support both the new votingPinHash column and the legacy pinHash column
  const hash = user.votingPinHash ?? user.pinHash;
  if (!hash) {
    throw new BadRequestError("Voting PIN not set — please set up your PIN first");
  }

  const pinOk = await bcrypt.compare(pin.trim(), hash);
  if (!pinOk) throw new UnauthorizedError("Incorrect voting PIN — please try again");

  const voteToken = jwt.sign(
    { userId, purpose: "vote" },
    env.JWT_SECRET,
    { expiresIn: "2m" }
  );

  recordAudit(userId, "VOTE_PIN_VERIFIED").catch(() => {});

  return { voteToken };
}

// ─── Challenge for login biometric ───────────────────────────────────────────

export async function getLoginAuthenticationOptions(loginToken: string) {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(loginToken, env.JWT_SECRET) as typeof payload;
  } catch {
    throw new UnauthorizedError("Login session expired");
  }
  if (payload.purpose !== "login-bio") throw new UnauthorizedError("Invalid token");

  return getAuthenticationOptions(payload.userId);
}

export async function verifyLoginBiometric(
  loginToken: string,
  credential: AuthenticationResponseJSON,
  userAgent?: string,
  ipAddress?: string
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
  if (!user.webauthnChallenge) throw new UnauthorizedError("No authentication challenge found — restart login");

  // Find the matching stored credential
  const userCreds = await db.query.webauthnCredentials.findMany({
    where: eq(webauthnCredentials.userId, user.id),
  });
  if (userCreds.length === 0) throw new UnauthorizedError("No biometric credentials registered — please contact support");

  const stored = userCreds.find((c) => c.credentialId === credential.id);
  if (!stored) throw new UnauthorizedError("Unrecognized biometric credential — please sign in with your password");

  const verification = await verifyAuthenticationResponse({
    response: credential,
    expectedChallenge: user.webauthnChallenge,
    // FIX: accept any of the configured origins
    expectedOrigin: getAllowedOrigins(),
    expectedRPID: env.WEBAUTHN_RP_ID,
    credential: {
      id: stored.credentialId,
      publicKey: Buffer.from(stored.publicKey, "base64url"),
      counter: stored.counter,
      transports: (stored.transports ?? []) as AuthenticatorTransportFuture[],
    },
    requireUserVerification: true,
  });

  if (!verification.verified) throw new UnauthorizedError("Biometric verification failed");

  // Update counter + clear challenge
  await db
    .update(webauthnCredentials)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq(webauthnCredentials.id, stored.id));
  await db.update(users).set({ webauthnChallenge: null }).where(eq(users.id, user.id));

  // FIX: capture rawToken so the controller can set the httpOnly refresh cookie
  const { rawToken } = await createSession({ userId: user.id, userAgent, ipAddress });

  const accessToken = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "15m" });

  // Fire-and-forget audit
  recordAudit(user.id, "BIOMETRIC_LOGIN", undefined, undefined, ipAddress).catch(() => {});

  const fresh = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  return { rawToken, accessToken, user: mapUser(fresh!) };
}

export async function getCandidateRequestAuthenticationOptions(
  userId: string,
  requestId: string
) {
  const [request] = await db
    .select()
    .from(candidateRequests)
    .where(and(eq(candidateRequests.id, requestId), eq(candidateRequests.userId, userId)));
  if (!request) throw new UnauthorizedError("Nomination request not found");
  if (request.status !== "pending") throw new BadRequestError("This nomination is no longer pending");
  if (request.expiresAt < new Date()) {
    await candidateRequestService.expireRequest(requestId);
    throw new BadRequestError("This nomination has expired");
  }
  return getAuthenticationOptions(userId);
}

export async function verifyCandidateRequestAuthentication(
  userId: string,
  requestId: string,
  credential: AuthenticationResponseJSON
) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || !user.webauthnChallenge) throw new UnauthorizedError("Authentication challenge expired");

  const userCreds = await db.query.webauthnCredentials.findMany({
    where: eq(webauthnCredentials.userId, userId),
  });
  const stored = userCreds.find((c) => c.credentialId === credential.id);
  if (!stored) throw new UnauthorizedError("Unrecognized biometric credential");

  const verification = await verifyAuthenticationResponse({
    response: credential,
    expectedChallenge: user.webauthnChallenge,
    expectedOrigin: getAllowedOrigins(),
    expectedRPID: env.WEBAUTHN_RP_ID,
    credential: {
      id: stored.credentialId,
      publicKey: Buffer.from(stored.publicKey, "base64url"),
      counter: stored.counter,
      transports: (stored.transports ?? []) as AuthenticatorTransportFuture[],
    },
    requireUserVerification: true,
  });
  if (!verification.verified) throw new UnauthorizedError("Biometric verification failed");

  await db
    .update(webauthnCredentials)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq(webauthnCredentials.id, stored.id));
  await db.update(users).set({ webauthnChallenge: null }).where(eq(users.id, userId));

  const [request] = await db
    .select()
    .from(candidateRequests)
    .where(and(eq(candidateRequests.id, requestId), eq(candidateRequests.userId, userId)));
  if (!request || request.status !== "pending" || request.expiresAt < new Date()) {
    throw new BadRequestError("This nomination is no longer available");
  }

  return jwt.sign(
    { userId, requestId, purpose: "candidate-accept" },
    env.JWT_SECRET,
    { expiresIn: "5m" }
  );
}
