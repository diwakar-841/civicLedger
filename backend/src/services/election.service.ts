import { db, elections, candidates, users, votesCache } from "@voting/database";
import { eq, and, ne, sql } from "drizzle-orm";
import { NotFoundError, BadRequestError, ConflictError } from "../lib/errors";
import { registerCandidateOnChain } from "./blockchain.service";
import { recordAudit } from "../lib/audit";
import { logger } from "../lib/logger";
import { rowsOf } from "../lib/dbRows";
import {
  MIN_VOTING_MINUTES,
  MAX_VOTING_MINUTES,
  MINUTE_MS,
  validateElectionTiming 
} from
"../lib/electionTiming";

let candidateMigrationDone = false;

export async function runCandidateMigrations() {
  if (candidateMigrationDone) {return;}
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

let electionMigrationDone = false;

export async function runElectionMigrations() {
  if (electionMigrationDone) {return;}
  try {
    await db.execute(sql`ALTER TABLE elections ALTER COLUMN start_time DROP NOT NULL`);
    await db.execute(sql`ALTER TABLE elections ALTER COLUMN end_time DROP NOT NULL`);
    await db.execute(sql`ALTER TABLE elections ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false`);
    await db.execute(sql`ALTER TABLE elections ADD COLUMN IF NOT EXISTS live_results_enabled BOOLEAN NOT NULL DEFAULT false`);
    await db.execute(sql`ALTER TABLE elections ADD COLUMN IF NOT EXISTS results_release_at TIMESTAMP`);
    await db.execute(sql`ALTER TABLE elections ADD COLUMN IF NOT EXISTS results_published_at TIMESTAMP`);
    await db.execute(sql`ALTER TABLE elections ADD COLUMN IF NOT EXISTS nomination_deadline TIMESTAMP`);
    await db.execute(sql`ALTER TABLE elections ADD COLUMN IF NOT EXISTS nomination_alert_sent BOOLEAN NOT NULL DEFAULT false`);

    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS elections_title_unique_idx ON elections (LOWER(title))`
    );
    electionMigrationDone = true;
    logger.info("Election migrations applied (start/end nullable; visibility + results-disclosure + nomination columns ensured)");
  } catch (err) {
    logger.error("Election migrations failed", { error: String(err) });
  }
}

export const MIN_CANDIDATES = 2;
export const MIN_ELECTION_MINUTES = 10;

export async function searchVoters(query) {
  const q = query.trim();
  if (!q || q.length < 2) {return [];}

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

  return rowsOf(rows).map((u) => {return {
      id: u.id,
      fullName: u.full_name,

      voterId: "VTR-" + (u.id as string).replace(/-/g, "").slice(0, 8).toUpperCase(),
      walletLinked: Boolean(u.wallet_address),
      photoUrl: u.profile_photo_url ?? null
    };});
}

function toDisplayId(prefix, id) {
  return `${prefix}-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function bareIdQuery(q) {
  return q.replace(/^[a-z]{2,4}-/i, "").replace(/-/g, "");
}

export type AdminSearchType = "all" | "election" | "user" | "admin" | "group";

export async function adminSearch(
query,
type: AdminSearchType = "all",
isAdmin = true,
userId)
{
  const q = query.trim();
  if (!q || q.length < 2) {return { elections: [], users: [], admins: [], groups: [] };}

  const idFragment = bareIdQuery(q);
  const like = `%${q}%`;

  const [electionRows, userRows, adminRows, groupRows] = await Promise.all([
  type === "all" || type === "election" ?
  db.execute(
    isAdmin ?
    sql`
                SELECT id, title, status, is_hidden, start_time, end_time
                FROM elections
                WHERE LOWER(title) LIKE LOWER(${like})
                   OR REPLACE(id::text, '-', '') ILIKE ${idFragment + "%"}
                ORDER BY title
                LIMIT 10
              ` :

    sql`
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
  ) :
  Promise.resolve({ rows: [] }),
  type === "all" || type === "group" ?
  db.execute(sql`SELECT id, name FROM groups WHERE LOWER(name) LIKE LOWER(${like}) ORDER BY name LIMIT 10`) :
  Promise.resolve({ rows: [] }),
  type === "all" || type === "user" ?
  db.execute(sql`
          SELECT id, full_name, email, is_verified
          FROM users
          WHERE role = 'voter'
            AND (
              LOWER(full_name) LIKE LOWER(${like})
              OR REPLACE(id::text, '-', '') ILIKE ${idFragment + "%"}
            )
          ORDER BY full_name
          LIMIT 10
        `) :
  Promise.resolve({ rows: [] }),
  type === "all" || type === "admin" ?
  db.execute(sql`
          SELECT id, full_name, email
          FROM users
          WHERE role = 'admin'
            AND (
              LOWER(full_name) LIKE LOWER(${like})
              OR REPLACE(id::text, '-', '') ILIKE ${idFragment + "%"}
            )
          ORDER BY full_name
          LIMIT 10
        `) :
  Promise.resolve({ rows: [] })]
  );

  const elRows = rowsOf(electionRows);
  const usrRows = rowsOf(userRows);
  const admRows = rowsOf(adminRows);
  const grpRows = rowsOf(groupRows);

  return {
    elections: elRows.map((e) => {return {
        kind: "election",
        id: e.id,
        displayId: toDisplayId("ELC", e.id),
        title: e.title,
        status: e.status,
        isHidden: e.is_hidden,
        startTime: e.start_time,
        endTime: e.end_time
      };}),
    users: usrRows.map((u) => {return {
        kind: "user",
        id: u.id,
        displayId: toDisplayId("VTR", u.id),
        fullName: u.full_name,
        email: u.email,
        isVerified: u.is_verified
      };}),
    admins: admRows.map((a) => {return {
        kind: "admin",
        id: a.id,
        displayId: toDisplayId("ADM", a.id),
        fullName: a.full_name,
        email: a.email
      };}),
    groups: grpRows.map((g) => {return { kind: "group", id: g.id, displayId: toDisplayId("GRP", g.id), name: g.name };})
  };
}

export async function createElection(
data,
actorId)
{
  const title = data.title.trim();

  const dupResult = await db.execute(
    sql`SELECT id FROM elections WHERE LOWER(title) = LOWER(${title}) LIMIT 1`
  );
  const dupRows = rowsOf(dupResult);
  if (dupRows.length > 0) {
    throw new ConflictError("An election with this title already exists. Please choose a different title.");
  }

  if ((data.electionType ?? "public") === "group") {
    if (!data.groupId) {throw new BadRequestError("Select a group for a group election");}
    const memberCountResult = await db.execute(
      sql`SELECT COUNT(*)::int AS count FROM group_members WHERE group_id=${data.groupId}`
    );
    const memberCountRows = memberCountResult.rows ?? memberCountResult;
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
  } catch (err) {

    if (err?.code === "23505") {
      throw new ConflictError("An election with this title already exists. Please choose a different title.");
    }
    throw err;
  }

  await recordAudit(actorId, "ELECTION_CREATED", { electionId: election.id, title: election.title });

  if (data.groupId) {
    const { logGroupActivity } = await import("../lib/groupActivity");
    const actor = await db.execute(sql`SELECT full_name FROM users WHERE id=${actorId}`);
    await logGroupActivity({
      groupId: data.groupId,
      type: "election_created",
      actorId,
      actorName: (actor.rows ?? actor)[0]?.full_name ?? "Administrator",
      detail: `Election "${election.title}" was created for this group`
    });
  }
  return election;
}

export async function scheduleElection(
electionId,
data,

actorId)
{
  const election = await db.query.elections.findFirst({ where: eq(elections.id, electionId) });
  if (!election) {throw new NotFoundError("Election not found");}

  if (data.nominationDeadline) {

    const violations = validateElectionTiming({
      allowanceStart: new Date(),
      nominationDeadline: data.nominationDeadline,
      startTime: data.startTime,
      endTime: data.endTime
    });
    if (violations.length > 0) {
      throw new BadRequestError(violations.map((v) => {return v.message;}).join(" "));
    }
  } else {

    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM candidates WHERE election_id = ${electionId}
    `);
    const countRow = countResult.rows?.[0] ?? countResult[0];
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

  const updateFields: {
    startTime: Date;
    endTime: Date;
    nominationDeadline?: Date;
    nominationAlertSent?: boolean;
  } = {
    startTime: data.startTime,
    endTime: data.endTime
  };
  if (data.nominationDeadline) {
    updateFields.nominationDeadline = data.nominationDeadline;

    updateFields.nominationAlertSent = false;
  }

  const [updated] = await db.
  update(elections).
  set(updateFields).
  where(eq(elections.id, electionId)).
  returning();

  if (data.nominationDeadline) {

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
    endTime: data.endTime
  });

  if (data.startTime.getTime() <= Date.now() && !data.nominationDeadline) {
    try {
      const { setElectionOpen } = await import("./blockchain.service");
      await setElectionOpen(true);
      const [activated] = await db.
      update(elections).
      set({ status: "active" }).
      where(eq(elections.id, electionId)).
      returning();
      await recordAudit(actorId, "ELECTION_STATUS_CHANGED", {
        electionId,
        from: "draft",
        to: "active"
      });
      return activated;
    } catch (err) {
      logger.error("Immediate on-chain activation failed — will retry via scheduler", {
        electionId,
        error: String(err)
      });
    }
  }

  return updated;
}

export interface ElectionListOptions {
  includeHidden?: boolean;
  userId?: string;
}

export async function listElections(
  opts: ElectionListOptions = { includeHidden: false }
) {
  if (opts.includeHidden) {return db.query.elections.findMany();}
  const result = await db.query.elections.findMany({

    where: and(
      eq(elections.isHidden, false),
      ne(elections.status, "draft"),
      ne(elections.status, "cancelled")
    )
  });
  if (!opts.userId) {return result.filter((e) => {return e.electionType !== "group";});}
  const memberships = await db.execute(sql`SELECT group_id FROM group_members WHERE user_id=${opts.userId}`);
  const ids = new Set(rowsOf(memberships).map((r) => {return r.group_id;}));
  return result.filter((e) => {return e.electionType !== "group" || ids.has(e.groupId);});
}

export async function getElectionWithCandidates(electionId) {
  const election = await db.query.elections.findFirst({ where: eq(elections.id, electionId) });
  if (!election) {throw new NotFoundError("Election not found");}

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

  const electionCandidates = rowsOf(candidateRows).map(
    (r) => {return {
        id: r.id,
        electionId: r.election_id,
        name: r.name,
        party: r.party ?? null,
        onChainCandidateId: r.on_chain_candidate_id,
        voterUserId: r.voter_user_id ?? null,
        voterId: r.voter_user_id ?
        "VTR-" + (r.voter_user_id as string).replace(/-/g, "").slice(0, 8).toUpperCase() :
        null,
        photoUrl: r.photo_url ?? null,
        bio: r.bio ?? null,
        qualification: r.qualification ?? null,
        supports: r.supports ?? null
      };}
  );

  return { ...election, candidates: electionCandidates };
}

export async function addCandidate(
electionId,
data,

actorId)
{
  const election = await db.query.elections.findFirst({ where: eq(elections.id, electionId) });
  if (!election) {throw new NotFoundError("Election not found");}

  if (election.startTime && new Date(election.startTime).getTime() <= Date.now()) {
    throw new ConflictError(
      "Candidates can't be added once voting has started — the ballot is locked to keep it consistent for every voter."
    );
  }

  let resolvedName = data.name.trim();
  if (data.voterUserId) {
    const voter = await db.query.users.findFirst({ where: eq(users.id, data.voterUserId) });
    if (voter) {resolvedName = voter.fullName;}
  }

  if (data.voterUserId) {
    const existingByVoter = await db.query.candidates.findFirst({ where: (c, { and, eq }) => {return and(eq(c.electionId, electionId), eq(c.voterUserId, data.voterUserId));} });
    if (existingByVoter) {
      throw new ConflictError("This voter is already registered as a candidate in this election.");
    }
  }

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

  const candidate = (insertResult.rows ?? insertResult)[0];

  await recordAudit(actorId, "CANDIDATE_ADDED", {
    electionId,
    candidateId: candidate.id,
    onChainCandidateId,
    voterUserId: data.voterUserId ?? null
  });

  return {
    ...candidate,
    voterId: data.voterUserId ?
    "VTR-" + data.voterUserId.replace(/-/g, "").slice(0, 8).toUpperCase() :
    null
  };
}

async function requireElection(electionId) {
  const election = await db.query.elections.findFirst({ where: eq(elections.id, electionId) });
  if (!election) {throw new NotFoundError("Election not found");}
  return election;
}

export function electionDisplayId(electionId) {
  return "ELC-" + electionId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function isResultsPublished(election)

{
  if (election.resultsPublishedAt) {return true;}
  if (election.liveResultsEnabled) {return true;}
  if (election.resultsReleaseAt && election.resultsReleaseAt.getTime() <= Date.now()) {return true;}
  return false;
}

export async function setElectionVisibility(electionId, hidden, actorId) {
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

  const [updated] = await db.
  update(elections).
  set({ isHidden: hidden }).
  where(eq(elections.id, electionId)).
  returning();

  await recordAudit(actorId, hidden ? "ELECTION_HIDDEN" : "ELECTION_UNHIDDEN", { electionId });

  return updated;
}

export async function setLiveResults(electionId, enabled, actorId) {
  const election = await requireElection(electionId);

  const wasPublished = isResultsPublished(election);
  const nowPublishing = enabled && !wasPublished;
  const patch: {
    liveResultsEnabled: boolean;
    resultsPublishedAt?: Date;
    isHidden?: boolean;
  } = { liveResultsEnabled: enabled };
  if (nowPublishing) {
    patch.resultsPublishedAt = new Date();
    patch.isHidden = false;
  }

  const [updated] = await db.
  update(elections).
  set(patch).
  where(eq(elections.id, electionId)).
  returning();

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

export async function setResultsReleaseAt(
electionId,
resultsReleaseAt,
actorId)
{
  const election = await requireElection(electionId);
  if (resultsReleaseAt && (!election.endTime || resultsReleaseAt.getTime() <= election.endTime.getTime())) {
    throw new BadRequestError("Results release date must be after the voting end time.");
  }

  const [updated] = await db.
  update(elections).
  set({ resultsReleaseAt }).
  where(eq(elections.id, electionId)).
  returning();

  await recordAudit(actorId, "RESULTS_RELEASE_DATE_SET", {
    electionId,
    resultsReleaseAt: resultsReleaseAt ? resultsReleaseAt.toISOString() : null
  });

  return updated;
}

export async function deleteElection(electionId, actorId) {
  const election = await requireElection(electionId);

  if (election.status !== "draft") {
    throw new BadRequestError(
      "This election can no longer be deleted — once voting has started, an election is locked and can only be removed before it starts."
    );
  }

  await recordAudit(actorId, "ELECTION_DELETED", {
    electionId,
    title: election.title,
    status: election.status
  });

  await db.delete(votesCache).where(eq(votesCache.electionId, electionId));
  await db.delete(candidates).where(eq(candidates.electionId, electionId));
  await db.delete(elections).where(eq(elections.id, electionId));

  return { deleted: true, electionId };
}