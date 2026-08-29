import "dotenv/config";
import { app } from "./app";
import { scheduleBlockchainSync } from "./jobs/syncBlockchainEvents";
import { startElectionScheduler, reconcileOnChainElectionState } from "./jobs/electionScheduler";
import { startRegistrationCleanupJob, cleanupUnverifiedRegistrations } from "./jobs/registrationCleanup";
import { fundDeployerIfNeeded } from "./services/blockchain.service";
import { runVoteMigrations } from "./services/vote.service";
import { runCandidateMigrations, runElectionMigrations } from "./services/election.service";
import { logger } from "./lib/logger";
import { env } from "./config/env";
import { runGroupMigrations } from "./routes/groups.routes";

const server = app.listen(env.PORT, () => {
  logger.info(`API server running on port ${env.PORT}`);

  // Ensure the voter_user_id column exists in votes_cache.
  // Safe to run on every start — uses ADD COLUMN IF NOT EXISTS internally.
  runVoteMigrations().catch((err) =>
    logger.error("runVoteMigrations failed", { error: String(err) })
  );

  // Ensure rich candidate profile columns exist (photo_url, bio, qualification,
  // supports, voter_user_id). Safe to run on every start.
  runCandidateMigrations().catch((err) =>
    logger.error("runCandidateMigrations failed", { error: String(err) })
  );

  // Ensure start_time/end_time are nullable — elections are now created
  // before a voting window is chosen. Safe to run on every start.
  runElectionMigrations().catch((err) =>
    logger.error("runElectionMigrations failed", { error: String(err) })
  );
  runGroupMigrations().catch((err) => logger.error("runGroupMigrations failed", { error: String(err) }));

  // Blockchain-related startup tasks (indexer, reconciliation, dev auto-funding).
  // Allow disabling these when no RPC/node is available (e.g. in hosted envs).
  if (env.SKIP_INDEXER) {
    logger.info("SKIP_INDEXER=true — skipping blockchain indexer, reconciliation, and auto-funding");
  } else {
    // In development, auto-fund the deployer wallet and warn if the contract
    // address is still the zero address.
    fundDeployerIfNeeded().catch((err) =>
      logger.error("fundDeployerIfNeeded failed unexpectedly", { error: String(err) })
    );

    scheduleBlockchainSync();

    // Fix up the contract's global electionOpen switch to match whatever the
    // DB currently says — self-heals any election left active on-chain (or
    // stuck closed) from before this reconciliation existed.
    reconcileOnChainElectionState().catch((err) =>
      logger.error("reconcileOnChainElectionState failed unexpectedly", { error: String(err) })
    );
  }

  startElectionScheduler();

  // Clear out any registrations left incomplete past their 24h window, then
  // keep sweeping hourly so their name, Gmail, and DOB are removed.
  cleanupUnverifiedRegistrations().catch((err) =>
    logger.error("cleanupUnverifiedRegistrations failed unexpectedly", { error: String(err) })
  );
  startRegistrationCleanupJob();
});

server.headersTimeout = 65_000;
server.requestTimeout  = 60_000;

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { message: error.message, stack: error.stack });
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => process.exit(0));
});
