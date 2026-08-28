import cron from "node-cron";
import { db, users } from "@voting/database";
import { and, eq, lt } from "drizzle-orm";
import { recordAudit } from "../lib/audit";
import { logger } from "../lib/logger";

const REGISTRATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * A user row is created at Step 1 of registration (before OTP verification,
 * before a password is ever set) and only becomes a real account once Step 3
 * finishes email, password, and phone verification and isVerified flips to
 * true. If someone starts registering but never comes back to finish — whether
 * they abandon the tab or stop after email verification — that row would
 * otherwise sit around forever, permanently holding their name, Gmail address,
 * and date of birth.
 *
 * This sweeps away any such row older than 24 hours so the Gmail address
 * becomes available again and the person can register fresh.
 */
export async function cleanupUnverifiedRegistrations(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - REGISTRATION_TTL_MS);

    const deleted = await db
      .delete(users)
      .where(and(eq(users.isVerified, false), lt(users.createdAt, cutoff)))
      .returning({ id: users.id });

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
  // Hourly is plenty — this is clearing out abandoned rows, not something
  // that needs to fire the instant the 24h window closes.
  cron.schedule("0 * * * *", () => {
    cleanupUnverifiedRegistrations().catch((err) =>
      logger.error("Registration cleanup cron failed", { error: String(err) })
    );
  });

  logger.info("Registration cleanup job scheduled (hourly, 24h TTL for unverified accounts)");
}
