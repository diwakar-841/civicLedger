import { Router, Request, Response } from "express";
import { db } from "../../../database/index";
import { elections } from "../../../database/schema/elections";
import { candidateRequests } from "../../../database/schema/candidateRequests";
import { notificationService } from "../services/notification.service";
import { getNominationStatus } from "../services/nominationStatus.service";
import {
  setLiveResults,
  setResultsReleaseAt,
  hasOtherActiveElection,
} from "../services/election.service";
import { recordAudit } from "../lib/audit";
import { logger } from "../lib/logger";
import { eq, and, count, isNotNull, isNull, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware";
import {
  MIN_ACCEPTED_CANDIDATES,
  MIN_ALLOWANCE_MINUTES,
  MAX_ALLOWANCE_MINUTES,
  MIN_EXTENSION_MINUTES,
  MAX_EXTENSION_MINUTES,
  MIN_GAP_MINUTES,
  MIN_VOTING_MINUTES,
  MINUTE_MS,
  earliestVotingStart,
  recalculateVotingWindow,
  decisionWindowEndsAt,
  isAdminDecisionWindowOpen,
  validateVotingWindow,
  START_TIME_GRACE_MS,
  canExtendAllowance as extensionAllowed,
  isDecisionWindowExpired,
  formatDuration,
} from "../lib/electionTiming";

const router = Router();

router.use(requireAuth, requireAdmin);

function actorOf(req: Request): string {
  return (req as any).user?.userId ?? "system";
}

router.get("/draft", async (req: Request, res: Response) => {
  try {
    const draftElections = await db
      .select()
      .from(elections)
      .where(eq(elections.status, "draft"));

    const enriched = await Promise.all(
      draftElections.map(async (election) => {
        const [{ acceptedCount }] = await db
          .select({ acceptedCount: count() })
          .from(candidateRequests)
          .where(
            and(
              eq(candidateRequests.electionId, election.id),
              eq(candidateRequests.status, "accepted"),
            ),
          );

        const [{ profileCompletedCount }] = await db
          .select({ profileCompletedCount: count() })
          .from(candidateRequests)
          .where(
            and(
              eq(candidateRequests.electionId, election.id),
              eq(candidateRequests.status, "accepted"),
              isNotNull(candidateRequests.profileCompletedAt),
            ),
          );

        const [{ pendingCount }] = await db
          .select({ pendingCount: count() })
          .from(candidateRequests)
          .where(
            and(
              eq(candidateRequests.electionId, election.id),
              eq(candidateRequests.status, "pending"),
            ),
          );

        const [{ rejectedCount }] = await db
          .select({ rejectedCount: count() })
          .from(candidateRequests)
          .where(
            and(
              eq(candidateRequests.electionId, election.id),
              eq(candidateRequests.status, "rejected"),
            ),
          );

        const [{ expiredCount }] = await db
          .select({ expiredCount: count() })
          .from(candidateRequests)
          .where(
            and(
              eq(candidateRequests.electionId, election.id),
              eq(candidateRequests.status, "expired"),
            ),
          );

        const [{ remindableCount }] = await db
          .select({ remindableCount: count() })
          .from(candidateRequests)
          .where(
            and(
              eq(candidateRequests.electionId, election.id),
              eq(candidateRequests.status, "pending"),
              isNull(candidateRequests.respondedAt),
              isNull(candidateRequests.reminderSentAt),
            ),
          );

        const [{ totalCount }] = await db
          .select({ totalCount: count() })
          .from(candidateRequests)
          .where(eq(candidateRequests.electionId, election.id));

        const noResponseCount = Number(pendingCount) + Number(expiredCount);
        const enoughAccepted = Number(acceptedCount) >= MIN_ACCEPTED_CANDIDATES;

        const allowanceEnded = Boolean(
          election.nominationDeadline &&
          new Date(election.nominationDeadline) <= new Date(),
        );
        const decisionWindowOpen = isAdminDecisionWindowOpen(
          election.nominationDeadline,
        );

        return {
          ...election,
          acceptedCount: Number(acceptedCount),
          rejectedCount: Number(rejectedCount),
          noResponseCount,
          profileCompletedCount: Number(profileCompletedCount),
          pendingCount: Number(pendingCount),
          requestedCount: Number(totalCount),
          remindableCount: Number(remindableCount),

          canSendReminders: !allowanceEnded && Number(remindableCount) > 0,

          readyToActivate: enoughAccepted && decisionWindowOpen,
          canStartVoting: enoughAccepted && decisionWindowOpen,
          canExtend: extensionAllowed({
            decisionPhase: (election as any).decisionPhase,
            allowanceExtendedAt: (election as any).allowanceExtendedAt,
            noResponseCount,
            nominationDeadline: election.nominationDeadline,
          }),
          extensionUsed:
            Boolean((election as any).allowanceExtendedAt) ||
            (election as any).decisionPhase === "final",
          decisionPhase: (election as any).decisionPhase ?? "initial",
          canCancel: allowanceEnded,
          mustClose: !enoughAccepted && allowanceEnded,
        };
      }),
    );

    res.json(enriched);
  } catch (error) {
    logger.error("[admin] Error fetching draft elections:", { error: String(error) });
    res.status(500).json({ error: "Failed to fetch draft elections" });
  }
});

router.get(
  "/:electionId/nomination-status",
  async (req: Request, res: Response) => {
    try {
      const status = await getNominationStatus(req.params.electionId);
      res.json(status);
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.name === "NotFoundError") {
        return res.status(404).json({ error: "Election not found" });
      }
      logger.error("[admin] Error loading nomination status:", { error: String(error) });
      res.status(500).json({ error: "Failed to load nomination status" });
    }
  },
);

