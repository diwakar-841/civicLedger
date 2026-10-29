import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { elections } from "./elections";
import { candidates } from "./candidates";
import { users } from "./users";

export const votesCache = pgTable(
  "votes_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    electionId: uuid("election_id")
      .notNull()
      .references(() => elections.id),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id),
    txHash: text("tx_hash").notNull().unique(),
    blockNumber: integer("block_number").notNull(),

    voterUserId: uuid("voter_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    votedAt: timestamp("voted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_votes_cache_voter_election").on(
      table.voterUserId,
      table.electionId,
    ),
    // Database-level guarantee of one vote per voter per election (the
    // application-level SELECT-then-INSERT check alone is racy).
    uniqueIndex("uniq_votes_cache_election_voter")
      .on(table.electionId, table.voterUserId)
      .where(sql`${table.voterUserId} IS NOT NULL`),
  ],
);
