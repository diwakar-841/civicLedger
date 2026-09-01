import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { elections } from "./elections";
import { users } from "./users";

export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "accepted",
  "rejected",
  "expired",
]);

export const candidateRequests = pgTable("candidate_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  electionId: uuid("election_id")
    .notNull()
    .references(() => elections.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: requestStatusEnum("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  profileCompletedAt: timestamp("profile_completed_at", { withTimezone: true }),

  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
