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

  runVoteMigrations().catch((err) =>
  {return logger.error("runVoteMigrations failed", { error: String(err) });}
  );

  runCandidateMigrations().catch((err) =>
  {return logger.error("runCandidateMigrations failed", { error: String(err) });}
  );

  runElectionMigrations().catch((err) =>
  {return logger.error("runElectionMigrations failed", { error: String(err) });}
  );
  runGroupMigrations().catch((err) => {return logger.error("runGroupMigrations failed", { error: String(err) });});

  if (env.SKIP_INDEXER) {
    logger.info("SKIP_INDEXER=true — skipping blockchain indexer, reconciliation, and auto-funding");
  } else {

    fundDeployerIfNeeded().catch((err) =>
    {return logger.error("fundDeployerIfNeeded failed unexpectedly", { error: String(err) });}
    );

    scheduleBlockchainSync();

    reconcileOnChainElectionState().catch((err) =>
    {return logger.error("reconcileOnChainElectionState failed unexpectedly", { error: String(err) });}
    );
  }

  startElectionScheduler();

  cleanupUnverifiedRegistrations().catch((err) =>
  {return logger.error("cleanupUnverifiedRegistrations failed unexpectedly", { error: String(err) });}
  );
  startRegistrationCleanupJob();
});

server.headersTimeout = 65_000;
server.requestTimeout = 60_000;

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { message: error.message, stack: error.stack });
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {return process.exit(0);});
});