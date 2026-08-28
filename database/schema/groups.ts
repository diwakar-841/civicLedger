import { pgTable, uuid, text, timestamp, pgEnum, unique, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const groupRequestStatusEnum = pgEnum("group_request_status", ["pending", "accepted", "rejected"]);

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    photoUrl: text("photo_url"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Group names must be unique (case-insensitive), same convention as
    // election titles — see groups.routes.ts for the friendly pre-check;
    // this index is the DB-level backstop.
    uniqueIndex("groups_name_unique_idx").on(sql`LOWER(${table.name})`),
  ]
);

export const groupMembers = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique("group_members_group_user_unique").on(table.groupId, table.userId)]);

export const groupRequests = pgTable("group_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: groupRequestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
}, (table) => [unique("group_requests_group_user_unique").on(table.groupId, table.userId)]);