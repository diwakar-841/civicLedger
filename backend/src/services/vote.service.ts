import { eq, sql } from "drizzle-orm";
import { db, votesCache, candidates, users, elections } from "@voting/database";
import {
  castVoteAsUser,
  checkHasVoted,
  ensureVoterEligible,
  getCandidateCountOnChain,
  registerCandidateOnChain,
} from "./blockchain.service";
import { getUserPrivateKey } from "./wallet.service";
import { logger } from "../lib/logger";
import { recordAudit } from "../lib/audit";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  AppError,
} from "../lib/errors";

let migrationDone = false;

export async function runVoteMigrations(): Promise<void> {
  if (migrationDone) return;
  try {
    await db.execute(sql`
      ALTER TABLE votes_cache
        ADD COLUMN IF NOT EXISTS voter_user_id UUID REFERENCES users(id) ON DELETE SET NULL
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_votes_cache_voter_election
        ON votes_cache (voter_user_id, election_id)
    `);
    migrationDone = true;
    logger.info("Vote migrations applied (voter_user_id column ensured)");
  } catch (err) {
    logger.error("Vote migrations failed — vote deduplication may not work", {
      error: String(err),
    });
    return;
  }

  // DB-level "one vote per voter per election" guarantee. Separate from the
  // block above because it fails if historical duplicate rows already exist,
  // and that must not be reported as the column migration failing.
  try {
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_votes_cache_election_voter
        ON votes_cache (election_id, voter_user_id)
        WHERE voter_user_id IS NOT NULL
    `);
  } catch (err) {
    logger.error(
      "Could not create unique (election_id, voter_user_id) index on votes_cache — duplicate rows probably exist and must be cleaned up manually",
      { error: String(err) },
    );
  }
}

// A user double-clicking "Confirm vote" (or two tabs) used to start two
// castVote() runs in parallel: both passed the "already voted?" SELECT before
// either had inserted a row, and the loser burned gas on a reverting
// transaction. Serialise per (user, election) inside this process.
const votesInFlight = new Set<string>();

// ── Cast vote ─────────────────────────────────────────────────────────────────

/**
 * Cast a vote entirely server-side.
 *
 *   1. Validates user eligibility.
 *   2. Checks the DB cache so we never hit the blockchain for a duplicate.
 *   3. Decrypts the user's server-managed private key.
 *   4. Signs and broadcasts the castVote() transaction.
 *   5. Caches the result in votes_cache with voter_user_id so the frontend
 *      can display "Voted successfully" on every subsequent load.
 */
export async function castVote(params: {
  userId: string;
  electionId: string;
  candidateId: string;
  ipAddress?: string;
}) {
  const flightKey = `${params.userId}:${params.electionId}`;
  if (votesInFlight.has(flightKey)) {
    throw new ConflictError(
      "Your vote is already being processed. Please wait a moment.",
    );
  }
  votesInFlight.add(flightKey);
  try {
    return await castVoteInner(params);
  } finally {
    votesInFlight.delete(flightKey);
  }
}

async function castVoteInner(params: {
  userId: string;
  electionId: string;
  candidateId: string;
  ipAddress?: string;
}) {
  // ── 1. Load & validate user ──────────────────────────────────────────────
  const user = await db.query.users.findFirst({
    where: eq(users.id, params.userId),
  });
  if (!user?.walletAddress) {
    throw new ForbiddenError(
      "No wallet is linked to your account. Go to Profile → Set Up Wallet to create one automatically.",
    );
  }
  if (!user.isVerified) {
    throw new ForbiddenError(
      "You must verify your email address before voting.",
    );
  }
  // ── 2. Enforce the voting window server-side ─────────────────────────────
  // The blockchain's global switch and the frontend are not sufficient guards:
  // every vote must belong to an active election and arrive inside its window.
  const election = await db.query.elections.findFirst({
    where: eq(elections.id, params.electionId),
  });
  if (!election) throw new NotFoundError("Election not found.");
  if (election.electionType === "group") {
    const member = await db.execute(
      sql`SELECT 1 FROM group_members WHERE group_id=${election.groupId} AND user_id=${params.userId} LIMIT 1`,
    );
    if (!((member as any).rows ?? member).length)
      throw new ForbiddenError("Only members of this election group may vote.");
  }
  const now = Date.now();
  if (
    election.status !== "active" ||
    !election.startTime ||
    !election.endTime ||
    now < election.startTime.getTime() ||
    now >= election.endTime.getTime()
  ) {
    throw new AppError("Voting is not currently open for this election.", 400);
  }

  const candidate = await db.query.candidates.findFirst({
    where: eq(candidates.id, params.candidateId),
  });
  if (!candidate || candidate.electionId !== params.electionId) {
    throw new NotFoundError("Candidate not found for this election.");
  }
  if (candidate.onChainCandidateId == null) {
    throw new AppError(
      "This candidate has not been registered on the blockchain yet.",
      400,
    );
  }

  const dupRows = await db.execute(sql`
    SELECT id FROM votes_cache
    WHERE election_id = ${params.electionId}
      AND voter_user_id = ${params.userId}
    LIMIT 1
  `);
  const dup = (dupRows as any).rows?.[0] ?? (dupRows as any)[0];
  if (dup) {
    throw new ConflictError(
      "You have already voted in this election. Each voter may only vote once.",
    );
  }

  // ── 4. Get decrypted private key ─────────────────────────────────────────
  const privateKey = await getUserPrivateKey(params.userId);
  if (!privateKey) {
    throw new ForbiddenError(
      "Your wallet was linked externally and cannot be used for server-side voting. " +
        "Please contact support or re-link via the auto-generate option.",
    );
  }

  // ── 5. Self-heal on-chain eligibility, then sign & send ──────────────────
  // Postgres saying `walletAddress` is set only means the wallet was

  await ensureVoterEligible(user.walletAddress);

  let onChainCandidateId = candidate.onChainCandidateId;
  try {
    const onChainCount = await getCandidateCountOnChain();
    if (onChainCandidateId > onChainCount) {
      logger.warn(
        "Candidate onChainCandidateId is stale — re-registering on-chain",
        {
          candidateId: candidate.id,
          staleOnChainCandidateId: onChainCandidateId,
          onChainCount,
        },
      );
      onChainCandidateId = await registerCandidateOnChain(candidate.name);
      await db
        .update(candidates)
        .set({ onChainCandidateId })
        .where(eq(candidates.id, candidate.id));
      logger.info("Re-registered candidate on-chain and updated DB", {
        candidateId: candidate.id,
        newOnChainCandidateId: onChainCandidateId,
      });
    }
  } catch (err) {
    logger.warn(
      "Could not verify on-chain candidate count — proceeding as-is",
      {
        candidateId: candidate.id,
        error: String(err),
      },
    );
  }

  const { txHash, blockNumber } = await castVoteAsUser(
    privateKey,
    onChainCandidateId,
  );

  // The blockchain event indexer listens for the very same VoteCast event and
  // may insert this tx's row between `tx.wait()` returning and this INSERT.
  // A plain INSERT then fails on the unique tx_hash and the voter gets a 500
  // for a vote that WAS recorded. Upsert instead, making sure the row ends up
  // linked to this user.
  let insertResult;
  try {
    insertResult = await db.execute(sql`
      INSERT INTO votes_cache (election_id, candidate_id, tx_hash, block_number, voter_user_id)
      VALUES (${params.electionId}, ${params.candidateId}, ${txHash}, ${blockNumber}, ${params.userId})
      ON CONFLICT (tx_hash) DO UPDATE
        SET voter_user_id = COALESCE(votes_cache.voter_user_id, EXCLUDED.voter_user_id)
      RETURNING *
    `);
  } catch (err: any) {
    // 23505 on the (election_id, voter_user_id) index: this voter already has
    // a recorded vote for the election.
    if (err?.code === "23505") {
      throw new ConflictError(
        "You have already voted in this election. Each voter may only vote once.",
      );
    }
    throw err;
  }
  const cached = (insertResult as any).rows?.[0] ?? (insertResult as any)[0];

  await recordAudit(
    params.userId,
    "VOTE_CONFIRMED",
    { electionId: params.electionId, candidateId: params.candidateId },
    txHash,
    params.ipAddress,
  );

  logger.info("Vote cast and cached", { txHash, voter: user.walletAddress });
  return { ...cached, txHash };
}

// ── Vote status ───────────────────────────────────────────────────────────────

/**
 * Returns whether the authenticated user has voted in the given election.
 *
 * The DB cache is the primary source of truth (fast).
 * Falls back to an on-chain hasVoted() call when the DB row is missing
 * (e.g. first time after a DB reset before any vote is cast).
 *
 * Response shape:
 *   { hasVoted: false }
 *   { hasVoted: true, vote: { candidateId, candidateName, candidateParty, txHash, blockNumber } }
 */
export async function getMyVoteStatus(params: {
  userId: string;
  electionId: string;
}) {
  // Fast path: DB cache with candidate join
  const rows = await db.execute(sql`
    SELECT vc.id,
           vc.candidate_id,
           vc.tx_hash,
           vc.block_number,
           vc.voted_at,
           c.name  AS candidate_name,
           c.party AS candidate_party
    FROM   votes_cache vc
    LEFT   JOIN candidates c ON c.id = vc.candidate_id
    WHERE  vc.election_id   = ${params.electionId}
      AND  vc.voter_user_id = ${params.userId}
    LIMIT  1
  `);
  const row = (rows as any).rows?.[0] ?? (rows as any)[0];

  if (row) {
    return {
      hasVoted: true,
      vote: {
        candidateId: row.candidate_id,
        candidateName: row.candidate_name,
        candidateParty: row.candidate_party ?? null,
        txHash: row.tx_hash,
        blockNumber: Number(row.block_number),
        votedAt: row.voted_at,
      },
    };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, params.userId),
  });
  if (!user?.walletAddress) return { hasVoted: false };

  const { hasVoted } = await checkHasVoted(user.walletAddress);
  return { hasVoted };
}

export async function confirmVote(_params: {
  userId: string;
  electionId: string;
  candidateId: string;
  txHash: string;
  ipAddress?: string;
}) {
  throw new AppError(
    "Client-side wallet voting is no longer supported. " +
      "Use the server-managed wallet flow — no wallet app required.",
    410,
  );
}
