import "dotenv/config";
import { app } from "./app";
import { scheduleBlockchainSync } from "./jobs/syncBlockchainEvents";
import {
  startElectionScheduler,
  reconcileOnChainElectionState,
} from "./jobs/electionScheduler";
import {
  startRegistrationCleanupJob,
  cleanupUnverifiedRegistrations,
} from "./jobs/registrationCleanup";
import { fundDeployerIfNeeded } from "./services/blockchain.service";
import { runVoteMigrations } from "./services/vote.service";
import {
  runCandidateMigrations,
  runElectionMigrations,
} from "./services/election.service";
import { logger } from "./lib/logger";
import { env } from "./config/env";
import { runGroupMigrations } from "./routes/groups.routes";

const server = app.listen(env.PORT, () => {
  logger.info(`API server running on port ${env.PORT}`);

  // Run the schema migrations one after another. They ALTER the same tables
  // (elections, candidates, ...) and the group migration creates the `groups`
  // table that `elections.group_id` references, so firing them in parallel
  // can deadlock or fail with "tuple concurrently updated".
  (async () => {
    const steps: Array<[string, () => Promise<void>]> = [
      ["runVoteMigrations", runVoteMigrations],
      ["runCandidateMigrations", runCandidateMigrations],
      ["runElectionMigrations", runElectionMigrations],
      ["runGroupMigrations", runGroupMigrations],
    ];
    for (const [name, step] of steps) {
      try {
        await step();
      } catch (err) {
        logger.error(`${name} failed`, { error: String(err) });
      }
    }
  })();

  if (env.SKIP_INDEXER) {
    logger.info(
      "SKIP_INDEXER=true — skipping blockchain indexer, reconciliation, and auto-funding",
    );
  } else {
    fundDeployerIfNeeded().catch((err) =>
      logger.error("fundDeployerIfNeeded failed unexpectedly", {
        error: String(err),
      }),
    );

    scheduleBlockchainSync();

    reconcileOnChainElectionState().catch((err) =>
      logger.error("reconcileOnChainElectionState failed unexpectedly", {
        error: String(err),
      }),
    );
  }

  startElectionScheduler();

  cleanupUnverifiedRegistrations().catch((err) =>
    logger.error("cleanupUnverifiedRegistrations failed unexpectedly", {
      error: String(err),
    }),
  );
  startRegistrationCleanupJob();
});

server.headersTimeout = 65_000;
server.requestTimeout = 60_000;

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});

process.on("uncaughtException", (error) => {
  // The process is in an undefined state after an uncaught exception, so
  // continuing to serve requests (as this handler previously did) risks
  // corrupt state. Log it, then exit and let the supervisor restart us.
  logger.error("Uncaught exception - shutting down", {
    message: error.message,
    stack: error.stack,
  });
  setTimeout(() => process.exit(1), 500).unref();
  server.close(() => process.exit(1));
});

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);
  // Force-exit if open connections never drain.
  setTimeout(() => process.exit(0), 10_000).unref();
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