router.get("/:electionId/status", async (req: Request, res: Response) => {
  try {
    const s = await getNominationStatus(req.params.electionId);
    res.json({
      electionId: s.electionId,
      title: s.title,
      totalInvited: s.totalInvited,
      accepted: s.acceptedCount,
      rejected: s.rejectedCount,
      noResponse: s.noResponseCount,
      profileCompleted: s.profileCompletedCount,
      candidates: s.candidates.map((c) => ({
        requestId: c.requestId,
        userId: c.userId,
        name: c.name,
        status: c.rawStatus,
        displayStatus:
          c.status === "accepted"
            ? "Accepted"
            : c.status === "rejected"
              ? "Rejected"
              : "No Response",
        profileCompleted: Boolean(c.profileCompletedAt),
        respondedAt: c.respondedAt,
      })),
      canStartVoting: s.canStartVoting,
      canExtend: s.canExtendAllowance,
      canCancel: s.canCloseElection,
      mustClose:
        s.canCloseElection && s.acceptedCount < MIN_ACCEPTED_CANDIDATES,
      status: s.status,
      allowanceEnded: s.allowanceEnded,
      nominationDeadline: s.nominationDeadline,
      decisionPhase: s.decisionPhase,
      extensionUsed: s.extensionUsed,
      decisionWindowOpen: s.decisionWindowOpen,
      adminWindowEndsAt: s.adminWindowEndsAt,
      rules: s.rules,
      recommendationTitle: s.recommendationTitle,
      recommendation: s.recommendation,
    });
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.name === "NotFoundError") {
      return res.status(404).json({ error: "Election not found" });
    }
    logger.error("[admin] Error loading election status:", { error: String(error) });
    res.status(500).json({ error: "Failed to load election status" });
  }
});

