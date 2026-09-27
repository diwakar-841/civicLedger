import crypto from "crypto";
import { db, sessions } from "@voting/database";
import { eq, and, lt, isNull } from "drizzle-orm";
import { logger } from "../lib/logger";

const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function generateRawToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

export async function createSession(params: {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
}): Promise<{ rawToken: string; sessionId: string }> {
  const rawToken = generateRawToken();
  const refreshTokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  const [session] = await db
    .insert(sessions)
    .values({
      userId: params.userId,
      refreshTokenHash,
      userAgent: params.userAgent ?? null,
      ipAddress: params.ipAddress ?? null,
      expiresAt,
    })
    .returning();

  logger.info("Session created", {
    sessionId: session.id,
    userId: params.userId,
  });
  return { rawToken, sessionId: session.id };
}

export async function rotateSession(
  oldRawToken: string,
  params: {
    userAgent?: string;
    ipAddress?: string;
  },
): Promise<{ rawToken: string; sessionId: string; userId: string } | null> {
  const oldHash = hashToken(oldRawToken);

  const oldSession = await db.query.sessions.findFirst({
    where: eq(sessions.refreshTokenHash, oldHash),
  });

  if (!oldSession) return null;

  if (oldSession.replacedByTokenHash !== null) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.userId, oldSession.userId));
    logger.warn("Refresh token reuse detected - all sessions revoked", {
      userId: oldSession.userId,
    });
    return null;
  }

  if (oldSession.revokedAt !== null) return null;
  if (oldSession.expiresAt < new Date()) return null;

  const newRawToken = generateRawToken();
  const newHash = hashToken(newRawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await db
    .update(sessions)
    .set({ replacedByTokenHash: newHash, revokedAt: new Date() })
    .where(eq(sessions.id, oldSession.id));

  const [newSession] = await db
    .insert(sessions)
    .values({
      userId: oldSession.userId,
      refreshTokenHash: newHash,
      userAgent: params.userAgent ?? oldSession.userAgent,
      ipAddress: params.ipAddress ?? oldSession.ipAddress,
      expiresAt,
    })
    .returning();

  return {
    rawToken: newRawToken,
    sessionId: newSession.id,
    userId: oldSession.userId,
  };
}

export async function revokeSessionByToken(rawToken: string): Promise<boolean> {
  const hash = hashToken(rawToken);
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.refreshTokenHash, hash),
  });
  if (!session || session.revokedAt !== null) return false;
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.id, session.id));
  return true;
}

export async function revokeSessionById(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });
  if (!session || session.userId !== userId) return false;
  if (session.revokedAt !== null) return false;
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.id, sessionId));
  return true;
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

export async function getUserActiveSessions(userId: string) {
  const now = new Date();
  const rows = await db.query.sessions.findMany({
    where: eq(sessions.userId, userId),
    columns: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      expiresAt: true,
      revokedAt: true,
    },
  });
  return rows.filter((s) => s.revokedAt === null && s.expiresAt > now);
}
