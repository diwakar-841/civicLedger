/**
 * Nomination status service — evaluates an election's candidate-allowance
 * outcome and decides which administrator actions are permitted.
 *
 * Candidate response buckets:
 *   • accepted     — the nominee accepted the nomination
 *   • rejected     — the nominee declined
 *   • noResponse   — the nominee never responded (still pending, or the
 *                    allowance window expired on them)
 *
 * Decision matrix (see the workflow spec):
 *
 *   accepted ≥ 2, no pending          → Case A: voting can start
 *   accepted ≥ 2, some no-response    → Case B: start now OR extend allowance
 *   accepted = 1, some no-response    → Case C: cannot start; extend or close
 *   accepted = 1, none pending        → Case D: cannot start; close only
 *   accepted = 0, all rejected        → Case E: cannot start; close only
 */
import { db } from "../../../database/index";
import { elections } from "../../../database/schema/elections";
import { candidateRequests } from "../../../database/schema/candidateRequests";
import { users } from "../../../database/schema/users";
import { candidates } from "../../../database/schema/candidates";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../lib/errors";
import {
  MIN_ACCEPTED_CANDIDATES,
  MIN_ALLOWANCE_MINUTES,
  MIN_GAP_MINUTES,
  MIN_VOTING_MINUTES,
  MIN_EXTENSION_MINUTES,
  MAX_EXTENSION_MINUTES,
  isAdminDecisionWindowOpen,
  decisionWindowEndsAt,
  canExtendAllowance as extensionAllowed,
  type DecisionPhase,
} from "../lib/electionTiming";

export type CandidateResponseStatus = "accepted" | "rejected" | "no_response";

export interface CandidateResponse {
  requestId: string;
  userId: string;
  name: string;
  status: CandidateResponseStatus;
  /** Raw request status kept for the UI ("pending" vs "expired" no-response). */
  rawStatus: "pending" | "accepted" | "rejected" | "expired";
  respondedAt: string | null;
  profileCompletedAt: string | null;
  /** ISO time the one-off nomination reminder was sent, or null. */
  reminderSentAt: string | null;
}

export type NominationCase = "A" | "B" | "C" | "D" | "E" | "OPEN" | "NO_REQUESTS";

export interface NominationStatus {
  electionId: string;
  title: string;
  status: string;
  nominationDeadline: string | null;
  startTime: string | null;
  endTime: string | null;
  allowanceEnded: boolean;
  /** End of the 24-hour admin decision window that opens once the allowance period ends. Null while the allowance is still active. */
  adminWindowEndsAt: string | null;
  /** Which admin decision period this election is in: the first one, or the final one after the single allowed extension. */
  decisionPhase: DecisionPhase;
  /** True once the one permitted allowance extension has been used. */
  extensionUsed: boolean;
  /** ISO time the allowance was extended, or null. */
  allowanceExtendedAt: string | null;
  /** True while the current 24-hour admin decision period is running. */
  decisionWindowOpen: boolean;
  totalInvited: number;
  acceptedCount: number;
  rejectedCount: number;
  noResponseCount: number;
  profileCompletedCount: number;
  candidates: CandidateResponse[];
  /** Which spec case the election currently matches. */
  case: NominationCase;
  canStartVoting: boolean;
  canExtendAllowance: boolean;
  canCloseElection: boolean;
  /** Nominees who never responded AND have not been reminded yet. */
  remindableCount: number;
  /** True once every no-response nominee has already had their one reminder. */
  remindersAlreadySent: boolean;
  /** A reminder may be sent only while the allowance period is still running and someone is still remindable. */
  canSendReminders: boolean;
  recommendationTitle: string;
  recommendation: string;
  rules: {
    minAcceptedCandidates: number;
    minAllowanceMinutes: number;
    minGapMinutes: number;
    minVotingMinutes: number;
    minExtensionMinutes: number;
    maxExtensionMinutes: number;
  };
}

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

