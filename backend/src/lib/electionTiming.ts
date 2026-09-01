export const MIN_ALLOWANCE_MINUTES = 10;
export const MAX_ALLOWANCE_MINUTES = 7 * 24 * 60;
export const MIN_GAP_MINUTES = 10;
export const MIN_VOTING_MINUTES = 10;
export const MAX_VOTING_MINUTES = 7 * 24 * 60;

export const MIN_EXTENSION_MINUTES = 10 * 60;
export const MAX_EXTENSION_MINUTES = 24 * 60;
export const ADMIN_DECISION_WINDOW_MS = 24 * 60 * 60 * 1000;

export const MIN_ACCEPTED_CANDIDATES = 2;

export const MINUTE_MS = 60 * 1000;

export interface ElectionTimingInput {
  allowanceStart?: Date;

  nominationDeadline: Date;
  startTime?: Date;
  endTime?: Date;
}

export interface TimingViolation {
  field: "nominationDeadline" | "startTime" | "endTime";
  message: string;
}

export function validateElectionTiming(
  input: ElectionTimingInput,
): TimingViolation[] {
  const violations: TimingViolation[] = [];
  const allowanceStart = input.allowanceStart ?? new Date();

  const allowanceMinutes =
    (input.nominationDeadline.getTime() - allowanceStart.getTime()) / MINUTE_MS;
  if (allowanceMinutes < MIN_ALLOWANCE_MINUTES) {
    violations.push({
      field: "nominationDeadline",
      message: `The candidate allowance period must last at least ${MIN_ALLOWANCE_MINUTES} minutes.`,
    });
  }
  if (allowanceMinutes > MAX_ALLOWANCE_MINUTES) {
    violations.push({
      field: "nominationDeadline",
      message:
        "The initial candidate allowance period cannot be longer than 7 days.",
    });
  }

  if (
    input.startTime &&
    input.startTime.getTime() < input.nominationDeadline.getTime()
  ) {
    violations.push({
      field: "startTime",
      message:
        "Voting cannot start before the candidate allowance period ends.",
    });
  }

  if (input.startTime && input.endTime) {
    const gapMinutes =
      (input.startTime.getTime() - input.nominationDeadline.getTime()) /
      MINUTE_MS;
    if (gapMinutes < MIN_GAP_MINUTES)
      violations.push({
        field: "startTime",
        message: `Voting must start at least ${MIN_GAP_MINUTES} minutes after the candidate allowance period ends.`,
      });
    const votingMinutes =
      (input.endTime.getTime() - input.startTime.getTime()) / MINUTE_MS;
    if (votingMinutes < MIN_VOTING_MINUTES)
      violations.push({
        field: "endTime",
        message: `Voting must stay open for at least ${MIN_VOTING_MINUTES} minutes.`,
      });
    if (votingMinutes > MAX_VOTING_MINUTES)
      violations.push({
        field: "endTime",
        message: `Voting cannot stay open longer than 7 days.`,
      });
  } else if (input.startTime || input.endTime) {
    violations.push({
      field: input.startTime ? "endTime" : "startTime",
      message: "Voting start and end must be provided together.",
    });
  }

  return violations;
}

export function decisionWindowEndsAt(deadline: Date): Date {
  return new Date(deadline.getTime() + ADMIN_DECISION_WINDOW_MS);
}

export function isAdminDecisionWindowOpen(
  deadline: Date | null | undefined,
  now = new Date(),
): boolean {
  return Boolean(
    deadline && now >= deadline && now <= decisionWindowEndsAt(deadline),
  );
}

export const START_TIME_GRACE_MS = 60 * 1000;

export function validateVotingWindow(
  startTime: Date,
  endTime: Date,
  now = new Date(),
): string[] {
  const errors: string[] = [];
  if (startTime.getTime() < now.getTime() - START_TIME_GRACE_MS) {
    errors.push("Voting start must be now or later.");
  }
  if (
    endTime.getTime() - startTime.getTime() <
    MIN_VOTING_MINUTES * MINUTE_MS
  ) {
    errors.push(
      `Voting must stay open for at least ${MIN_VOTING_MINUTES} minutes.`,
    );
  }
  if (
    endTime.getTime() - startTime.getTime() >
    MAX_VOTING_MINUTES * MINUTE_MS
  ) {
    errors.push("Voting cannot stay open longer than 7 days.");
  }
  return errors;
}

export function earliestVotingStart(deadline: Date): Date {
  return new Date(deadline.getTime() + MIN_GAP_MINUTES * MINUTE_MS);
}

export function earliestVotingEnd(start: Date): Date {
  return new Date(start.getTime() + MIN_VOTING_MINUTES * MINUTE_MS);
}

export function recalculateVotingWindow(
  newDeadline: Date,
  currentStart: Date | null,
  currentEnd: Date | null,
): { startTime: Date | null; endTime: Date | null } {
  if (!currentStart || !currentEnd) return { startTime: null, endTime: null };

  const minStart = earliestVotingStart(newDeadline);
  const startTime = currentStart > minStart ? currentStart : minStart;

  const plannedDurationMs = currentEnd.getTime() - currentStart.getTime();
  const slid = new Date(
    startTime.getTime() +
      Math.max(plannedDurationMs, MIN_VOTING_MINUTES * MINUTE_MS),
  );
  const endTime = currentEnd > slid ? currentEnd : slid;

  return { startTime, endTime };
}

export type DecisionPhase = "initial" | "final";

export function formatDuration(minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function canExtendAllowance(params: {
  decisionPhase: DecisionPhase | string | null | undefined;
  allowanceExtendedAt: Date | null | undefined;
  noResponseCount: number;
  nominationDeadline: Date | null | undefined;
  now?: Date;
}): boolean {
  const now = params.now ?? new Date();
  if (params.allowanceExtendedAt) return false;
  if ((params.decisionPhase ?? "initial") !== "initial") return false;
  if (params.noResponseCount <= 0) return false;
  return isAdminDecisionWindowOpen(params.nominationDeadline, now);
}

export function isDecisionWindowExpired(
  deadline: Date | null | undefined,
  now = new Date(),
): boolean {
  return Boolean(deadline && now > decisionWindowEndsAt(deadline));
}
