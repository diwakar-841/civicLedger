import { Router, Request, Response } from "express";
import { db } from "../../../database/index";
import { elections } from "../../../database/schema/elections";
import { candidateRequests } from "../../../database/schema/candidateRequests";
import { notificationService } from "../services/notification.service";
import { getNominationStatus } from "../services/nominationStatus.service";
import { setLiveResults, setResultsReleaseAt } from "../services/election.service";
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

// All routes here are already gated by the parent admin router's
// requireAuth + requireAdmin + requireTwoFactor middleware, but we
// repeat the lighter checks here for safety when the router is used standalone.
router.use(requireAuth, requireAdmin);

function actorOf(req: Request): string {
  return (req as any).user?.userId ?? "system";
}

// GET /admin/elections/draft — list all draft elections with counts
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
              eq(candidateRequests.status, "accepted")
            )
          );

        const [{ profileCompletedCount }] = await db
          .select({ profileCompletedCount: count() })
          .from(candidateRequests)
          .where(
            and(
              eq(candidateRequests.electionId, election.id),
              eq(candidateRequests.status, "accepted"),
              isNotNull(candidateRequests.profileCompletedAt)
            )
          );

        const [{ pendingCount }] = await db
          .select({ pendingCount: count() })
          .from(candidateRequests)
          .where(
            and(
              eq(candidateRequests.electionId, election.id),
              eq(candidateRequests.status, "pending")
            )
          );

        const [{ rejectedCount }] = await db
          .select({ rejectedCount: count() })
          .from(candidateRequests)
          .where(
            and(
              eq(candidateRequests.electionId, election.id),
              eq(candidateRequests.status, "rejected")
            )
          );

        const [{ expiredCount }] = await db
          .select({ expiredCount: count() })
          .from(candidateRequests)
          .where(
            and(
              eq(candidateRequests.electionId, election.id),
              eq(candidateRequests.status, "expired")
            )
          );

        const [{ remindableCount }] = await db
          .select({ remindableCount: count() })
          .from(candidateRequests)
          .where(
            and(
              eq(candidateRequests.electionId, election.id),
              eq(candidateRequests.status, "pending"),
              isNull(candidateRequests.respondedAt),
              isNull(candidateRequests.reminderSentAt)
            )
          );

        const [{ totalCount }] = await db
          .select({ totalCount: count() })
          .from(candidateRequests)
          .where(eq(candidateRequests.electionId, election.id));

        // "No response" = never answered: still pending, or expired unanswered.
        const noResponseCount = Number(pendingCount) + Number(expiredCount);
        const enoughAccepted = Number(acceptedCount) >= MIN_ACCEPTED_CANDIDATES;
        // Every one of these actions is a "post-allowance operation": the
        // initial allowance period (or an active extension) must have
        // actually finished — admins can't start voting, extend, or close
        // while candidates could still respond. Extending is further capped
        // at the 24-hour admin decision window so it can't be used to revive
        // a long-abandoned draft; closing is allowed any time after the
        // allowance ends so a stale draft is never permanently stuck.
        const allowanceEnded = Boolean(
          election.nominationDeadline && new Date(election.nominationDeadline) <= new Date()
        );
        const decisionWindowOpen = isAdminDecisionWindowOpen(election.nominationDeadline);

        return {
          ...election,
          acceptedCount: Number(acceptedCount),
          rejectedCount: Number(rejectedCount),
          noResponseCount,
          profileCompletedCount: Number(profileCompletedCount),
          pendingCount: Number(pendingCount),
          requestedCount: Number(totalCount),
          remindableCount: Number(remindableCount),
          // One reminder per nominee, and only while they can still respond.
          canSendReminders: !allowanceEnded && Number(remindableCount) > 0,
          // Convenience for the UI: which admin actions are legal right now?
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
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error("[admin] Error fetching draft elections:", error);
    res.status(500).json({ error: "Failed to fetch draft elections" });
  }
});

// GET /admin/elections/:electionId/nomination-status
// Full post-allowance summary: every invited candidate with their status and
// response time, plus the recommendation and which actions are permitted.
router.get("/:electionId/nomination-status", async (req: Request, res: Response) => {
  try {
    const status = await getNominationStatus(req.params.electionId);
    res.json(status);
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.name === "NotFoundError") {
      return res.status(404).json({ error: "Election not found" });
    }
    console.error("[admin] Error loading nomination status:", error);
    res.status(500).json({ error: "Failed to load nomination status" });
  }
});