const extendAllowanceHandler = async (req: Request, res: Response) => {
  try {
    const { electionId } = req.params;
    const minutes = Number(req.body?.minutes);

    if (
      !Number.isFinite(minutes) ||
      minutes < MIN_EXTENSION_MINUTES ||
      minutes > MAX_EXTENSION_MINUTES
    ) {
      return res.status(400).json({
        error: `The extension must be between ${formatDuration(MIN_EXTENSION_MINUTES)} and ${formatDuration(MAX_EXTENSION_MINUTES)}.`,
      });
    }

    const [election] = await db
      .select()
      .from(elections)
      .where(eq(elections.id, electionId));
    if (!election) return res.status(404).json({ error: "Election not found" });
    if (election.status !== "draft") {
      return res
        .status(400)
        .json({
          error: "Only elections that haven't started can be extended.",
        });
    }

    if (!isAdminDecisionWindowOpen(election.nominationDeadline)) {
      return res.status(400).json({
        error:
          election.nominationDeadline &&
          new Date(election.nominationDeadline) > new Date()
            ? "The allowance period is still active — it can only be extended after it ends."
            : "The 24-hour admin decision period has expired — the allowance period can no longer be extended.",
      });
    }

    if (
      (election as any).allowanceExtendedAt ||
      (election as any).decisionPhase === "final"
    ) {
      return res.status(400).json({
        error:
          "The allowance period has already been extended once. This is the final admin decision period — you can only start voting or cancel the election.",
      });
    }

    const status = await getNominationStatus(electionId);
    if (status.profileCompletedCount >= 2) {
      return res.status(400).json({
        error:
          "This election has enough eligible candidates to proceed and cannot be cancelled for insufficient candidates.",
      });
    }
    if (status.noResponseCount === 0) {
      return res.status(400).json({
        error:
          "The allowance period can't be extended — every invited candidate has already responded. Rejected candidates are never re-invited.",
      });
    }

    const newDeadline = new Date(Date.now() + minutes * MINUTE_MS);
    const { startTime, endTime } = recalculateVotingWindow(
      newDeadline,
      election.startTime ? new Date(election.startTime) : null,
      election.endTime ? new Date(election.endTime) : null,
    );

    const noResponseIds = status.candidates
      .filter((c) => c.status === "no_response")
      .map((c) => c.requestId);

    if (noResponseIds.length > 0) {
      await db
        .update(candidateRequests)
        .set({
          status: "pending",
          expiresAt: newDeadline,
          updatedAt: new Date(),
        })
        .where(inArray(candidateRequests.id, noResponseIds));
    }

    await db
      .update(elections)
      .set({
        nominationDeadline: newDeadline,
        nominationAlertSent: false,

        decisionPhase: "final",
        allowanceExtendedAt: new Date(),
        allowanceExtensionMinutes: String(minutes),

        decisionPeriodNotifiedAt: null,

        startTime,
        endTime,
      })
      .where(eq(elections.id, electionId));

    for (const candidate of status.candidates.filter(
      (c) => c.status === "no_response",
    )) {
      await notificationService.createNotification(
        candidate.userId,
        "nominationReminder",
        "Nomination deadline extended",
        `You still have time to respond to your nomination for "${election.title}". New deadline: ${newDeadline.toLocaleString()}`,
        electionId,
        { electionId, requestId: candidate.requestId },
      );
    }

    await recordAudit(actorOf(req), "NOMINATION_ALLOWANCE_EXTENDED", {
      electionId,
      minutes,
      newDeadline: newDeadline.toISOString(),
      startTime: startTime ? startTime.toISOString() : null,
      endTime: endTime ? endTime.toISOString() : null,
      notifiedCandidates: noResponseIds.length,
    });

    res.json({
      success: true,
      message: `Allowance period extended by ${formatDuration(minutes)} for ${noResponseIds.length} candidate${noResponseIds.length === 1 ? "" : "s"} who hadn't responded.`,
      nominationDeadline: newDeadline,
      startTime,
      endTime,
      earliestVotingStart: earliestVotingStart(newDeadline),
      extendedFor: noResponseIds.length,
    });
  } catch (error) {
    logger.error("[admin] Error extending allowance:", { error: String(error) });
    res.status(500).json({ error: "Failed to extend the allowance period" });
  }
};

router.post("/:electionId/extend-allowance", extendAllowanceHandler);

router.post("/:electionId/extend-deadline", (req: Request, res: Response) => {
  const minutes = Number(req.body?.minutes);
  const hours = Number(req.body?.hours);
  req.body = {
    minutes:
      Number.isFinite(minutes) && minutes > 0
        ? Math.round(minutes)
        : Math.round((Number.isFinite(hours) && hours > 0 ? hours : 24) * 60),
  };
  return extendAllowanceHandler(req, res);
});

