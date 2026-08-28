import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Refresh-token sessions. Access tokens (JWT) are now short-lived (15 min);
 * a refresh token (opaque random string, only its SHA-256 hash stored here)
 * is what actually keeps a user signed in. This lets the backend revoke a
 * single device ("sign out this session") or all devices ("sign out
 * everywhere") without needing a shared JWT blocklist, and bounds the
 * lifetime of a stolen access token to 15 minutes.
 */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  refreshTokenHash: text("refresh_token_hash").notNull().unique(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  // Set when a refresh token is exchanged for a new one (rotation). Keeping
  // the old row around (instead of deleting) lets us detect reuse of a
  // stolen/rotated-out token and revoke the whole session family.
  replacedByTokenHash: text("replaced_by_token_hash"),
});
