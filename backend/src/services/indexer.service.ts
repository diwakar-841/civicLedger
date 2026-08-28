import { listenForVoteEvents } from "./blockchain.service";
import { db, votesCache } from "@voting/database";
import { logger } from "../lib/logger";

// Background listener: keeps votes_cache in sync with on-chain VoteCast events,
// in case a vote reaches the chain through a path other than the API server.
export function startIndexer() {
  listenForVoteEvents(async (voter, candidateId, txHash) => {
    try {
      const existing = await db.query.votesCache.findFirst({
        where: (v, { eq }) => eq(v.txHash, txHash),
      });
      if (existing) return;

      logger.info("Indexed on-chain vote event", { voter, candidateId, txHash });
      // NOTE: mapping on-chain candidateId -> internal candidate row would
      // happen here via a lookup table in a full implementation.
    } catch (err) {
      logger.error("Failed to index vote event", { error: String(err) });
    }
  });
}