router.post(
  "/:electionId/start-voting",
  async (req: Request, res: Response) => {
    try {
      const { electionId } = req.params;

      const [election] = await db
        .select()
        .from(elections)
        .where(eq(elections.id, electionId));
      if (!election)
        return res.status(404).json({ error: "Election not found" });
      if (election.status !== "draft") {
        return res
          .status(400)
          .json({ error: "This election has already started." });
      }

      if (election.startTime && election.endTime) {
        return res.status(400).json({
          error: `Voting is already scheduled for ${new Date(election.startTime).toISOString()}. Extend the allowance period or close the election instead.`,
        });
      }
      if (!isAdminDecisionWindowOpen(election.nominationDeadline)) {
        return res
          .status(400)
          .json({
            error:
              "Voting can only be scheduled during the 24-hour admin action window after the allowance period.",
          });
      }

      const status = await getNominationStatus(electionId);
      if (status.acceptedCount < MIN_ACCEPTED_CANDIDATES) {
        return res.status(400).json({
          error: `Voting cannot begin because fewer than ${MIN_ACCEPTED_CANDIDATES} candidates have accepted the nomination (${status.acceptedCount} accepted).`,
        });
      }

      if (status.profileCompletedCount < MIN_ACCEPTED_CANDIDATES) {
        return res.status(400).json({
          error: `Voting cannot begin until at least ${MIN_ACCEPTED_CANDIDATES} accepted candidates have completed their candidate profile (${status.profileCompletedCount} completed).`,
        });
      }

      if (!req.body?.startTime || !req.body?.endTime) {
        return res.status(400).json({
          error: "Choose a voting start and end time before starting voting.",
        });
      }
      const startTime = new Date(req.body.startTime);
      const endTime = new Date(req.body.endTime);
      if (
        Number.isNaN(startTime.getTime()) ||
        Number.isNaN(endTime.getTime())
      ) {
        return res
          .status(400)
          .json({ error: "Voting start and end must be valid dates." });
      }
      const votingErrors = validateVotingWindow(startTime, endTime);
      if (votingErrors.length)
        return res.status(400).json({ error: votingErrors.join(" ") });

      const resultsMode =
        req.body?.resultsMode === "manual" ? "manual" : "live";
      let resultsReleaseAt: Date | null = null;
      if (resultsMode === "manual") {
        if (!req.body?.resultsReleaseAt) {
          return res.status(400).json({
            error: "Choose a results release date, or switch to live results.",
          });
        }
        resultsReleaseAt = new Date(req.body.resultsReleaseAt);
        if (Number.isNaN(resultsReleaseAt.getTime())) {
          return res
            .status(400)
            .json({ error: "Results release date must be a valid date." });
        }
        if (resultsReleaseAt.getTime() <= endTime.getTime()) {
          return res
            .status(400)
            .json({
              error: "Results release date must be after the voting end time.",
            });
        }
      }

      const now = new Date();

      const startsNow =
        startTime.getTime() <= now.getTime() + START_TIME_GRACE_MS;

      // The contract has one global "voting open" flag and one shared
      // candidate list, so only one election can be live at a time. The
      // scheduler and scheduleElection() both enforce this; this endpoint did
      // not, so an admin could activate a second election while another was
      // running - and the first one closing would then switch voting off on
      // chain underneath the second.
      if (startsNow && (await hasOtherActiveElection(electionId))) {
        return res.status(409).json({
          error:
            "Another election is currently active. Only one election can be open for voting at a time - wait for it to close, or schedule this one to start after it ends.",
        });
      }

      try {
        const { setElectionOpen } =
          await import("../services/blockchain.service");
        if (startsNow) await setElectionOpen(true);
      } catch (err) {
        logger.error(
          "Failed to open voting on-chain — election NOT activated",
          {
            electionId,
            error: String(err),
          },
        );
        return res
          .status(502)
          .json({
            error:
              "Could not open voting on-chain. Please try again in a moment.",
          });
      }

      // Only now that opening voting succeeded is it safe to expire the
      // remaining pending nominations (previously done BEFORE the on-chain
      // call, so a failed call left the election in draft with every pending
      // nomination already destroyed).
      await db
        .update(candidateRequests)
        .set({ status: "expired", updatedAt: now })
        .where(
          and(
            eq(candidateRequests.electionId, electionId),
            eq(candidateRequests.status, "pending"),
          ),
        );

      const [updated] = await db
        .update(elections)
        .set({
          startTime,
          endTime,
          status: startsNow ? "active" : "draft",
          nominationAlertSent: true,
        })
        .where(eq(elections.id, electionId))
        .returning();

      await recordAudit(actorOf(req), "ELECTION_STATUS_CHANGED", {
        electionId,
        from: "draft",
        to: startsNow ? "active" : "draft",
        reason: "admin_started_voting",
        accepted: status.acceptedCount,
      });

      await notificationService.notifyElectionParticipants(
        electionId,
        election.title,
        startsNow
          ? `Voting is now open for "${election.title}".`
          : `Voting is scheduled for "${election.title}" at ${startTime.toLocaleString()}.`,
        {
          type: startsNow ? "votingOpen" : "votingScheduled",
          heading: startsNow
            ? `Voting is open — ${election.title}`
            : `Voting scheduled — ${election.title}`,
        },
      );

      const withResults =
        resultsMode === "live"
          ? await setLiveResults(electionId, true, actorOf(req))
          : await setResultsReleaseAt(
              electionId,
              resultsReleaseAt,
              actorOf(req),
            );

      res.json({ success: true, election: { ...updated, ...withResults } });
    } catch (error) {
      logger.error("[admin] Error starting voting:", { error: String(error) });
      res.status(500).json({ error: "Failed to start voting" });
    }
  },
);

