import cron from "node-cron";
import { db } from "@voting/database";
import { elections, users, candidateRequests } from "@voting/database";
import {
  eq,
  and,
  lte,
  or,
  isNull,
  isNotNull,
  lt,
  ne,
  count,
} from "drizzle-orm";
import { recordAudit } from "../lib/audit";
import { logger } from "../lib/logger";
import { setElectionOpen } from "../services/blockchain.service";
import { notificationService } from "../services/notification.service";
import { ADMIN_DECISION_WINDOW_MS } from "../lib/electionTiming";

export async function reconcileOnChainElectionState(): Promise<void> {
  try {
    const activeElection = await db.query.elections.findFirst({
      where: eq(elections.status, "active"),
    });
    await setElectionOpen(Boolean(activeElection));
    logger.info("Reconciled on-chain voting-open switch with DB state", {
      open: Boolean(activeElection),
      electionId: activeElection?.id ?? null,
    });
  } catch (err) {
    logger.error("Could not reconcile on-chain election state at startup", {
      error: String(err),
    });
  }
}

async function countAcceptedNominations(electionId: string): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(candidateRequests)
    .where(
      and(
        eq(candidateRequests.electionId, electionId),
        eq(candidateRequests.status, "accepted"),
        isNotNull(candidateRequests.profileCompletedAt),
      ),
    );
  return Number(total);
}

async function countPendingNominations(electionId: string): Promise<number> {
  const now = new Date();
  const [{ total }] = await db
    .select({ total: count() })
    .from(candidateRequests)
    .where(
      and(
        eq(candidateRequests.electionId, electionId),
        eq(candidateRequests.status, "pending"),

        isNotNull(candidateRequests.expiresAt),
      ),
    );

  const pending = await db
    .select({ expiresAt: candidateRequests.expiresAt })
    .from(candidateRequests)
    .where(
      and(
        eq(candidateRequests.electionId, electionId),
        eq(candidateRequests.status, "pending"),
      ),
    );
  return pending.filter((r) => r.expiresAt && r.expiresAt > now).length;
}

async function notifyAllAdmins(
  type: string,
  title: string,
  message: string,
  electionId: string,
  metadata?: Record<string, any>,
): Promise<void> {
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"));

  for (const admin of admins) {
    await notificationService.createNotification(
      admin.id,
      type,
      title,
      message,
      electionId,
      metadata,
    );
  }
}

