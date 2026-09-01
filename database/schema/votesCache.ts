import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
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
  ],
);
