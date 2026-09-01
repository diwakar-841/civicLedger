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
import {
  db,
  users,
  webauthnCredentials,
  candidateRequests,
} from "@voting/database";
import { eq } from "drizzle-orm";
import { env } from "../config/env";
import { BadRequestError, UnauthorizedError } from "../lib/errors";
import { createSession } from "./session.service";
import { recordAudit } from "../lib/audit";
import { and } from "drizzle-orm";
import { candidateRequestService } from "./candidateRequest.service";

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

function getAllowedOrigins(): string[] {
  return env.WEBAUTHN_ORIGIN.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export async function getRegistrationOptions(setupToken: string) {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(setupToken, env.JWT_SECRET) as typeof payload;
  } catch {
    throw new UnauthorizedError("Setup session expired — please sign in again");
  }
  if (payload.purpose !== "biometric-setup")
    throw new UnauthorizedError("Invalid token");

  const user = await db.query.users.findFirst({
    where: eq((users as any).id, payload.userId),
  });
  if (!user) throw new UnauthorizedError("User not found");

  const existing = await db.query.webauthnCredentials.findMany({
    where: eq((webauthnCredentials as any).userId, user.id),
  });

  const options = await generateRegistrationOptions({
    rpName: env.WEBAUTHN_RP_NAME,
    rpID: env.WEBAUTHN_RP_ID,
    userName: user.email,
    userDisplayName: user.fullName,
    userID: Buffer.from(user.id),
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred",
    },
    excludeCredentials: existing.map((c) => ({
      id: c.credentialId,
      transports: (c.transports ?? []) as AuthenticatorTransportFuture[],
    })),
  });

  await db
    .update(users)
    .set({ webauthnChallenge: options.challenge as unknown as string })
    .where(eq((users as any).id, user.id));

  return options;
}

export async function completeRegistration(
  setupToken: string,
  credential: RegistrationResponseJSON,
): Promise<{
  rawToken: string;
  accessToken: string;
  user: ReturnType<typeof mapUser>;
}> {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(setupToken, env.JWT_SECRET) as typeof payload;
  } catch {
    throw new UnauthorizedError("Setup session expired — please sign in again");
  }
  if (payload.purpose !== "biometric-setup")
    throw new UnauthorizedError("Invalid token");

  const user = await db.query.users.findFirst({
    where: eq((users as any).id, payload.userId),
  });
  if (!user || !user.webauthnChallenge)
    throw new UnauthorizedError(
      "No pending registration challenge — please restart",
    );

  const verification = await verifyRegistrationResponse({
    response: credential,
    expectedChallenge: user.webauthnChallenge,

    expectedOrigin: getAllowedOrigins(),
    expectedRPID: env.WEBAUTHN_RP_ID,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new BadRequestError(
      "Biometric registration failed — please try again",
    );
  }

  const { credential: cred, credentialDeviceType } =
    verification.registrationInfo;

  await db
    .delete(webauthnCredentials)
    .where(eq((webauthnCredentials as any).userId, user.id));

  await db.insert(webauthnCredentials).values({
    userId: user.id,
    credentialId: cred.id,
    publicKey: Buffer.from(cred.publicKey).toString("base64url"),
    counter: cred.counter,
    deviceType: credentialDeviceType,
    transports: (credential.response.transports ?? []) as string[],
  });

  await db
    .update(users)
    .set({ isBiometricRegistered: true, webauthnChallenge: null })
    .where(eq((users as any).id, user.id));

  const { rawToken } = await createSession({
    userId: user.id,
    userAgent: "biometric-setup",
  });

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  recordAudit(user.id, "BIOMETRIC_REGISTERED").catch(() => {});

  const fresh = await db.query.users.findFirst({
    where: eq((users as any).id, user.id),
  });
  return { rawToken, accessToken, user: mapUser(fresh!) };
}

export async function getAuthenticationOptions(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq((users as any).id, userId),
  });
  if (!user) throw new UnauthorizedError("User not found");
  if (!user.isBiometricRegistered)
    throw new BadRequestError("Biometric not set up");

  const userCreds = await db.query.webauthnCredentials.findMany({
    where: eq((webauthnCredentials as any).userId, userId),
  });
  if (userCreds.length === 0)
    throw new BadRequestError(
      "No credentials found — please re-register biometrics",
    );

  const options = await generateAuthenticationOptions({
    rpID: env.WEBAUTHN_RP_ID,
    userVerification: "required",
    allowCredentials: userCreds.map((c) => ({
      id: c.credentialId as unknown as string,
      transports: (c.transports ?? []) as AuthenticatorTransportFuture[],
    })),
  });

  await db
    .update(users)
    .set({ webauthnChallenge: options.challenge as unknown as string })
    .where(eq((users as any).id, userId));
  return options;
}

export async function verifyVoteAuth(
  userId: string,
  credential: AuthenticationResponseJSON,
): Promise<{ voteToken: string }> {
  const user = await db.query.users.findFirst({
    where: eq((users as any).id, userId),
  });
  if (!user || !user.webauthnChallenge)
    throw new UnauthorizedError("Not authenticated");

  const userCreds = await db.query.webauthnCredentials.findMany({
    where: eq((webauthnCredentials as any).userId, userId),
  });
  const stored = userCreds.find((c) => c.credentialId === credential.id);
  if (!stored) throw new UnauthorizedError("Unrecognized credential");

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

  if (!verification.verified)
    throw new UnauthorizedError("Biometric verification failed");

  await db
    .update(webauthnCredentials)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq((webauthnCredentials as any).id, stored.id));
  await db
    .update(users)
    .set({ webauthnChallenge: null })
    .where(eq((users as any).id, userId));

  const voteToken = jwt.sign({ userId, purpose: "vote" }, env.JWT_SECRET, {
    expiresIn: "2m",
  });

  return { voteToken };
}