export function startElectionScheduler() {
  cron.schedule("*/10 * * * * *", async () => {
    try {
      const now = new Date();

      const toActivateCandidates = await db.query.elections.findMany({
        where: and(
          eq(elections.status, "draft"),
          isNotNull(elections.startTime),

          isNotNull(elections.endTime),
          lte(elections.startTime, now),
        ),
      });

      for (const election of toActivateCandidates) {
        if (election.endTime && election.endTime <= now) {
          await db
            .update(elections)
            .set({ status: "closed" })
            .where(eq(elections.id, election.id));
          await recordAudit("system", "ELECTION_STATUS_CHANGED", {
            electionId: election.id,
            from: "draft",
            to: "closed",
            reason: "voting_window_elapsed_before_activation",
          });
          logger.warn("Draft closed: voting window elapsed before activation", {
            electionId: election.id,
          });
          continue;
        }

        const accepted = await countAcceptedNominations(election.id);

        if (accepted < 2) {
          logger.info("Skipping activation: fewer than 2 accepted candidates", {
            electionId: election.id,
            accepted,
          });
          continue;
        }

        try {
          await setElectionOpen(true);
        } catch (err) {
          logger.error(
            "Failed to open voting on-chain — election NOT activated",
            {
              electionId: election.id,
              error: String(err),
            },
          );
          continue;
        }

        await db
          .update(elections)
          .set({ status: "active" })
          .where(eq(elections.id, election.id));

        await recordAudit("system", "ELECTION_STATUS_CHANGED", {
          electionId: election.id,
          from: "draft",
          to: "active",
          accepted,
        });
        logger.info("Election activated by scheduler", {
          electionId: election.id,
          accepted,
        });
      }

      const toClose = await db.query.elections.findMany({
        where: and(
          eq(elections.status, "active"),
          isNotNull(elections.endTime),
          lte(elections.endTime, now),
        ),
      });

      for (const election of toClose) {
        try {
          await setElectionOpen(false);
        } catch (err) {
          logger.error("Failed to close voting on-chain", {
            electionId: election.id,
            error: String(err),
          });
          continue;
        }

        await db
          .update(elections)
          .set({ status: "closed" })
          .where(eq(elections.id, election.id));

        await recordAudit("system", "ELECTION_STATUS_CHANGED", {
          electionId: election.id,
          from: "active",
          to: "closed",
        });
        logger.info("Election closed by scheduler", {
          electionId: election.id,
        });
      }

      const toPublish = await db.query.elections.findMany({
        where: and(
          isNull(elections.resultsPublishedAt),
          isNotNull(elections.resultsReleaseAt),
          lte(elections.resultsReleaseAt, now),
        ),
      });

      for (const election of toPublish) {
        const wasHidden = election.isHidden;
        await db
          .update(elections)
          .set({
            resultsPublishedAt: election.resultsReleaseAt as Date,
            isHidden: false,
          })
          .where(eq(elections.id, election.id));
        await recordAudit("system", "RESULTS_PUBLISHED", {
          electionId: election.id,
        });
        await notificationService.notifyElectionParticipants(
          election.id,
          election.title,
          `Results are now available for "${election.title}". View the final verified outcome.`,
        );
        if (wasHidden) {
          await recordAudit("system", "ELECTION_UNHIDDEN", {
            electionId: election.id,
            reason: "results_published",
          });
        }
        logger.info("Results auto-published by scheduler", {
          electionId: election.id,
        });
      }
    } catch (err) {
      logger.error("Election scheduler error", { error: String(err) });
    }
  });

  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const draftElections = await db.query.elections.findMany({
        where: and(
          eq(elections.status, "draft"),
          eq(elections.nominationAlertSent, false),
        ),
      });

      for (const election of draftElections) {
        if (!election.nominationDeadline) continue;

        const deadlinePassed = election.nominationDeadline <= now;
        const stillPending = await countPendingNominations(election.id);

        const [{ totalRequests }] = await db
          .select({ totalRequests: count() })
          .from(candidateRequests)
          .where(eq(candidateRequests.electionId, election.id));
        const hasSentRequests = Number(totalRequests) > 0;
        if (!hasSentRequests) continue;

        const allResolved = stillPending === 0;
        const nominationWindowClosed = deadlinePassed || allResolved;
        if (!nominationWindowClosed) continue;

        const accepted = await countAcceptedNominations(election.id);

        if (accepted >= 2) {
          await db
            .update(elections)
            .set({ nominationAlertSent: true })
            .where(eq(elections.id, election.id));
          continue;
        }

        const reason =
          allResolved && !deadlinePassed
            ? "All nominees have already responded and"
            : "The nomination deadline has passed and";

        logger.warn("Insufficient candidates after nomination window closed", {
          electionId: election.id,
          title: election.title,
          accepted,
          earlyClose: allResolved && !deadlinePassed,
        });

        await notifyAllAdmins(
          "insufficientCandidates",
          `Not enough candidates — ${election.title}`,
          `${reason} only ${accepted} of the required 2 candidates accepted for "${election.title}". ` +
            `Extend the deadline, invite more candidates, or close this election.`,
          election.id,
          { electionId: election.id, accepted, required: 2 },
        );

        await db
          .update(elections)
          .set({ nominationAlertSent: true })
          .where(eq(elections.id, election.id));

        await recordAudit("system", "NOMINATION_INSUFFICIENT_CANDIDATES", {
          electionId: election.id,
          title: election.title,
          accepted,
          earlyClose: allResolved && !deadlinePassed,
        });
      }
    } catch (err) {
      logger.error("Nomination-expiry scheduler error", { error: String(err) });
    }
  });

  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const drafts = await db.query.elections.findMany({
        where: and(
          eq(elections.status, "draft"),
          isNotNull(elections.nominationDeadline),
        ),
      });

      for (const election of drafts) {
        const deadline = new Date(election.nominationDeadline as Date);
        if (deadline > now) continue;

        if (election.startTime && election.endTime) continue;

        const phase = ((election as any).decisionPhase ?? "initial") as
          "initial" | "final";
        const decisionEndsAt = new Date(
          deadline.getTime() + ADMIN_DECISION_WINDOW_MS,
        );

        await db
          .update(candidateRequests)
          .set({ status: "expired", updatedAt: now })
          .where(
            and(
              eq(candidateRequests.electionId, election.id),
              eq(candidateRequests.status, "pending"),
            ),
          );

        if (!(election as any).decisionPeriodNotifiedAt) {
          const accepted = await countAcceptedNominations(election.id);
          await db
            .update(elections)
            .set({ decisionPeriodNotifiedAt: now } as any)
            .where(eq(elections.id, election.id));

          await notifyAllAdmins(
            "adminDecisionPeriod",
            `${phase === "final" ? "Final decision" : "Decision"} required — ${election.title}`,
            phase === "final"
              ? `Response period ended — ${accepted} accepted. Decide by ${decisionEndsAt.toLocaleString()}: start voting (min. 2 accepted) or cancel. No further extension available.`
              : `Response period ended — ${accepted} accepted. Decide by ${decisionEndsAt.toLocaleString()}: start voting (min. 2 accepted), extend once, or cancel.`,
            election.id,
            {
              electionId: election.id,
              accepted,
              phase,
              decisionEndsAt: decisionEndsAt.toISOString(),
            },
          );

          await recordAudit("system", "ADMIN_DECISION_PERIOD_OPENED", {
            electionId: election.id,
            phase,
            accepted,
            endsAt: decisionEndsAt.toISOString(),
          });
        }

        if (now > decisionEndsAt) {
          await db
            .update(elections)
            .set({
              status: "cancelled",
              cancelledAt: now,
              cancelReason: `decision_period_expired_${phase}`,
              nominationAlertSent: true,
            } as any)
            .where(eq(elections.id, election.id));

          await recordAudit("system", "ELECTION_CANCELLED", {
            electionId: election.id,
            reason: "admin_decision_period_expired",
            phase,
          });

          await notifyAllAdmins(
            "electionCancelled",
            `Election cancelled — ${election.title}`,
            `No decision was made within the ${phase === "final" ? "final " : ""}decision period, so the election was cancelled automatically.`,
            election.id,
            { electionId: election.id, phase },
          );

          logger.warn("Election auto-cancelled: decision period expired", {
            electionId: election.id,
            phase,
          });
        }
      }
    } catch (err) {
      logger.error("Decision-period scheduler error", { error: String(err) });
    }
  });

  logger.info(
    "Election lifecycle scheduler started (activation + close + nomination-expiry checks)",
  );
}
