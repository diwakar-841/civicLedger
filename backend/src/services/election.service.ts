import { db, elections, candidates, users, votesCache } from "@voting/database";
import { eq, and, ne, sql } from "drizzle-orm";
import { NotFoundError, BadRequestError, ConflictError } from "../lib/errors";
import { registerCandidateOnChain } from "./blockchain.service";
import { recordAudit } from "../lib/audit";
import { logger } from "../lib/logger";
import {
  MIN_VOTING_MINUTES,
  MAX_VOTING_MINUTES,
  MINUTE_MS,
  validateElectionTiming,
} from "../lib/electionTiming";


// ── One-time startup migration ────────────────────────────────────────────────
//
// Adds rich candidate profile fields + voter_user_id FK if they don't exist.
// Called from src/index.ts on server start.

let candidateMigrationDone = false;

export async function runCandidateMigrations(): Promise<void> {
  if (candidateMigrationDone) return;
  try {
    await db.execute(sql`
      ALTER TABLE candidates
        ADD COLUMN IF NOT EXISTS voter_user_id UUID REFERENCES users(id) ON DELETE SET NULL
    `);
    await db.execute(sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS photo_url TEXT`);
    await db.execute(sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS bio TEXT`);
    await db.execute(sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS qualification TEXT`);
    await db.execute(sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS supports TEXT`);
    await db.execute(sql`ALTER TABLE candidate_requests ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP`);
    candidateMigrationDone = true;
    logger.info("Candidate migrations applied (rich profile columns ensured)");
  } catch (err) {
    logger.error("Candidate migrations failed", { error: String(err) });
  }
}

// Elections used to require start_time/end_time up front. They're now set
// only once candidates are finished being added (see scheduleElection), so
// the columns must allow NULL in databases created before this change.
let electionMigrationDone = false;

