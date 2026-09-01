import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { elections } from "./elections";
import { users } from "./users";

export const candidates = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  electionId: uuid("election_id").notNull().references(() => elections.id),
  name: text("name").notNull(),
  party: text("party"),
  onChainCandidateId: integer("on_chain_candidate_id").notNull(),
  voterUserId: uuid("voter_user_id").references(() => users.id, { onDelete: "set null" }),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  qualification: text("qualification"),
  supports: text("supports"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});