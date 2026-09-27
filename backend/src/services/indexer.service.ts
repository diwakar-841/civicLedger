import { listenForVoteEvents } from "./blockchain.service";
import { db, votesCache, candidates, users } from "@voting/database";
import { eq } from "drizzle-orm";
import { recordAudit } from "../lib/audit";
import { logger } from "../lib/logger";

/**
 * Safety net for a specific, real failure window: `castVoteAsUser()` in
 * vote.service.ts confirms the vote on-chain FIRST, then writes the
 * `votes_cache` row afterwards. If the process crashes, the DB connection
 * drops, or anything else goes wrong in that gap, the vote becomes
 * permanently recorded on-chain (the voter can never vote again — the
 * contract's `hasVoted` is now true) but never makes it into `votes_cache`,
 * which is what getElectionSummary() actually tallies results from. Without
 * this listener backfilling that row, such a vote would silently vanish
 * from the results forever despite being irreversibly cast.
 *
 * This listens for every on-chain VoteCast event and inserts the matching
 * votes_cache row if (and only if) it's missing — a pure reconciliation
 * step, never a substitute for the normal insert path.
 */
export function startIndexer() {
  listenForVoteEvents(async (voter, onChainCandidateId, txHash, blockNumber) => {
    try {
      const existing = await db.query.votesCache.findFirst({
        where: (v, { eq }) => eq(v.txHash, txHash),
      });
      if (existing) return;

      const candidate = await db.query.candidates.findFirst({
        where: eq(candidates.onChainCandidateId, onChainCandidateId),
      });
      if (!candidate) {
        logger.error(
          "Indexer: on-chain vote references a candidate we don't recognize — cannot backfill votes_cache",
          { voter, onChainCandidateId, txHash },
        );
        return;
      }

      const user = await db.query.users.findFirst({
        where: eq(users.walletAddress, voter.toLowerCase()),
      });

      await db.insert(votesCache).values({
        electionId: candidate.electionId,
        candidateId: candidate.id,
        txHash,
        blockNumber,
        voterUserId: user?.id ?? null,
      });

      await recordAudit(
        user?.id ?? "system",
        "VOTE_BACKFILLED_BY_INDEXER",
        {
          electionId: candidate.electionId,
          candidateId: candidate.id,
          reason:
            "On-chain vote event had no matching votes_cache row (likely a crash between the on-chain confirmation and the DB write)",
        },
        txHash,
      );

      logger.warn(
        "Indexer backfilled a votes_cache row missed by the normal vote-cast path",
        { voter, candidateId: candidate.id, txHash },
      );
    } catch (err) {
      logger.error("Failed to index vote event", { error: String(err) });
    }
  });
}