/**
 * GET /admin/elections/:electionId/status
 * Flattened candidate-allowance summary used by the Election Status page.
 * (The page used to call this route before it existed, so it always errored.)
 */
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
          c.status === "accepted" ? "Accepted" : c.status === "rejected" ? "Rejected" : "No Response",
        profileCompleted: Boolean(c.profileCompletedAt),
        respondedAt: c.respondedAt,
      })),
      canStartVoting: s.canStartVoting,
      canExtend: s.canExtendAllowance,
      canCancel: s.canCloseElection,
      mustClose: s.canCloseElection && s.acceptedCount < MIN_ACCEPTED_CANDIDATES,
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
    console.error("[admin] Error loading election status:", error);
    res.status(500).json({ error: "Failed to load election status" });
  }
});

/**
 * POST /admin/elections/:electionId/extend-allowance
 * Body: { minutes: number }  (10 … 1440)
 *
 * Extends the candidate allowance period for candidates who have NOT
 * responded. Rejected candidates are never contacted again. The voting window
 * is automatically recalculated so voting still starts at least
 * MIN_GAP_MINUTES after the new allowance end, and still runs for at least
 * MIN_VOTING_MINUTES.
 */
const extendAllowanceHandler = async (req: Request, res: Response) => {

  try {
    const { electionId } = req.params;
    const minutes = Number(req.body?.minutes);

    if (!Number.isFinite(minutes) || minutes < MIN_EXTENSION_MINUTES || minutes > MAX_EXTENSION_MINUTES) {
      return res.status(400).json({
        error: `The extension must be between ${formatDuration(MIN_EXTENSION_MINUTES)} and ${formatDuration(MAX_EXTENSION_MINUTES)}.`,
      });
    }

    const [election] = await db.select().from(elections).where(eq(elections.id, electionId));
    if (!election) return res.status(404).json({ error: "Election not found" });
    if (election.status !== "draft") {
      return res.status(400).json({ error: "Only elections that haven't started can be extended." });
    }
    // Extensions are an admin-modification-window action: the current
    // allowance/extension period must have actually finished, and the
    // 24-hour decision window since it finished must not have expired.
    if (!isAdminDecisionWindowOpen(election.nominationDeadline)) {
      return res.status(400).json({
        error: election.nominationDeadline && new Date(election.nominationDeadline) > new Date()
          ? "The allowance period is still active — it can only be extended after it ends."
          : "The 24-hour admin decision period has expired — the allowance period can no longer be extended.",
      });
    }
    // ── Only ONE extension per election, and only in the FIRST decision
    // period. After it, the admin gets a FINAL 24-hour window in which the
    // only options are Start Voting (≥2 accepted) or Cancel.
    if ((election as any).allowanceExtendedAt || (election as any).decisionPhase === "final") {
      return res.status(400).json({
        error:
          "The allowance period has already been extended once. This is the final admin decision period — you can only start voting or cancel the election.",
      });
    }

    const status = await getNominationStatus(electionId);
    if (status.profileCompletedCount >= 2) {
      return res.status(400).json({
        error: "This election has enough eligible candidates to proceed and cannot be cancelled for insufficient candidates.",
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
      election.endTime ? new Date(election.endTime) : null
    );

    // Only candidates who never responded get the new deadline. Rejected and
    // accepted rows are left untouched.
    const noResponseIds = status.candidates
      .filter((c) => c.status === "no_response")
      .map((c) => c.requestId);

    if (noResponseIds.length > 0) {
      await db
        .update(candidateRequests)
        .set({ status: "pending", expiresAt: newDeadline, updatedAt: new Date() })
        .where(inArray(candidateRequests.id, noResponseIds));
    }

    await db
      .update(elections)
      .set({
        nominationDeadline: newDeadline,
        nominationAlertSent: false,
        // This is the one and only extension; once it ends the election moves
        // into its FINAL 24-hour admin decision period.
        decisionPhase: "final",
        allowanceExtendedAt: new Date(),
        allowanceExtensionMinutes: String(minutes),
        // The final decision period hasn't been announced yet.
        decisionPeriodNotifiedAt: null,
        // Only slide a voting window that the admin had already scheduled.
        // Extending an allowance period never schedules voting by itself.
        startTime,
        endTime,
      })
      .where(eq(elections.id, electionId));

    // Re-notify only the non-responders.
    for (const candidate of status.candidates.filter((c) => c.status === "no_response")) {
      await notificationService.createNotification(
        candidate.userId,
        "nominationReminder",
        "Nomination deadline extended",
        `You still have time to respond to your nomination for "${election.title}". New deadline: ${newDeadline.toLocaleString()}`,
        electionId,
        { electionId, requestId: candidate.requestId }
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
    console.error("[admin] Error extending allowance:", error);
    res.status(500).json({ error: "Failed to extend the allowance period" });
  }
};

router.post("/:electionId/extend-allowance", extendAllowanceHandler);

// POST /admin/elections/:electionId/extend-deadline
// Legacy hours-based extension, kept for older clients. Runs the exact same
// rules as /extend-allowance (no-response candidates only, window recalculated).
router.post("/:electionId/extend-deadline", (req: Request, res: Response) => {
  // Older clients send { hours }, the admin UI sends { minutes } — honour
  // whichever arrived instead of silently defaulting to 24 hours.
  const minutes = Number(req.body?.minutes);
  const hours = Number(req.body?.hours);
  req.body = {
    minutes: Number.isFinite(minutes) && minutes > 0
      ? Math.round(minutes)
      : Math.round((Number.isFinite(hours) && hours > 0 ? hours : 24) * 60),
  };
  return extendAllowanceHandler(req, res);
});



/**
 * POST /admin/elections/:electionId/start-voting
 * Starts voting immediately. Only allowed with ≥ MIN_ACCEPTED_CANDIDATES
 * accepted nominations. Pending (no-response) requests are expired, the
 * allowance period is closed now, and the voting window is opened.
 */
router.post("/:electionId/start-voting", async (req: Request, res: Response) => {
  try {
    const { electionId } = req.params;

    const [election] = await db.select().from(elections).where(eq(elections.id, electionId));
    if (!election) return res.status(404).json({ error: "Election not found" });
    if (election.status !== "draft") {
      return res.status(400).json({ error: "This election has already started." });
    }
    // A draft with a voting window already saved is "scheduled", not startable
    // again — re-posting would silently move the window (and re-expire
    // requests) behind the admin's back.
    if (election.startTime && election.endTime) {
      return res.status(400).json({
        error: `Voting is already scheduled for ${new Date(election.startTime).toISOString()}. Extend the allowance period or close the election instead.`,
      });
    }
    if (!isAdminDecisionWindowOpen(election.nominationDeadline)) {
      return res.status(400).json({ error: "Voting can only be scheduled during the 24-hour admin action window after the allowance period." });
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

    // The voting window is never inferred: the admin must choose both a start
    // and an end time before voting can open.
    if (!req.body?.startTime || !req.body?.endTime) {
      return res.status(400).json({
        error: "Choose a voting start and end time before starting voting.",
      });
    }
    const startTime = new Date(req.body.startTime);
    const endTime = new Date(req.body.endTime);
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return res.status(400).json({ error: "Voting start and end must be valid dates." });
    }
    const votingErrors = validateVotingWindow(startTime, endTime);
    if (votingErrors.length) return res.status(400).json({ error: votingErrors.join(" ") });

    // ── Results option — how voters find out the outcome ──────────────────
    // Chosen in the same step as the voting window: either results are live
    // (visible the moment votes are cast) or released manually at a chosen
    // date/time. The manual date only has to be after voting closes here —
    // it can be pushed later at any point afterwards via /results-settings.
    const resultsMode = req.body?.resultsMode === "manual" ? "manual" : "live";
    let resultsReleaseAt: Date | null = null;
    if (resultsMode === "manual") {
      if (!req.body?.resultsReleaseAt) {
        return res.status(400).json({
          error: "Choose a results release date, or switch to live results.",
        });
      }
      resultsReleaseAt = new Date(req.body.resultsReleaseAt);
      if (Number.isNaN(resultsReleaseAt.getTime())) {
        return res.status(400).json({ error: "Results release date must be a valid date." });
      }
      if (resultsReleaseAt.getTime() <= endTime.getTime()) {
        return res.status(400).json({ error: "Results release date must be after the voting end time." });
      }
    }

    const now = new Date();
    // Only a window that begins right now opens voting immediately; anything
    // later stays a scheduled draft until the scheduler reaches startTime.
    const startsNow = startTime.getTime() <= now.getTime() + START_TIME_GRACE_MS;

    // Close the allowance window: nobody who hasn't answered can answer now.
    await db
      .update(candidateRequests)
      .set({ status: "expired", updatedAt: now })
      .where(
        and(eq(candidateRequests.electionId, electionId), eq(candidateRequests.status, "pending"))
      );

    try {
      const { setElectionOpen } = await import("../services/blockchain.service");
      if (startsNow) await setElectionOpen(true);
    } catch (err) {
      logger.error("Failed to open voting on-chain — election NOT activated", {
        electionId,
        error: String(err),
      });
      return res
        .status(502)
        .json({ error: "Could not open voting on-chain. Please try again in a moment." });
    }

    const [updated] = await db
      .update(elections)
      .set({
        // The allowance deadline is history — it must NOT be moved to "now",
        // otherwise the 24-hour admin decision window restarts and the
        // election looks like its allowance period just ended.
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
        : `Voting is scheduled for "${election.title}" at ${startTime.toLocaleString()}.`
    );

    // Apply the results option chosen alongside the voting window.
    const withResults =
      resultsMode === "live"
        ? await setLiveResults(electionId, true, actorOf(req))
        : await setResultsReleaseAt(electionId, resultsReleaseAt, actorOf(req));

    res.json({ success: true, election: { ...updated, ...withResults } });
  } catch (error) {
    console.error("[admin] Error starting voting:", error);
    res.status(500).json({ error: "Failed to start voting" });
  }
});


/**
 * POST /admin/elections/:electionId/results-settings
 * Body: { mode: "live" } | { mode: "manual", resultsReleaseAt: ISOString }
 *
 * Changes how results are revealed to voters — switch to live, or set/extend
 * the manual release date/time. Unlike /start-voting (which sets the initial
 * choice alongside the voting window), this can be called any time after a
 * voting window exists: while voting is scheduled, actively open, or already
 * closed. This is how an admin extends a manual release date they chose
 * earlier without touching anything else about the election.
 */
router.post("/:electionId/results-settings", async (req: Request, res: Response) => {
  try {
    const { electionId } = req.params;

    const [election] = await db.select().from(elections).where(eq(elections.id, electionId));
    if (!election) return res.status(404).json({ error: "Election not found" });
    if (!election.startTime || !election.endTime) {
      return res.status(400).json({
        error: "Set the voting start and end time before configuring results.",
      });
    }

    const mode = req.body?.mode;
    if (mode !== "live" && mode !== "manual") {
      return res.status(400).json({ error: 'mode must be "live" or "manual".' });
    }

    if (mode === "live") {
      const updated = await setLiveResults(electionId, true, actorOf(req));
      return res.json({ success: true, election: updated });
    }

    if (!req.body?.resultsReleaseAt) {
      return res.status(400).json({ error: "Provide a results release date." });
    }
    const resultsReleaseAt = new Date(req.body.resultsReleaseAt);
    if (Number.isNaN(resultsReleaseAt.getTime())) {
      return res.status(400).json({ error: "Results release date must be a valid date." });
    }

    // Moving back to a manual date after live was on must also turn the live
    // flag off — otherwise isResultsPublished() would keep reporting the
    // election as published via liveResultsEnabled regardless of the date.
    if (election.liveResultsEnabled) {
      await setLiveResults(electionId, false, actorOf(req));
    }
    const updated = await setResultsReleaseAt(electionId, resultsReleaseAt, actorOf(req));
    res.json({ success: true, election: updated });
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[admin] Error updating results settings:", error);
    res.status(500).json({ error: "Failed to update results settings" });
  }
});

// POST /admin/elections/:electionId/resend-nominations
// Sends the ONE allowed reminder to nominees who never responded at all.
//
// Rules:
//   • Only "pending" requests with no recorded response are reminded — accepted
//     and rejected nominees are never contacted again.
//   • Each nominee gets exactly one reminder, tracked by reminder_sent_at, so a
//     second click can never spam them.
//   • Reminders are pointless after the allowance period ends, so they are
//     refused from that point on.
router.post("/:electionId/resend-nominations", async (req: Request, res: Response) => {
  try {
    const { electionId } = req.params;

    const [election] = await db
      .select()
      .from(elections)
      .where(eq(elections.id, electionId));

    if (!election) return res.status(404).json({ error: "Election not found" });
    if (election.status !== "draft") {
      return res.status(400).json({ error: "Reminders can only be sent for draft elections" });
    }
    if (election.nominationDeadline && new Date(election.nominationDeadline) <= new Date()) {
      return res.status(400).json({
        error: "The candidate allowance period has ended — reminders can no longer be sent.",
      });
    }

    // Never responded at all + never reminded before.
    const remindable = await db
      .select()
      .from(candidateRequests)
      .where(
        and(
          eq(candidateRequests.electionId, electionId),
          eq(candidateRequests.status, "pending"),
          isNull(candidateRequests.respondedAt),
          isNull(candidateRequests.reminderSentAt)
        )
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
        { electionId, requestId: request.id }
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

    res.json({ success: true, remindersSent: remindable.length, remindersRemaining: 0 });
  } catch (error) {
    console.error("[admin] Error sending nomination reminders:", error);
    res.status(500).json({ error: "Failed to send reminders" });
  }
});

// POST /admin/elections/:electionId/close-draft   (alias: /cancel)
// Cancels the election (workflow spec §3 option C / §5 option B).
//
// The election is NOT deleted: it moves to the terminal CANCELLED state so the
// audit trail, candidate responses and notifications remain intact. Cancelling
// is available to the admin in either decision period, whatever the accepted
// count, but never while candidates can still respond.
const cancelElectionHandler = async (req: Request, res: Response) => {
  try {
    const { electionId } = req.params;

    const [election] = await db
      .select()
      .from(elections)
      .where(eq(elections.id, electionId));

    if (!election) return res.status(404).json({ error: "Election not found" });
    if (election.status === "cancelled") {
      return res.status(400).json({ error: "This election has already been cancelled." });
    }
    if (election.status !== "draft") {
      return res.status(400).json({
        error: "Only elections that haven't started voting can be cancelled.",
      });
    }
    // An admin can't cancel an election out from under candidates who could
    // still respond — the allowance period (or its extension) must be over.
    if (election.nominationDeadline && new Date(election.nominationDeadline) > new Date()) {
      return res.status(400).json({
        error: "This election can't be cancelled while the candidate allowance period is still active.",
      });
    }

    const status = await getNominationStatus(electionId);
    const now = new Date();

    // Nobody can respond to a cancelled election any more.
    await db
      .update(candidateRequests)
      .set({ status: "expired", updatedAt: now })
      .where(
        and(eq(candidateRequests.electionId, electionId), eq(candidateRequests.status, "pending"))
      );

    await db
      .update(elections)
      .set({
        status: "cancelled",
        cancelledAt: now,
        cancelReason: typeof req.body?.reason === "string" ? req.body.reason : "cancelled_by_admin",
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
      `"${election.title}" has been cancelled by the administrator. No voting will take place.`
    );

    res.json({ success: true, message: "Election cancelled", status: "cancelled" });
  } catch (error) {
    console.error("[admin] Error cancelling election:", error);
    res.status(500).json({ error: "Failed to cancel the election" });
  }
};

router.post("/:electionId/close-draft", cancelElectionHandler);
router.post("/:electionId/cancel", cancelElectionHandler);

// POST /admin/elections/:electionId/set-nomination-deadline
// Explicitly sets a nomination deadline for the election and syncs all pending requests.
router.post("/:electionId/set-nomination-deadline", async (req: Request, res: Response) => {
  try {
    const { electionId } = req.params;
    const { deadline } = req.body; // ISO string

    if (!deadline) return res.status(400).json({ error: "deadline is required" });

    const nominationDeadline = new Date(deadline);
    if (Number.isNaN(nominationDeadline.getTime())) {
      return res.status(400).json({ error: "The shared nomination deadline must be a valid date" });
    }

    // The allowance period itself must last at least MIN_ALLOWANCE_MINUTES.
    const allowanceMinutes = (nominationDeadline.getTime() - Date.now()) / MINUTE_MS;
    if (
      allowanceMinutes < MIN_ALLOWANCE_MINUTES ||
      allowanceMinutes > MAX_ALLOWANCE_MINUTES
    ) {
      return res.status(400).json({
        error: `The initial allowance must be between ${MIN_ALLOWANCE_MINUTES} minutes and 7 days.`,
      });
    }

    const [election] = await db
      .select({ id: elections.id, status: elections.status, startTime: elections.startTime })
      .from(elections)
      .where(eq(elections.id, electionId));
    if (!election) return res.status(404).json({ error: "Election not found" });
    if (election.status !== "draft") {
      return res.status(400).json({ error: "Only draft elections can change the nomination deadline" });
    }
    // This endpoint sets the INITIAL allowance period, before candidates
    // have been invited. Once requests exist, the allowance period is
    // active (or has run its course) and must go through /extend-allowance
    // instead — that route enforces the no-response-only targeting, the
    // 10-minute-to-24-hour extension bounds, and the admin decision window,
    // none of which apply here. Without this guard an admin could call this
    // route directly to change the deadline by an arbitrary amount at any
    // point during the allowance period, bypassing all of those rules.
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

    // Sync all pending requests to the same deadline
    await db
      .update(candidateRequests)
      .set({ expiresAt: nominationDeadline, updatedAt: new Date() })
      .where(
        and(
          eq(candidateRequests.electionId, electionId),
          eq(candidateRequests.status, "pending")
        )
      );

    res.json({
      success: true,
      nominationDeadline,
      earliestVotingStart: earliestVotingStart(nominationDeadline),
    });
  } catch (error) {
    console.error("[admin] Error setting nomination deadline:", error);
    res.status(500).json({ error: "Failed to set nomination deadline" });
  }
});

export default router;