export async function runElectionMigrations(): Promise<void> {
  if (electionMigrationDone) return;
  try {
    await db.execute(sql`ALTER TABLE elections ALTER COLUMN start_time DROP NOT NULL`);
    await db.execute(sql`ALTER TABLE elections ALTER COLUMN end_time DROP NOT NULL`);
    await db.execute(sql`ALTER TABLE elections ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false`);
    await db.execute(sql`ALTER TABLE elections ADD COLUMN IF NOT EXISTS live_results_enabled BOOLEAN NOT NULL DEFAULT false`);
    await db.execute(sql`ALTER TABLE elections ADD COLUMN IF NOT EXISTS results_release_at TIMESTAMP`);
    await db.execute(sql`ALTER TABLE elections ADD COLUMN IF NOT EXISTS results_published_at TIMESTAMP`);
    await db.execute(sql`ALTER TABLE elections ADD COLUMN IF NOT EXISTS nomination_deadline TIMESTAMP`);
    await db.execute(sql`ALTER TABLE elections ADD COLUMN IF NOT EXISTS nomination_alert_sent BOOLEAN NOT NULL DEFAULT false`);
    // Election titles must be unique (case-insensitive) — see createElection()
    // below for the friendly pre-check; this index is the DB-level backstop.
    // Wrapped in the same try/catch as the rest of this function, so on a
    // database that already has duplicate titles this logs and is skipped
    // rather than crashing startup — the admin-facing check still applies
    // going forward, and the index can be added by hand once cleaned up.
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS elections_title_unique_idx ON elections (LOWER(title))`
    );
    electionMigrationDone = true;
    logger.info("Election migrations applied (start/end nullable; visibility + results-disclosure + nomination columns ensured)");
  } catch (err) {
    logger.error("Election migrations failed", { error: String(err) });
  }
}

// ── Setup rules ────────────────────────────────────────────────────────────────
//
// An election can't go live with too few choices on the ballot, or a voting
// window so short almost nobody could realistically vote in it.

export const MIN_CANDIDATES = 2;
export const MIN_ELECTION_MINUTES = 10;

// ── Voter search (admin) ───────────────────────────────────────────────────────
//
// Returns up to 10 verified registered voters whose name or voter-ID prefix
// matches the query. Used by the admin UI to select real users as candidates.

export async function searchVoters(query: string) {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const rows = await db.execute(sql`
    SELECT id, full_name, wallet_address, profile_photo_url
    FROM users
    WHERE is_verified = true
      AND (
        LOWER(full_name) LIKE LOWER(${"%" + q + "%"})
        OR REPLACE(id::text, '-', '') ILIKE ${q.replace(/-/g, "") + "%"}
      )
    ORDER BY full_name
    LIMIT 10
  `);

  return ((rows as any).rows ?? (rows as any)).map((u: any) => ({
    id: u.id,
    fullName: u.full_name,
    /** Human-readable voter ID: first 8 hex chars of UUID, uppercased */
    voterId: "VTR-" + (u.id as string).replace(/-/g, "").slice(0, 8).toUpperCase(),
    walletLinked: Boolean(u.wallet_address),
    photoUrl: u.profile_photo_url ?? null,
  }));
}

// ── Global search (elections / voters / admins) ────────────────────────────────
//
// Powers the search bar — available to every signed-in user. A single query
// can match:
//  - elections, by title or their human-readable "ELC-XXXXXXXX" ID
//  - voters (role "voter"), by name or their "VTR-XXXXXXXX" ID
//  - admins (role "admin"), by name or their "ADM-XXXXXXXX" ID
// `type` narrows the search to just one of the three; "all" (default)
// searches everything and returns each group separately so the UI can label
// results by kind. Every signed-in user (voter or admin) can use every
// type.
//
// Election visibility scoping (checked here, not just in the UI, so it
// can't be bypassed by calling the API directly):
//  - Non-admins only ever get elections they could already see in the
//    public list (not hidden, not still a draft).
//  - Admins additionally see draft and hidden elections.

export type AdminSearchType = "all" | "election" | "user" | "admin" | "group";

function toDisplayId(prefix: string, id: string): string {
  return `${prefix}-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/** Strips a "PREFIX-" if present and lower-cases, so "ELC-AB12CD34" and "ab12cd34" both match the same hex-prefix search. */
function bareIdQuery(q: string): string {
  return q.replace(/^[a-z]{2,4}-/i, "").replace(/-/g, "");
}

export async function adminSearch(
  query: string,
  type: AdminSearchType = "all",
  isAdmin: boolean = true,
  userId?: string
) {
  const q = query.trim();
  if (!q || q.length < 2) return { elections: [], users: [], admins: [], groups: [] };

  const idFragment = bareIdQuery(q);
  const like = `%${q}%`;

  const [electionRows, userRows, adminRows, groupRows] = await Promise.all([
    type === "all" || type === "election"
      ? db.execute(
          isAdmin
            ? sql`
                SELECT id, title, status, is_hidden, start_time, end_time
                FROM elections
                WHERE LOWER(title) LIKE LOWER(${like})
                   OR REPLACE(id::text, '-', '') ILIKE ${idFragment + "%"}
                ORDER BY title
                LIMIT 10
              `
            // Voters only ever see the same elections the public list shows
            // them: not hidden, and no longer a draft.
            : sql`
                SELECT id, title, status, is_hidden, start_time, end_time
                FROM elections
                WHERE is_hidden = false
                  AND status <> 'draft'
                  AND (election_type = 'public' OR group_id IN (SELECT group_id FROM group_members WHERE user_id=${userId}))
                  AND (
                    LOWER(title) LIKE LOWER(${like})
                    OR REPLACE(id::text, '-', '') ILIKE ${idFragment + "%"}
                  )
                ORDER BY title
                LIMIT 10
              `
        )
      : Promise.resolve({ rows: [] } as any),
    type === "all" || type === "group"
      ? db.execute(sql`SELECT id, name FROM groups WHERE LOWER(name) LIKE LOWER(${like}) ORDER BY name LIMIT 10`)
      : Promise.resolve({ rows: [] } as any),
    type === "all" || type === "user"
      ? db.execute(sql`
          SELECT id, full_name, email, is_verified
          FROM users
          WHERE role = 'voter'
            AND (
              LOWER(full_name) LIKE LOWER(${like})
              OR REPLACE(id::text, '-', '') ILIKE ${idFragment + "%"}
            )
          ORDER BY full_name
          LIMIT 10
        `)
      : Promise.resolve({ rows: [] } as any),
    type === "all" || type === "admin"
      ? db.execute(sql`
          SELECT id, full_name, email
          FROM users
          WHERE role = 'admin'
            AND (
              LOWER(full_name) LIKE LOWER(${like})
              OR REPLACE(id::text, '-', '') ILIKE ${idFragment + "%"}
            )
          ORDER BY full_name
          LIMIT 10
        `)
      : Promise.resolve({ rows: [] } as any),
  ]);

  const elRows = (electionRows as any).rows ?? (electionRows as any);
  const usrRows = (userRows as any).rows ?? (userRows as any);
  const admRows = (adminRows as any).rows ?? (adminRows as any);
  const grpRows = (groupRows as any).rows ?? (groupRows as any);

  return {
    elections: elRows.map((e: any) => ({
      kind: "election" as const,
      id: e.id,
      displayId: toDisplayId("ELC", e.id),
      title: e.title,
      status: e.status,
      isHidden: e.is_hidden,
      startTime: e.start_time,
      endTime: e.end_time,
    })),
    users: usrRows.map((u: any) => ({
      kind: "user" as const,
      id: u.id,
      displayId: toDisplayId("VTR", u.id),
      fullName: u.full_name,
      email: u.email,
      isVerified: u.is_verified,
    })),
    admins: admRows.map((a: any) => ({
      kind: "admin" as const,
      id: a.id,
      displayId: toDisplayId("ADM", a.id),
      fullName: a.full_name,
      email: a.email,
    })),
    groups: grpRows.map((g: any) => ({ kind: "group" as const, id: g.id, displayId: toDisplayId("GRP", g.id), name: g.name })),
  };
}

// ── Elections ─────────────────────────────────────────────────────────────────

export async function createElection(
  data: { title: string; description?: string; electionType?: "public" | "group"; groupId?: string },
  actorId: string
) {
  const title = data.title.trim();

  // Case-insensitive duplicate check ("Board Vote" collides with
  // "board vote") so admins get a clear, friendly error instead of a raw DB
  // constraint failure. The unique index created in runElectionMigrations()
  // is the backstop for the race between this check and the insert below.
  const dupResult = await db.execute(
    sql`SELECT id FROM elections WHERE LOWER(title) = LOWER(${title}) LIMIT 1`
  );
  const dupRows = (dupResult as any).rows ?? (dupResult as any);
  if (dupRows.length > 0) {
    throw new ConflictError("An election with this title already exists. Please choose a different title.");
  }

  // Group elections need a real electorate to be meaningful — a group with
  // fewer than 3 members can't sustain a nomination + voting flow. Public
  // elections are unaffected.
  if ((data.electionType ?? "public") === "group") {
    if (!data.groupId) throw new BadRequestError("Select a group for a group election");
    const memberCountResult = await db.execute(
      sql`SELECT COUNT(*)::int AS count FROM group_members WHERE group_id=${data.groupId}`
    );
    const memberCountRows = (memberCountResult as any).rows ?? (memberCountResult as any);
    const memberCount = memberCountRows[0]?.count ?? 0;
    if (memberCount < 3) {
      throw new BadRequestError(
        `This group has ${memberCount} member${memberCount === 1 ? "" : "s"}. At least 3 members are required to create an election for a group.`
      );
    }
  }

  let election;
  try {
    [election] = await db.insert(elections).values({ title, description: data.description, electionType: data.electionType ?? "public", groupId: data.groupId ?? null }).returning();
  } catch (err: any) {
    // 23505 = unique_violation — catches the rare race where two requests
    // pass the check above at the same time.
    if (err?.code === "23505") {
      throw new ConflictError("An election with this title already exists. Please choose a different title.");
    }
    throw err;
  }

  await recordAudit(actorId, "ELECTION_CREATED", { electionId: election.id, title: election.title });

  // Group elections also appear in the group's own activity timeline.
  if (data.groupId) {
    const { logGroupActivity } = await import("../lib/groupActivity");
    const actor: any = await db.execute(sql`SELECT full_name FROM users WHERE id=${actorId}`);
    await logGroupActivity({
      groupId: data.groupId,
      type: "election_created",
      actorId,
      actorName: ((actor as any).rows ?? actor)[0]?.full_name ?? "Administrator",
      detail: `Election "${election.title}" was created for this group`,
    });
  }
  return election;
}

/**
 * Sets the voting window (and optionally the nomination deadline) for a draft
 * election.  This is the LAST step of election setup.
 *
 * Two flows are supported:
 *
 * 1. Direct-candidate flow (no nominationDeadline, retained for legacy setup):
 *    Admin adds candidates manually.  The election needs ≥ MIN_CANDIDATES
 *    already in the candidates table before scheduling is allowed.
 *
 * 2. Nomination-invite flow (nominationDeadline provided):
 *    Admin sends nomination requests to voters; they accept/decline before
 *    the deadline.  The candidates count check is skipped here — the
 *    scheduler enforces ≥ MIN_CANDIDATES accepted nominations at activation
 *    time and alerts the admin if there aren't enough.
 *    Every request uses this same deadline. Rule: nominationDeadline ≤ startTime
 *    (voting opens after nominations close).
 */
export async function scheduleElection(
  electionId: string,
  data: {
    startTime: Date;
    endTime: Date;
    nominationDeadline?: Date;
  },
  actorId: string
) {
  const election = await db.query.elections.findFirst({ where: eq(elections.id, electionId) });
  if (!election) throw new NotFoundError("Election not found");

  if (data.nominationDeadline) {
    // Nomination flow — skip the direct-candidate count check and enforce the
    // full allowance → gap → voting timeline instead.
    // validateElectionTiming returns an ARRAY of violations (empty when the
    // timeline is valid). It must be checked with `.length`, never for
    // truthiness — an empty array is truthy and rejected every valid schedule
    // with a 400.
    const violations = validateElectionTiming({
      allowanceStart: new Date(),
      nominationDeadline: data.nominationDeadline,
      startTime: data.startTime,
      endTime: data.endTime,
    });
    if (violations.length > 0) {
      throw new BadRequestError(violations.map((v) => v.message).join(" "));
    }
  } else {
    // Direct-candidate flow — must have ≥ MIN_CANDIDATES already.
    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM candidates WHERE election_id = ${electionId}
    `);
    const countRow = (countResult as any).rows?.[0] ?? (countResult as any)[0];
    const count = Number(countRow?.count ?? 0);

    if (count < MIN_CANDIDATES) {
      throw new BadRequestError(
        `This election needs at least ${MIN_CANDIDATES} candidates before it can be scheduled — it currently has ${count}.`
      );
    }

    const durationMs = data.endTime.getTime() - data.startTime.getTime();
    if (durationMs < MIN_VOTING_MINUTES * MINUTE_MS) {
      throw new BadRequestError(
        `Voting must stay open for at least ${MIN_VOTING_MINUTES} minutes.`
      );
    }
    if (durationMs > MAX_VOTING_MINUTES * MINUTE_MS) {
      throw new BadRequestError("Voting cannot stay open longer than 7 days.");
    }
  }


  // Build the update payload — only include nominationDeadline when the admin
  // actually set one (undefined = direct-candidate flow, leave any existing
  // value untouched).
  const updateFields: Partial<typeof elections.$inferInsert> = {
    startTime: data.startTime,
    endTime: data.endTime,
  };
  if (data.nominationDeadline) {
    updateFields.nominationDeadline = data.nominationDeadline;
    // Reset the alert flag so the scheduler re-evaluates after re-scheduling
    updateFields.nominationAlertSent = false;
  }

  const [updated] = await db
    .update(elections)
    .set(updateFields)
    .where(eq(elections.id, electionId))
    .returning();

  if (data.nominationDeadline) {
    // Keep legacy pending rows aligned with the single election-wide deadline.
    await db.execute(sql`
      UPDATE candidate_requests
      SET expires_at = ${data.nominationDeadline}, updated_at = NOW()
      WHERE election_id = ${electionId} AND status = 'pending'
    `);
  }

  await recordAudit(actorId, "ELECTION_SCHEDULED", {
    electionId,
    nominationDeadline: data.nominationDeadline ?? null,
    startTime: data.startTime,
    endTime: data.endTime,
  });

  // If the chosen start time is already now (or in the past), attempt
  // immediate on-chain activation.  For the nomination flow we skip this —
  // the scheduler will activate once it has confirmed ≥ MIN_CANDIDATES.
  if (data.startTime.getTime() <= Date.now() && !data.nominationDeadline) {
    try {
      const { setElectionOpen } = await import("./blockchain.service");
      await setElectionOpen(true);
      const [activated] = await db
        .update(elections)
        .set({ status: "active" })
        .where(eq(elections.id, electionId))
        .returning();
      await recordAudit(actorId, "ELECTION_STATUS_CHANGED", {
        electionId,
        from: "draft",
        to: "active",
      });
      return activated;
    } catch (err) {
      logger.error("Immediate on-chain activation failed — will retry via scheduler", {
        electionId,
        error: String(err),
      });
    }
  }

  return updated;
}

/**
 * Voters never see hidden elections; admins see everything (hidden
 * elections stay fully visible/manageable on the admin dashboard).
 */
export async function listElections(opts: { includeHidden: boolean; userId?: string } = { includeHidden: false }) {
  if (opts.includeHidden) return db.query.elections.findMany();
  const result = await db.query.elections.findMany({
    // Drafts include future/not-yet-opened elections and are admin-only.
    // Cancelled elections never opened for voting, so voters never see them.
    where: and(
      eq(elections.isHidden, false),
      ne(elections.status, "draft"),
      ne(elections.status, "cancelled")
    ),
  });
  if (!opts.userId) return result.filter((e: any) => e.electionType !== "group");
  const memberships = await db.execute(sql`SELECT group_id FROM group_members WHERE user_id=${opts.userId}`);
  const ids = new Set(((memberships as any).rows ?? memberships).map((r: any) => r.group_id));
  return result.filter((e: any) => e.electionType !== "group" || ids.has(e.groupId));
}

export async function getElectionWithCandidates(electionId: string) {
  const election = await db.query.elections.findFirst({ where: eq(elections.id, electionId) });
  if (!election) throw new NotFoundError("Election not found");

  // Raw query so we pick up new columns even before the Drizzle schema is regenerated
  const candidateRows = await db.execute(sql`
    SELECT
      id,
      election_id,
      name,
      party,
      on_chain_candidate_id,
      voter_user_id,
      photo_url,
      bio,
      qualification,
      supports
    FROM candidates
    WHERE election_id = ${electionId}
    ORDER BY created_at ASC
  `);

  const electionCandidates = ((candidateRows as any).rows ?? (candidateRows as any)).map(
    (r: any) => ({
      id: r.id,
      electionId: r.election_id,
      name: r.name,
      party: r.party ?? null,
      onChainCandidateId: r.on_chain_candidate_id,
      voterUserId: r.voter_user_id ?? null,
      voterId: r.voter_user_id
        ? "VTR-" + (r.voter_user_id as string).replace(/-/g, "").slice(0, 8).toUpperCase()
        : null,
      photoUrl: r.photo_url ?? null,
      bio: r.bio ?? null,
      qualification: r.qualification ?? null,
      supports: r.supports ?? null,
    })
  );

  return { ...election, candidates: electionCandidates };
}

// ── Candidates ────────────────────────────────────────────────────────────────

/**
 * Registers the candidate on-chain first (source of truth for the on-chain id).
 * This is intentionally called only by candidate profile completion now; admins
 * create nomination requests instead of entering candidate details.
 * and only persists the DB row once that succeeds.
 *
 * When voterUserId is provided the candidate is linked to that registered voter
 * and their verified full name is used (the `name` param is ignored).
 */
export async function addCandidate(
  electionId: string,
  data: {
    name: string;
    party?: string;
    voterUserId?: string;
    photoUrl?: string;
    bio?: string;
    qualification?: string;
    supports?: string;
  },
  actorId: string
) {
  const election = await db.query.elections.findFirst({ where: eq(elections.id, electionId) });
  if (!election) throw new NotFoundError("Election not found");

  // Once the voting window has opened, the ballot must be frozen: voters who
  // already cast a vote never saw this candidate as an option, and the
  // on-chain registerCandidate() call has no electionOpen check of its own
  // to fall back on. (An election that's scheduled but hasn't opened yet is
  // still fine to edit — this only blocks once startTime has actually passed.)
  if (election.startTime && new Date(election.startTime).getTime() <= Date.now()) {
    throw new ConflictError(
      "Candidates can't be added once voting has started — the ballot is locked to keep it consistent for every voter."
    );
  }

  // If a voter user is linked, resolve their verified full name
  let resolvedName = data.name.trim();
  if (data.voterUserId) {
    const voter = await db.query.users.findFirst({ where: eq(users.id, data.voterUserId) });
    if (voter) resolvedName = voter.fullName;
  }

  // ── Reject duplicates BEFORE the on-chain call ────────────────────────────
  // registerCandidateOnChain() costs real gas and there's no unregister
  // function in the contract, so duplicates must be caught here, not after.
  if (data.voterUserId) {
    const existingByVoter = await db.query.candidates.findFirst({
      where: (c, { and, eq }) => and(eq(c.electionId, electionId), eq(c.voterUserId, data.voterUserId!)),
    });
    if (existingByVoter) {
      throw new ConflictError("This voter is already registered as a candidate in this election.");
    }
  }

  // Note: candidates are identified by their id (and, for linked voters, by
  // voterUserId) everywhere in the app — the ballot, results, and audit log
  // all key off id, not name. Two different people can share a name (or one
  // person's registered name can coincidentally match another candidate's),
  // and renaming a candidate later shouldn't be blocked by a stale collision
  // either. So name is never treated as a uniqueness key — only "this exact
  // voter is already a candidate in this election" is actually rejected,
  // above.

  const onChainCandidateId = await registerCandidateOnChain(resolvedName);

  const insertResult = await db.execute(sql`
    INSERT INTO candidates
      (election_id, name, party, on_chain_candidate_id, voter_user_id, photo_url, bio, qualification, supports)
    VALUES
      (
        ${electionId},
        ${resolvedName},
        ${data.party ?? null},
        ${onChainCandidateId},
        ${data.voterUserId ?? null},
        ${data.photoUrl ?? null},
        ${data.bio ?? null},
        ${data.qualification ?? null},
        ${data.supports ?? null}
      )
    RETURNING *
  `);

  const candidate = ((insertResult as any).rows ?? (insertResult as any))[0];

  await recordAudit(actorId, "CANDIDATE_ADDED", {
    electionId,
    candidateId: candidate.id,
    onChainCandidateId,
    voterUserId: data.voterUserId ?? null,
  });

  return {
    ...candidate,
    voterId: data.voterUserId
      ? "VTR-" + data.voterUserId.replace(/-/g, "").slice(0, 8).toUpperCase()
      : null,
  };
}

// ── Election settings (admin) ───────────────────────────────────────────────────

async function requireElection(electionId: string) {
  const election = await db.query.elections.findFirst({ where: eq(elections.id, electionId) });
  if (!election) throw new NotFoundError("Election not found");
  return election;
}

/**
 * Human-readable, searchable election ID derived from the UUID — same
 * "PREFIX-8HEXCHARS" convention as the voter ID (see searchVoters above),
 * so admins can search elections the same way they search voters.
 */
export function electionDisplayId(electionId: string): string {
  return "ELC-" + electionId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

/**
 * True once voters can actually see results — either the admin turned live
 * results on at some point, or the scheduled manual release date/time has
 * already passed. This is what triggers "lock visibility" and "start the
 * delete countdown" below, and also gates the voter-facing results endpoint
 * (see results.controller.ts).
 */
export function isResultsPublished(election: {
  liveResultsEnabled: boolean;
  resultsReleaseAt: Date | null;
  resultsPublishedAt: Date | null;
}): boolean {
  if (election.resultsPublishedAt) return true;
  if (election.liveResultsEnabled) return true;
  if (election.resultsReleaseAt && election.resultsReleaseAt.getTime() <= Date.now()) return true;
  return false;
}

/**
 * Hide an election from the voter-facing election list, or reverse that.
 *
 * Rules:
 *  - Once results have been published to voters, visibility is locked —
 *    neither hiding nor un-hiding is allowed anymore (the election is
 *    force-unhidden the moment results go public; see setLiveResults).
 *  - Un-hiding (reversing an earlier hide) additionally requires that the
 *    voting period has finished — an admin can't reveal a hidden election
 *    back into an in-progress vote.
 *  - Hiding itself has no such restriction: an admin may need to pull a
 *    listing at any stage before results are public.
 */
export async function setElectionVisibility(electionId: string, hidden: boolean, actorId: string) {
  const election = await requireElection(electionId);

  if (isResultsPublished(election)) {
    throw new BadRequestError(
      "Visibility can't be changed once results have been published to voters."
    );
  }

  if (!hidden && election.status !== "closed") {
    throw new BadRequestError(
      "This election can't be un-hidden until its voting period has finished."
    );
  }

  const [updated] = await db
    .update(elections)
    .set({ isHidden: hidden })
    .where(eq(elections.id, electionId))
    .returning();

  await recordAudit(actorId, hidden ? "ELECTION_HIDDEN" : "ELECTION_UNHIDDEN", { electionId });

  return updated;
}

/**
 * Turn live results on/off for voters. When off, voters see a
 * "live results not enabled" message on the results page unless a manual
 * resultsReleaseAt date has already passed. Admin analytics are never
 * affected by this toggle.
 *
 * The first time this actually makes results public, it also stamps
 * resultsPublishedAt (starts the 7-day delete countdown — see
 * deleteElection below) and force-unhides the election, since a hidden
 * election shouldn't be hiding results voters are now entitled to see.
 */
export async function setLiveResults(electionId: string, enabled: boolean, actorId: string) {
  const election = await requireElection(electionId);

  const wasPublished = isResultsPublished(election);
  const nowPublishing = enabled && !wasPublished;
  const patch: { liveResultsEnabled: boolean; resultsPublishedAt?: Date; isHidden?: boolean } = {
    liveResultsEnabled: enabled,
  };
  if (nowPublishing) {
    patch.resultsPublishedAt = new Date();
    patch.isHidden = false;
  }

  const [updated] = await db
    .update(elections)
    .set(patch)
    .where(eq(elections.id, electionId))
    .returning();

  await recordAudit(actorId, enabled ? "LIVE_RESULTS_ENABLED" : "LIVE_RESULTS_DISABLED", { electionId });
  if (nowPublishing && election.isHidden) {
    await recordAudit(actorId, "ELECTION_UNHIDDEN", { electionId, reason: "results_published" });
  }
  if (nowPublishing) {
    const { notificationService } = await import("./notification.service");
    await notificationService.notifyElectionParticipants(
      election.id,
      election.title,
      `Results are now available for "${election.title}". View the final verified outcome.`
    );
  }

  return updated;
}

/**
 * Sets (or clears, with resultsReleaseAt = null) the date/time at which
 * results become visible to voters even while live results is off.
 */
export async function setResultsReleaseAt(
  electionId: string,
  resultsReleaseAt: Date | null,
  actorId: string
) {
  const election = await requireElection(electionId);
  if (resultsReleaseAt && (!election.endTime || resultsReleaseAt.getTime() <= election.endTime.getTime())) {
    throw new BadRequestError("Results release date must be after the voting end time.");
  }

  const [updated] = await db
    .update(elections)
    .set({ resultsReleaseAt })
    .where(eq(elections.id, electionId))
    .returning();

  await recordAudit(actorId, "RESULTS_RELEASE_DATE_SET", {
    electionId,
    resultsReleaseAt: resultsReleaseAt ? resultsReleaseAt.toISOString() : null,
  });

  return updated;
}

/**
 * Permanently deletes an election and its DB-side candidates/vote-cache rows.
 * Callers MUST verify step-up auth (password + TOTP) before calling this —
 * see verifyAdminStepUp in auth.service.ts — since this cannot be undone.
 *
 * Gated on a single timing rule, checked here (not just in the UI) so it
 * can't be bypassed by calling the API directly:
 *  - The election must still be in "draft" — i.e. voting has not started
 *    yet. The moment an election goes live (status "active") it is locked:
 *    it can no longer be deleted, whether it's still in progress, closed,
 *    decided-but-not-yet-resulted, or fully resulted. This keeps the
 *    historical record of every election that actually ran intact — an
 *    admin can only ever remove something before the public ever saw it.
 *
 * Note: this only removes the off-chain database records. Votes already
 * recorded on-chain remain part of the blockchain's immutable history; the
 * audit log entry below is what preserves an internal record that the
 * election existed and was deleted, by whom, and when.
 */
export async function deleteElection(electionId: string, actorId: string) {
  const election = await requireElection(electionId);

  if (election.status !== "draft") {
    throw new BadRequestError(
      "This election can no longer be deleted — once voting has started, an election is locked and can only be removed before it starts."
    );
  }

  await recordAudit(actorId, "ELECTION_DELETED", {
    electionId,
    title: election.title,
    status: election.status,
  });

  await db.delete(votesCache).where(eq(votesCache.electionId, electionId));
  await db.delete(candidates).where(eq(candidates.electionId, electionId));
  await db.delete(elections).where(eq(elections.id, electionId));

  return { deleted: true, electionId };
}
