import { pgTable, uuid, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * WebAuthn credentials registered by a user (platform authenticator —
 * fingerprint / Face ID). One user may have multiple credentials (e.g.
 * phone + laptop). Counter is updated on every successful assertion to
 * detect cloned authenticators.
 */
export const webauthnCredentials = pgTable("webauthn_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // base64url-encoded credential ID returned by the authenticator
  credentialId: text("credential_id").notNull().unique(),
  // COSE-encoded public key, stored as base64url
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  // "singleDevice" or "multiDevice" (backup-eligible passkeys)
  deviceType: text("device_type").notNull().default("singleDevice"),
  // e.g. ["internal", "hybrid"]
  transports: jsonb("transports").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
