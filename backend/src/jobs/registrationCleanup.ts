import cron from "node-cron";
import { db, users } from "@voting/database";
import { and, eq, lt } from "drizzle-orm";
import { recordAudit } from "../lib/audit";
import { logger } from "../lib/logger";

const REGISTRATION_TTL_MS = 24 * 60 * 60 * 1000;

export async function cleanupUnverifiedRegistrations() {
  try {
    const cutoff = new Date(Date.now() - REGISTRATION_TTL_MS);

    const deleted = await db.
    delete(users).
    where(and(eq(users.isVerified, false), lt(users.createdAt, cutoff))).
    returning({ id: users.id });

    if (deleted.length > 0) {
      logger.info("Deleted expired unverified registrations", { count: deleted.length });
      for (const row of deleted) {
        recordAudit(row.id, "REGISTER_EXPIRED_CLEANUP", { ttlHours: 24 }).catch(() => {});
      }
    }
  } catch (err) {
    logger.error("cleanupUnverifiedRegistrations failed", { error: String(err) });
  }
}

export function startRegistrationCleanupJob() {

  cron.schedule("0 * * * *", () => {
    cleanupUnverifiedRegistrations().catch((err) =>
    {return logger.error("Registration cleanup cron failed", { error: String(err) });}
    );
  });

  logger.info("Registration cleanup job scheduled (hourly, 24h TTL for unverified accounts)");
}