import { pgTable, uuid, text, timestamp, pgEnum, boolean, uniqueIndex } from "drizzle-orm/pg-core";
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
    // Nullable: an election is created with just a title/description first.
    startTime: timestamp("start_time", { withTimezone: true }),
    endTime: timestamp("end_time", { withTimezone: true }),

    // --- Nomination flow ---
    // The deadline by which all nominated candidates must accept or reject.
    // After this passes the scheduler checks accepted count and either:
    //   - activates the election (when startTime has also passed and ≥2 accepted), or
    //   - notifies the admin that there aren't enough candidates.
    // Null = no nomination deadline set (nominations not used for this election).
    nominationDeadline: timestamp("nomination_deadline", { withTimezone: true }),

    // Set to true once the admin has been alerted that the nomination window
    // closed with fewer than 2 accepted candidates, so we don't spam.
    nominationAlertSent: boolean("nomination_alert_sent").notNull().default(false),

    // --- Admin decision periods (workflow spec §3 / §5) ---
    // Which decision period the election is in once an allowance period ends:
    //   "initial" → the FIRST 24-hour admin decision period (start / extend / cancel)
    //   "final"   → the FINAL 24-hour period after the one allowed extension
    //               (start / cancel only — no second extension)
    decisionPhase: text("decision_phase").notNull().default("initial"),

    // The single allowance extension a workflow permits. Once set, the
    // "Extend allowance" action is permanently unavailable for this election.
    allowanceExtendedAt: timestamp("allowance_extended_at", { withTimezone: true }),
    // Set when the admin has been told a decision period opened, so the
    // scheduler notifies exactly once per period.
    decisionPeriodNotifiedAt: timestamp("decision_period_notified_at", { withTimezone: true }),
    allowanceExtensionMinutes: text("allowance_extension_minutes"),

    // --- Cancellation ---
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),

    // --- Visibility ---
    isHidden: boolean("is_hidden").notNull().default(false),
    electionType: text("election_type").notNull().default("public"),
    groupId: uuid("group_id"),

    // Legacy columns retained for existing database compatibility. Results
    // are now always live and these fields are no longer writable or exposed.
    liveResultsEnabled: boolean("live_results_enabled").notNull().default(false),
    resultsReleaseAt: timestamp("results_release_at", { withTimezone: true }),
    resultsPublishedAt: timestamp("results_published_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Election titles must be unique (case-insensitive, e.g. "Board Vote"
    // and "board vote" collide) so admins and voters never end up with two
    // elections that look identical in a list. Enforced here for fresh
    // `db:push` setups, and mirrored as a runtime migration in
    // election.service.ts → runElectionMigrations for already-deployed DBs.
    uniqueIndex("elections_title_unique_idx").on(sql`LOWER(${table.title})`),
  ]
);
