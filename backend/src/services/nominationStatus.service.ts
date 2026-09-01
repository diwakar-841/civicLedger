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
  canExtendAllowance as extensionAllowed 
} from

"../lib/electionTiming";

function plural(n, one, many) {
  return n === 1 ? one : many;
}

export async function getNominationStatus(electionId) {
  const [election] = await db.select().from(elections).where(eq(elections.id, electionId));
  if (!election) {throw new NotFoundError("Election not found");}

  const rows = await db.
  select({
    id: candidateRequests.id,
    userId: candidateRequests.userId,
    status: candidateRequests.status,
    respondedAt: candidateRequests.respondedAt,
    profileCompletedAt: candidateRequests.profileCompletedAt,
    reminderSentAt: candidateRequests.reminderSentAt,
    fullName: users.fullName
  }).
  from(candidateRequests).
  leftJoin(users, eq(candidateRequests.userId, users.id)).
  where(eq(candidateRequests.electionId, electionId));

  const list = rows.map((r) => {return {
      requestId: r.id,
      userId: r.userId,
      name: r.fullName ?? "Unknown voter",
      status:
      r.status === "accepted" ? "accepted" : r.status === "rejected" ? "rejected" : "no_response",
      rawStatus: r.status,
      respondedAt: r.respondedAt ? new Date(r.respondedAt).toISOString() : null,
      profileCompletedAt: r.profileCompletedAt ?
      new Date(r.profileCompletedAt).toISOString() :
      null,
      reminderSentAt: r.reminderSentAt ? new Date(r.reminderSentAt).toISOString() : null
    };});

  const remindableCount = list.filter(
    (c) => {return c.rawStatus === "pending" && !c.respondedAt && !c.reminderSentAt;}
  ).length;

  const acceptedCount = list.filter((c) => {return c.status === "accepted";}).length;
  const rejectedCount = list.filter((c) => {return c.status === "rejected";}).length;
  const noResponseCount = list.filter((c) => {return c.status === "no_response";}).length;
  const profileCompletedCount = list.filter(
    (c) => {return c.status === "accepted" && c.profileCompletedAt;}
  ).length;

  const now = new Date();
  const allowanceEnded = Boolean(
    election.nominationDeadline && new Date(election.nominationDeadline) <= now
  );

  const enoughAccepted =
  acceptedCount >= MIN_ACCEPTED_CANDIDATES && profileCompletedCount >= MIN_ACCEPTED_CANDIDATES;
  const isDraft = election.status === "draft";

  const decisionWindowOpen = isAdminDecisionWindowOpen(election.nominationDeadline);
  const decisionPhase = election.decisionPhase ?? "initial";
  const allowanceExtendedAt = election.allowanceExtendedAt ?
  new Date(election.allowanceExtendedAt) :
  null;
  const extensionUsed = Boolean(allowanceExtendedAt) || decisionPhase === "final";

  const votingScheduled = Boolean(election.startTime && election.endTime);
  const canStartVoting = isDraft && enoughAccepted && decisionWindowOpen && !votingScheduled;

  const canExtendAllowance =
  isDraft &&
  !votingScheduled &&
  extensionAllowed({
    decisionPhase,
    allowanceExtendedAt,
    noResponseCount,
    nominationDeadline: election.nominationDeadline ?
    new Date(election.nominationDeadline) :
    null,
    now
  });

  const canCloseElection =
  isDraft && allowanceEnded && !votingScheduled && profileCompletedCount < MIN_ACCEPTED_CANDIDATES;

  let nominationCase;
  let recommendationTitle;
  let recommendation;

  if (votingScheduled && isDraft) {
    nominationCase = "A";
    recommendationTitle = "Voting scheduled";
    recommendation = `Voting opens ${new Date(
      election.startTime
    ).toLocaleString()} and closes ${new Date(
      election.endTime
    ).toLocaleString()}. No further action required.`;
  } else if (list.length === 0) {
    nominationCase = "NO_REQUESTS";
    recommendationTitle = "No nominations sent";
    recommendation =
    "Invite candidates to begin the response period.";
  } else if (!allowanceEnded) {

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
  profileCompletedCount < MIN_ACCEPTED_CANDIDATES)
  {
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

  if (allowanceEnded && isDraft && !votingScheduled && decisionWindowOpen) {
    const endsAt = decisionWindowEndsAt(new Date(election.nominationDeadline));
    const options = [
    canStartVoting ?
    "start voting" :
    `start voting (locked — ${MIN_ACCEPTED_CANDIDATES} accepted candidates are required)`,
    canExtendAllowance ? "extend the allowance once for non-responders" : null,
    "cancel the election"].
    filter(Boolean);

    recommendationTitle =
    decisionPhase === "final" ?
    "Final 24-hour admin decision period" :
    "24-hour admin decision period";
    recommendation =
    `${recommendation} ` +
    `You have until ${endsAt.toLocaleString()} to decide. You can ${options.join(", ")}.` + (
    decisionPhase === "final" ?
    " The allowance has already been extended once, so no further extension is possible." :
    "");
  }

  return {
    electionId: election.id,
    title: election.title,
    status: election.status,
    nominationDeadline: election.nominationDeadline ?
    new Date(election.nominationDeadline).toISOString() :
    null,
    startTime: election.startTime ? new Date(election.startTime).toISOString() : null,
    endTime: election.endTime ? new Date(election.endTime).toISOString() : null,
    allowanceEnded,
    adminWindowEndsAt:
    allowanceEnded && election.nominationDeadline ?
    decisionWindowEndsAt(new Date(election.nominationDeadline)).toISOString() :
    null,
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
    list.some((c) => {return c.status === "no_response" && c.reminderSentAt;}),

    canSendReminders: isDraft && !allowanceEnded && remindableCount > 0,
    recommendationTitle,
    recommendation,
    rules: {
      minAcceptedCandidates: MIN_ACCEPTED_CANDIDATES,
      minAllowanceMinutes: MIN_ALLOWANCE_MINUTES,
      minGapMinutes: MIN_GAP_MINUTES,
      minVotingMinutes: MIN_VOTING_MINUTES,
      minExtensionMinutes: MIN_EXTENSION_MINUTES,
      maxExtensionMinutes: MAX_EXTENSION_MINUTES
    }
  };
}

export async function countBallotCandidates(electionId) {
  const rows = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.electionId, electionId));
  return rows.length;
}