import { listenForVoteEvents } from "./blockchain.service";
import { db, votesCache } from "@voting/database";
import { logger } from "../lib/logger";

export function startIndexer() {
  listenForVoteEvents(async (voter, candidateId, txHash) => {
    try {
      const existing = await db.query.votesCache.findFirst({ where: (v, { eq }) => {return eq(v.txHash, txHash);} });
      if (existing) {return;}

      logger.info("Indexed on-chain vote event", { voter, candidateId, txHash });

    } catch (err) {
      logger.error("Failed to index vote event", { error: String(err) });
    }
  });
}