export async function verifyVotePinAuth(
  userId: string,
  pin: string,
): Promise<{ voteToken: string }> {
  const user = await db.query.users.findFirst({
    where: eq((users as any).id, userId),
  });
  if (!user) throw new UnauthorizedError("User not found");

  const hash = user.votingPinHash ?? user.pinHash;
  if (!hash) {
    throw new BadRequestError(
      "Voting PIN not set — please set up your PIN first",
    );
  }

  const pinOk = await bcrypt.compare(pin.trim(), hash);
  if (!pinOk)
    throw new UnauthorizedError("Incorrect voting PIN — please try again");

  const voteToken = jwt.sign({ userId, purpose: "vote" }, env.JWT_SECRET, {
    expiresIn: "2m",
  });

  recordAudit(userId, "VOTE_PIN_VERIFIED").catch(() => {});

  return { voteToken };
}

export async function getLoginAuthenticationOptions(loginToken: string) {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(loginToken, env.JWT_SECRET) as typeof payload;
  } catch {
    throw new UnauthorizedError("Login session expired");
  }
  if (payload.purpose !== "login-bio")
    throw new UnauthorizedError("Invalid token");

  return getAuthenticationOptions(payload.userId);
}

export async function verifyLoginBiometric(
  loginToken: string,
  credential: AuthenticationResponseJSON,
  userAgent?: string,
  ipAddress?: string,
): Promise<{
  rawToken: string;
  accessToken: string;
  user: ReturnType<typeof mapUser>;
}> {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(loginToken, env.JWT_SECRET) as typeof payload;
  } catch {
    throw new UnauthorizedError("Login session expired — please sign in again");
  }
  if (payload.purpose !== "login-bio")
    throw new UnauthorizedError("Invalid token purpose");

  const user = await db.query.users.findFirst({
    where: eq((users as any).id, payload.userId),
  });
  if (!user) throw new UnauthorizedError("User not found");
  if (!user.webauthnChallenge)
    throw new UnauthorizedError(
      "No authentication challenge found — restart login",
    );

  const userCreds = await db.query.webauthnCredentials.findMany({
    where: eq((webauthnCredentials as any).userId, user.id),
  });
  if (userCreds.length === 0)
    throw new UnauthorizedError(
      "No biometric credentials registered — please contact support",
    );

  const stored = userCreds.find((c) => c.credentialId === credential.id);
  if (!stored)
    throw new UnauthorizedError(
      "Unrecognized biometric credential — please sign in with your password",
    );

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

  if (!verification.verified)
    throw new UnauthorizedError("Biometric verification failed");

  await db
    .update(webauthnCredentials)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq((webauthnCredentials as any).id, stored.id));
  await db
    .update(users)
    .set({ webauthnChallenge: null })
    .where(eq((users as any).id, user.id));

  const { rawToken } = await createSession({
    userId: user.id,
    userAgent,
    ipAddress,
  });

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  recordAudit(
    user.id,
    "BIOMETRIC_LOGIN",
    undefined,
    undefined,
    ipAddress,
  ).catch(() => {});

  const fresh = await db.query.users.findFirst({
    where: eq((users as any).id, user.id),
  });
  return { rawToken, accessToken, user: mapUser(fresh!) };
}

export async function getCandidateRequestAuthenticationOptions(
  userId: string,
  requestId: string,
) {
  const [request] = await db
    .select()
    .from(candidateRequests)
    .where(
      and(
        eq((candidateRequests as any).id, requestId),
        eq((candidateRequests as any).userId, userId),
      ),
    );
  if (!request) throw new UnauthorizedError("Nomination request not found");
  if (request.status !== "pending")
    throw new BadRequestError("This nomination is no longer pending");
  if (request.expiresAt < new Date()) {
    await candidateRequestService.expireRequest(requestId);
    throw new BadRequestError("This nomination has expired");
  }
  return getAuthenticationOptions(userId);
}

export async function verifyCandidateRequestAuthentication(
  userId: string,
  requestId: string,
  credential: AuthenticationResponseJSON,
) {
  const user = await db.query.users.findFirst({
    where: eq((users as any).id, userId),
  });
  if (!user || !user.webauthnChallenge)
    throw new UnauthorizedError("Authentication challenge expired");

  const userCreds = await db.query.webauthnCredentials.findMany({
    where: eq((webauthnCredentials as any).userId, userId),
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
  if (!verification.verified)
    throw new UnauthorizedError("Biometric verification failed");

  await db
    .update(webauthnCredentials)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq((webauthnCredentials as any).id, stored.id));
  await db
    .update(users)
    .set({ webauthnChallenge: null })
    .where(eq((users as any).id, userId));

  const [request] = await db
    .select()
    .from(candidateRequests)
    .where(
      and(
        eq((candidateRequests as any).id, requestId),
        eq((candidateRequests as any).userId, userId),
      ),
    );
  if (
    !request ||
    request.status !== "pending" ||
    request.expiresAt < new Date()
  ) {
    throw new BadRequestError("This nomination is no longer available");
  }

  return jwt.sign(
    { userId, requestId, purpose: "candidate-accept" },
    env.JWT_SECRET,
    { expiresIn: "5m" },
  );
}
