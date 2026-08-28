import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Audit / history trail for a group (member + election activity).
 *
 * IMPORTANT: this table is declared here so `drizzle-kit push` knows about it.
 * Without this declaration drizzle considers the table "unknown" and proposes
 * to DROP it (the data-loss warning you saw on every push).
 */
export const groupActivity = pgTable(
  "group_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id").notNull(),
    type: text("type").notNull(),
    actorId: uuid("actor_id"),
    actorName: text("actor_name"),
    targetUserId: uuid("target_user_id"),
    targetName: text("target_name"),
    targetEmail: text("target_email"),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    groupIdx: index("group_activity_group_idx").on(
      table.groupId,
      table.createdAt,
    ),
  }),
);

export type GroupActivity = typeof groupActivity.$inferSelect;
export type NewGroupActivity = typeof groupActivity.$inferInsert;