router.post(
  "/:electionId/results-settings",
  async (req: Request, res: Response) => {
    try {
      const { electionId } = req.params;

      const [election] = await db
        .select()
        .from(elections)
        .where(eq(elections.id, electionId));
      if (!election)
        return res.status(404).json({ error: "Election not found" });
      if (!election.startTime || !election.endTime) {
        return res.status(400).json({
          error:
            "Set the voting start and end time before configuring results.",
        });
      }

      const mode = req.body?.mode;
      if (mode !== "live" && mode !== "manual") {
        return res
          .status(400)
          .json({ error: 'mode must be "live" or "manual".' });
      }

      if (mode === "live") {
        const updated = await setLiveResults(electionId, true, actorOf(req));
        return res.json({ success: true, election: updated });
      }

      if (!req.body?.resultsReleaseAt) {
        return res
          .status(400)
          .json({ error: "Provide a results release date." });
      }
      const resultsReleaseAt = new Date(req.body.resultsReleaseAt);
      if (Number.isNaN(resultsReleaseAt.getTime())) {
        return res
          .status(400)
          .json({ error: "Results release date must be a valid date." });
      }

      if (election.liveResultsEnabled) {
        await setLiveResults(electionId, false, actorOf(req));
      }
      const updated = await setResultsReleaseAt(
        electionId,
        resultsReleaseAt,
        actorOf(req),
      );
      res.json({ success: true, election: updated });
    } catch (error: any) {
      if (error?.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      logger.error("[admin] Error updating results settings:", { error: String(error) });
      res.status(500).json({ error: "Failed to update results settings" });
    }
  },
);

router.post(
  "/:electionId/resend-nominations",
  async (req: Request, res: Response) => {
    try {
      const { electionId } = req.params;

      const [election] = await db
        .select()
        .from(elections)
        .where(eq(elections.id, electionId));

      if (!election)
        return res.status(404).json({ error: "Election not found" });
      if (election.status !== "draft") {
        return res
          .status(400)
          .json({ error: "Reminders can only be sent for draft elections" });
      }
      if (
        election.nominationDeadline &&
        new Date(election.nominationDeadline) <= new Date()
      ) {
        return res.status(400).json({
          error:
            "The candidate allowance period has ended — reminders can no longer be sent.",
        });
      }

      const remindable = await db
        .select()
        .from(candidateRequests)
        .where(
          and(
            eq(candidateRequests.electionId, electionId),
            eq(candidateRequests.status, "pending"),
            isNull(candidateRequests.respondedAt),
            isNull(candidateRequests.reminderSentAt),
          ),
        );

      if (remindable.length === 0) {
        return res.status(400).json({
          error:
            "Every nominee awaiting a response has already received their one reminder — no further reminders can be sent.",
        });
      }

      const now = new Date();
      for (const request of remindable) {
        await notificationService.createNotification(
          request.userId,
          "nominationReminder",
          "Reminder: Respond to your nomination",
          `Please accept or decline your nomination for "${election.title}". Deadline: ${new Date(request.expiresAt).toLocaleString()}`,
          electionId,
          { electionId, requestId: request.id },
        );
        await db
          .update(candidateRequests)
          .set({ reminderSentAt: now, updatedAt: now })
          .where(eq(candidateRequests.id, request.id));
      }

      await recordAudit(actorOf(req), "NOMINATION_REMINDERS_SENT", {
        electionId,
        remindersSent: remindable.length,
      });

      res.json({
        success: true,
        remindersSent: remindable.length,
        remindersRemaining: 0,
      });
    } catch (error) {
      logger.error("[admin] Error sending nomination reminders:", { error: String(error) });
      res.status(500).json({ error: "Failed to send reminders" });
    }
  },
);

const cancelElectionHandler = async (req: Request, res: Response) => {
  try {
    const { electionId } = req.params;

    const [election] = await db
      .select()
      .from(elections)
      .where(eq(elections.id, electionId));

    if (!election) return res.status(404).json({ error: "Election not found" });
    if (election.status === "cancelled") {
      return res
        .status(400)
        .json({ error: "This election has already been cancelled." });
    }
    if (election.status !== "draft") {
      return res.status(400).json({
        error: "Only elections that haven't started voting can be cancelled.",
      });
    }

    if (
      election.nominationDeadline &&
      new Date(election.nominationDeadline) > new Date()
    ) {
      return res.status(400).json({
        error:
          "This election can't be cancelled while the candidate allowance period is still active.",
      });
    }

    const status = await getNominationStatus(electionId);
    const now = new Date();

    await db
      .update(candidateRequests)
      .set({ status: "expired", updatedAt: now })
      .where(
        and(
          eq(candidateRequests.electionId, electionId),
          eq(candidateRequests.status, "pending"),
        ),
      );

    await db
      .update(elections)
      .set({
        status: "cancelled",
        cancelledAt: now,
        cancelReason:
          typeof req.body?.reason === "string"
            ? req.body.reason
            : "cancelled_by_admin",
        nominationAlertSent: true,
      })
      .where(eq(elections.id, electionId));

    await recordAudit(actorOf(req), "ELECTION_CANCELLED", {
      electionId,
      title: election.title,
      accepted: status.acceptedCount,
      rejected: status.rejectedCount,
      noResponse: status.noResponseCount,
      decisionPhase: (election as any).decisionPhase ?? "initial",
    });

    await notificationService.notifyElectionParticipants(
      electionId,
      election.title,
      `"${election.title}" has been cancelled by the administrator. No voting will take place.`,
      {
        type: "electionCancelled",
        heading: `Election cancelled — ${election.title}`,
      },
    );

    res.json({
      success: true,
      message: "Election cancelled",
      status: "cancelled",
    });
  } catch (error) {
    logger.error("[admin] Error cancelling election:", { error: String(error) });
    res.status(500).json({ error: "Failed to cancel the election" });
  }
};

router.post("/:electionId/close-draft", cancelElectionHandler);
router.post("/:electionId/cancel", cancelElectionHandler);

router.post(
  "/:electionId/set-nomination-deadline",
  async (req: Request, res: Response) => {
    try {
      const { electionId } = req.params;
      const { deadline } = req.body;

      if (!deadline)
        return res.status(400).json({ error: "deadline is required" });

      const nominationDeadline = new Date(deadline);
      if (Number.isNaN(nominationDeadline.getTime())) {
        return res
          .status(400)
          .json({
            error: "The shared nomination deadline must be a valid date",
          });
      }

      const allowanceMinutes =
        (nominationDeadline.getTime() - Date.now()) / MINUTE_MS;
      if (
        allowanceMinutes < MIN_ALLOWANCE_MINUTES ||
        allowanceMinutes > MAX_ALLOWANCE_MINUTES
      ) {
        return res.status(400).json({
          error: `The initial allowance must be between ${MIN_ALLOWANCE_MINUTES} minutes and 7 days.`,
        });
      }

      const [election] = await db
        .select({
          id: elections.id,
          status: elections.status,
          startTime: elections.startTime,
        })
        .from(elections)
        .where(eq(elections.id, electionId));
      if (!election)
        return res.status(404).json({ error: "Election not found" });
      if (election.status !== "draft") {
        return res
          .status(400)
          .json({
            error: "Only draft elections can change the nomination deadline",
          });
      }

      const [{ requestCount }] = await db
        .select({ requestCount: count() })
        .from(candidateRequests)
        .where(eq(candidateRequests.electionId, electionId));
      if (Number(requestCount) > 0) {
        return res.status(400).json({
          error:
            "The candidate allowance period has already started — use the extend-allowance action to change it.",
        });
      }
      if (
        election.startTime &&
        new Date(election.startTime).getTime() - nominationDeadline.getTime() <
          MIN_GAP_MINUTES * MINUTE_MS
      ) {
        return res.status(400).json({
          error: `Voting must start at least ${MIN_GAP_MINUTES} minutes after the allowance period ends.`,
        });
      }

      await db
        .update(elections)
        .set({ nominationDeadline, nominationAlertSent: false })
        .where(eq(elections.id, electionId));

      await db
        .update(candidateRequests)
        .set({ expiresAt: nominationDeadline, updatedAt: new Date() })
        .where(
          and(
            eq(candidateRequests.electionId, electionId),
            eq(candidateRequests.status, "pending"),
          ),
        );

      res.json({
        success: true,
        nominationDeadline,
        earliestVotingStart: earliestVotingStart(nominationDeadline),
      });
    } catch (error) {
      logger.error("[admin] Error setting nomination deadline:", { error: String(error) });
      res.status(500).json({ error: "Failed to set nomination deadline" });
    }
  },
);

export default router;