export async function getNominationStatus(electionId: string): Promise<NominationStatus> {
  const [election] = await db.select().from(elections).where(eq(elections.id, electionId));
  if (!election) throw new NotFoundError("Election not found");

  const rows = await db
    .select({
      id: candidateRequests.id,
      userId: candidateRequests.userId,
      status: candidateRequests.status,
      respondedAt: candidateRequests.respondedAt,
      profileCompletedAt: candidateRequests.profileCompletedAt,
      reminderSentAt: candidateRequests.reminderSentAt,
      fullName: users.fullName,
    })
    .from(candidateRequests)
    .leftJoin(users, eq(candidateRequests.userId, users.id))
    .where(eq(candidateRequests.electionId, electionId));

  const list: CandidateResponse[] = rows.map((r) => ({
    requestId: r.id,
    userId: r.userId,
    name: r.fullName ?? "Unknown voter",
    status:
      r.status === "accepted" ? "accepted" : r.status === "rejected" ? "rejected" : "no_response",
    rawStatus: r.status as CandidateResponse["rawStatus"],
    respondedAt: r.respondedAt ? new Date(r.respondedAt).toISOString() : null,
    profileCompletedAt: r.profileCompletedAt
      ? new Date(r.profileCompletedAt).toISOString()
      : null,
    reminderSentAt: r.reminderSentAt ? new Date(r.reminderSentAt).toISOString() : null,
  }));

  // Reminders are only for nominees who never responded at all, and each of
  // them may be reminded exactly once.
  const remindableCount = list.filter(
    (c) => c.rawStatus === "pending" && !c.respondedAt && !c.reminderSentAt
  ).length;

  const acceptedCount = list.filter((c) => c.status === "accepted").length;
  const rejectedCount = list.filter((c) => c.status === "rejected").length;
  const noResponseCount = list.filter((c) => c.status === "no_response").length;
  const profileCompletedCount = list.filter(
    (c) => c.status === "accepted" && c.profileCompletedAt
  ).length;

  const now = new Date();
  const allowanceEnded = Boolean(
    election.nominationDeadline && new Date(election.nominationDeadline) <= now
  );

  // ── Permissions ───────────────────────────────────────────────────────────
  // Voting can only start with ≥2 accepted candidates.
  // Accepting is not enough — a candidate only appears on the ballot once their
  // candidate profile is complete, so both counts must clear the minimum.
  const enoughAccepted =
    acceptedCount >= MIN_ACCEPTED_CANDIDATES && profileCompletedCount >= MIN_ACCEPTED_CANDIDATES;
  const isDraft = election.status === "draft";
  // Starting voting and extending are both "post-allowance operations" —
  // the current allowance/extension period must have actually finished,
  // and the resulting 24-hour admin decision window must still be open.
  const decisionWindowOpen = isAdminDecisionWindowOpen(election.nominationDeadline);
  const decisionPhase = ((election as any).decisionPhase ?? "initial") as DecisionPhase;
  const allowanceExtendedAt = (election as any).allowanceExtendedAt
    ? new Date((election as any).allowanceExtendedAt)
    : null;
  const extensionUsed = Boolean(allowanceExtendedAt) || decisionPhase === "final";

  // A draft that already has a saved voting window is *scheduled*: voting must
  // not be startable a second time (that used to re-open the decision window
  // and move the window silently).
  const votingScheduled = Boolean(election.startTime && election.endTime);
  const canStartVoting = isDraft && enoughAccepted && decisionWindowOpen && !votingScheduled;
  // Extending only ever targets candidates who never responded — never the
  // ones who explicitly rejected.
  // The allowance may be extended EXACTLY ONCE, only during the FIRST
  // 24-hour decision period, and only for candidates who never responded.
  // In the final decision period the admin may only start voting or cancel.
  const canExtendAllowance =
    isDraft &&
    !votingScheduled &&
    extensionAllowed({
      decisionPhase,
      allowanceExtendedAt,
      noResponseCount,
      nominationDeadline: election.nominationDeadline
        ? new Date(election.nominationDeadline)
        : null,
      now,
    });
  // Closing is forbidden while the election could still legitimately run,
  // or while the allowance period (or an active extension) is still
  // running — candidates who haven't responded yet must be given their
  // full window before the election can be cancelled out from under them.
  // Unlike starting/extending, closing isn't capped by the 24-hour window
  // itself, so an abandoned draft is never permanently stuck.
  // Cancelling is always available to the admin once the allowance period has
  // ended — including when 2+ candidates accepted (spec §3 option C / §5
  // option B). It is never available while candidates can still respond.
  // Cancellation is only the insufficient-candidate path. Once two eligible
  // profiles exist, the admin must proceed with voting instead.
  const canCloseElection =
    isDraft && allowanceEnded && !votingScheduled && profileCompletedCount < MIN_ACCEPTED_CANDIDATES;

  // ── Case + recommendation ─────────────────────────────────────────────────
  let nominationCase: NominationCase;
  let recommendationTitle: string;
  let recommendation: string;

  if (votingScheduled && isDraft) {
    nominationCase = "A";
    recommendationTitle = "Voting scheduled";
    recommendation = `Voting opens ${new Date(
      election.startTime as Date
    ).toLocaleString()} and closes ${new Date(
      election.endTime as Date
    ).toLocaleString()}. No further action required.`;
  } else if (list.length === 0) {
    nominationCase = "NO_REQUESTS";
    recommendationTitle = "No nominations sent";
    recommendation =
      "Invite candidates to begin the response period.";
  } else if (!allowanceEnded) {
    // The allowance period (or an active extension) is still running —
    // no admin action is available yet regardless of how many candidates
    // have already accepted.
    nominationCase = "OPEN";
    recommendationTitle = "Allowance period in progress";
    recommendation = `${noResponseCount} of the invited ${plural(
      noResponseCount,
      "candidate has",
      "candidates have"
    )} not responded. Reviewed when the response period ends.`;
  } else if (enoughAccepted && noResponseCount > 0) {
    nominationCase = "B";
    recommendationTitle = "Eligible to start voting";
    recommendation = `${acceptedCount} accepted — voting can begin. ${noResponseCount} ${plural(
      noResponseCount,
      "candidate has",
      "candidates have"
    )} not responded; you may extend instead.`;
  } else if (enoughAccepted) {
    nominationCase = "A";
    recommendationTitle = "Eligible to start voting";
    recommendation = `${acceptedCount} accepted with completed profiles. Set the voting start and end time.`;
  } else if (
    acceptedCount >= MIN_ACCEPTED_CANDIDATES &&
    profileCompletedCount < MIN_ACCEPTED_CANDIDATES
  ) {
    nominationCase = "C";
    recommendationTitle = "Waiting on candidate profiles";
    recommendation = `${acceptedCount} accepted, ${profileCompletedCount} ${plural(
      profileCompletedCount,
      "profile",
      "profiles"
    )} complete. ${MIN_ACCEPTED_CANDIDATES} complete profiles are required to open voting.`;
  } else if (acceptedCount === 1 && noResponseCount > 0) {
    nominationCase = "C";
    recommendationTitle = "Not eligible — extension available";
    recommendation = `Fewer than ${MIN_ACCEPTED_CANDIDATES} acceptances. ${noResponseCount} ${plural(
      noResponseCount,
      "candidate has",
      "candidates have"
    )} not responded — extend the deadline or close the election.`;
  } else if (acceptedCount === 0 && noResponseCount > 0) {
    nominationCase = "C";
    recommendationTitle = "Not eligible — extension available";
    recommendation = `No acceptances yet. ${noResponseCount} ${plural(
      noResponseCount,
      "candidate has",
      "candidates have"
    )} not responded — extend the deadline or close the election.`;
  } else if (acceptedCount === 1) {
    nominationCase = "D";
    recommendationTitle = "Election must be closed";
    recommendation =
      "Only one acceptance and no pending responses. Close the election.";
  } else {
    nominationCase = "E";
    recommendationTitle = "Election must be closed";
    recommendation =
      "All invited candidates declined. Close the election.";
  }

  // ── Decision-period overrides ─────────────────────────────────────────────
  // Once the allowance period (or the single extension) has ended, the
  // election is inside a 24-hour admin decision period. Say so explicitly and
  // spell out exactly which options remain.
  if (allowanceEnded && isDraft && !votingScheduled && decisionWindowOpen) {
    const endsAt = decisionWindowEndsAt(new Date(election.nominationDeadline as Date));
    const options = [
      canStartVoting
        ? "start voting"
        : `start voting (locked — ${MIN_ACCEPTED_CANDIDATES} accepted candidates are required)`,
      canExtendAllowance ? "extend the allowance once for non-responders" : null,
      "cancel the election",
    ].filter(Boolean) as string[];

    recommendationTitle =
      decisionPhase === "final"
        ? "Final 24-hour admin decision period"
        : "24-hour admin decision period";
    recommendation =
      `${recommendation} ` +
      `You have until ${endsAt.toLocaleString()} to decide. You can ${options.join(", ")}.` +
      (decisionPhase === "final"
        ? " The allowance has already been extended once, so no further extension is possible."
        : "");
  }

  return {
    electionId: election.id,
    title: election.title,
    status: election.status,
    nominationDeadline: election.nominationDeadline
      ? new Date(election.nominationDeadline).toISOString()
      : null,
    startTime: election.startTime ? new Date(election.startTime).toISOString() : null,
    endTime: election.endTime ? new Date(election.endTime).toISOString() : null,
    allowanceEnded,
    adminWindowEndsAt:
      allowanceEnded && election.nominationDeadline
        ? decisionWindowEndsAt(new Date(election.nominationDeadline)).toISOString()
        : null,
    decisionPhase,
    extensionUsed,
    allowanceExtendedAt: allowanceExtendedAt ? allowanceExtendedAt.toISOString() : null,
    decisionWindowOpen,
    totalInvited: list.length,
    acceptedCount,
    rejectedCount,
    noResponseCount,
    profileCompletedCount,
    candidates: list,
    case: nominationCase,
    canStartVoting,
    canExtendAllowance,
    canCloseElection,
    remindableCount,
    remindersAlreadySent:
      remindableCount === 0 &&
      list.some((c) => c.status === "no_response" && c.reminderSentAt),
    // A reminder is pointless once the allowance period has ended.
    canSendReminders: isDraft && !allowanceEnded && remindableCount > 0,
    recommendationTitle,
    recommendation,
    rules: {
      minAcceptedCandidates: MIN_ACCEPTED_CANDIDATES,
      minAllowanceMinutes: MIN_ALLOWANCE_MINUTES,
      minGapMinutes: MIN_GAP_MINUTES,
      minVotingMinutes: MIN_VOTING_MINUTES,
      minExtensionMinutes: MIN_EXTENSION_MINUTES,
      maxExtensionMinutes: MAX_EXTENSION_MINUTES,
    },
  };
}

/** Registered (profile-complete) candidate rows — used before opening voting. */
export async function countBallotCandidates(electionId: string): Promise<number> {
  const rows = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.electionId, electionId));
  return rows.length;
}
