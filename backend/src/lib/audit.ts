import crypto from "crypto";
import { db, auditLog } from "@voting/database";
import { desc, eq, sql } from "drizzle-orm";
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
    // Reading the previous row's hash and inserting the next one has to be
    // serialized, or two concurrent audit writes (very normal — e.g. two
    // voters logging in at the same moment) can both read the same
    // "previous" hash and each build a link the other doesn't know about,
    // silently breaking the tamper-evidence chain that verifyAuditLog()
    // checks. A Postgres advisory lock, held only for this transaction,
    // makes the read-then-write atomic across concurrent requests without
    // needing a dedicated lock table.
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext('civic_ledger_audit_log_chain'))`,
      );

      const lastRow = await tx.query.auditLog.findFirst({
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

      await tx.insert(auditLog).values({
        actor,
        action,
        metadata: metadata ?? null,
        txHash: txHash ?? null,
        ipAddress: ipAddress ?? null,
        prevHash,
        hash,
        createdAt,
      });
    });
  } catch (err) {
    logger.error("Failed to write audit log entry", {
      action,
      error: String(err),
    });
  }
}

export { computeHash };
