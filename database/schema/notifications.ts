import { pgTable, uuid, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'candidateNomination', 'nominationAccepted', 'nominationRejected', 'nominationExpired'
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: uuid("related_id"), // electionId or candidateRequestId
  isRead: boolean("is_read").notNull().default(false),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationSettings = pgTable("notification_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  candidateNominationEmails: boolean("candidate_nomination_emails").notNull().default(true),
  reminderEmails: boolean("reminder_emails").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
