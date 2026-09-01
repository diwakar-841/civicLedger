import { pgTable, uuid, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const webauthnCredentials = pgTable("webauthn_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").
  notNull().
  references(() => users.id, { onDelete: "cascade" }),

  credentialId: text("credential_id").notNull().unique(),

  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),

  deviceType: text("device_type").notNull().default("singleDevice"),

  transports: jsonb("transports").$type(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});