import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const electionStatusEnum = pgEnum("election_status", [
  "draft",
  "active",
  "closed",
  "cancelled",
]);

export const elections = pgTable(
  "elections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    contractAddress: text("contract_address"),
    status: electionStatusEnum("status").notNull().default("draft"),

    startTime: timestamp("start_time", { withTimezone: true }),
    endTime: timestamp("end_time", { withTimezone: true }),

    nominationDeadline: timestamp("nomination_deadline", {
      withTimezone: true,
    }),

    nominationAlertSent: boolean("nomination_alert_sent")
      .notNull()
      .default(false),

    decisionPhase: text("decision_phase").notNull().default("initial"),

    allowanceExtendedAt: timestamp("allowance_extended_at", {
      withTimezone: true,
    }),

    decisionPeriodNotifiedAt: timestamp("decision_period_notified_at", {
      withTimezone: true,
    }),
    allowanceExtensionMinutes: text("allowance_extension_minutes"),

    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),

    isHidden: boolean("is_hidden").notNull().default(false),
    electionType: text("election_type").notNull().default("public"),
    groupId: uuid("group_id"),

    liveResultsEnabled: boolean("live_results_enabled")
      .notNull()
      .default(false),
    resultsReleaseAt: timestamp("results_release_at", { withTimezone: true }),
    resultsPublishedAt: timestamp("results_published_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("elections_title_unique_idx").on(sql`LOWER(${table.title})`),
  ],
);
