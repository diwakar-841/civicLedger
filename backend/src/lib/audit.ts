import crypto from "crypto";
import { db, auditLog } from "@voting/database";
import { desc, eq } from "drizzle-orm";
import { logger } from "./logger";

function computeHash(
  prevHash: string | null,
  actor: string,
  action: string,
  metadata: Record<string, unknown> | null | undefined,
  txHash: string | null | undefined,
  createdAt: Date,
): string {
  const payload =
    (prevHash ?? "") +
    actor +
    action +
    JSON.stringify(metadata ?? {}) +
    (txHash ?? "") +
    createdAt.toISOString();
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export async function recordAudit(
  actor: string,
  action: string,
  metadata?: Record<string, unknown>,
  txHash?: string,
  ipAddress?: string,
) {
  try {
    const lastRow = await db.query.auditLog.findFirst({
      orderBy: [desc(auditLog.createdAt)],
      columns: { hash: true },
    });
    const prevHash = lastRow?.hash ?? null;

    const createdAt = new Date();
    const hash = computeHash(
      prevHash,
      actor,
      action,
      metadata,
      txHash,
      createdAt,
    );

    await db.insert(auditLog).values({
      actor,
      action,
      metadata: metadata ?? null,
      txHash: txHash ?? null,
      ipAddress: ipAddress ?? null,
      prevHash,
      hash,
      createdAt,
    });
  } catch (err) {
    logger.error("Failed to write audit log entry", {
      action,
      error: String(err),
    });
  }
}

export { computeHash };
