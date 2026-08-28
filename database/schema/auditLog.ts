import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actor: text("actor").notNull(), // user id or "system"
  action: text("action").notNull(), // e.g. "REGISTER", "DUPLICATE_REGISTER_ATTEMPT", "VOTE_CAST"
  metadata: jsonb("metadata"),
  txHash: text("tx_hash"),
  ipAddress: text("ip_address"),
  // Tamper-evident hash chain: `hash` = SHA-256(prevHash + actor + action +
  // metadata + createdAt). Any edit or deletion of a historical row breaks
  // the chain for every entry after it, so an admin (or auditor) can verify
  // the log hasn't been altered after the fact instead of just trusting it.
  prevHash: text("prev_hash"),
  hash: text("hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
