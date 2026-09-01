import { startIndexer } from "../services/indexer.service";
import { logger } from "../lib/logger";

export function scheduleBlockchainSync() {
  logger.info("Starting blockchain event indexer");
  startIndexer();
}
