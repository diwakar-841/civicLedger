import { eq, sql } from "drizzle-orm";
import { db, votesCache, candidates, users, elections } from "@voting/database";
import {
  castVoteAsUser,
  checkHasVoted,
  ensureVoterEligible,
  getCandidateCountOnChain,
  registerCandidateOnChain 
} from
"./blockchain.service";
import { getUserPrivateKey } from "./wallet.service";
import { logger } from "../lib/logger";
import { recordAudit } from "../lib/audit";
import { ConflictError, ForbiddenError, NotFoundError, AppError } from "../lib/errors";

let migrationDone = false;

export async function runVoteMigrations() {
  if (migrationDone) {return;}
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
    logger.error("Vote migrations failed — vote deduplication may not work", { error: String(err) });
  }
}

export async function castVote(params)

{

  const user = await db.query.users.findFirst({ where: eq(users.id, params.userId) });
  if (!user?.walletAddress) {
    throw new ForbiddenError(
      "No wallet is linked to your account. Go to Profile → Set Up Wallet to create one automatically."
    );
  }
  if (!user.isVerified) {
    throw new ForbiddenError("You must verify your email address before voting.");
  }

  const election = await db.query.elections.findFirst({ where: eq(elections.id, params.electionId) });
  if (!election) {throw new NotFoundError("Election not found.");}
  if (election.electionType === "group") {
    const member = await db.execute(sql`SELECT 1 FROM group_members WHERE group_id=${election.groupId} AND user_id=${params.userId} LIMIT 1`);
    if (!(member.rows ?? member).length) {throw new ForbiddenError("Only members of this election group may vote.");}
  }
  const now = Date.now();
  if (
  election.status !== "active" ||
  !election.startTime ||
  !election.endTime ||
  now < election.startTime.getTime() ||
  now >= election.endTime.getTime())
  {
    throw new AppError("Voting is not currently open for this election.", 400);
  }

  const candidate = await db.query.candidates.findFirst({ where: eq(candidates.id, params.candidateId) });
  if (!candidate || candidate.electionId !== params.electionId) {
    throw new NotFoundError("Candidate not found for this election.");
  }
  if (candidate.onChainCandidateId == null) {
    throw new AppError("This candidate has not been registered on the blockchain yet.", 400);
  }

  const dupRows = await db.execute(sql`
    SELECT id FROM votes_cache
    WHERE election_id = ${params.electionId}
      AND voter_user_id = ${params.userId}
    LIMIT 1
  `);
  const dup = dupRows.rows?.[0] ?? dupRows[0];
  if (dup) {
    throw new ConflictError(
      "You have already voted in this election. Each voter may only vote once."
    );
  }

  const privateKey = await getUserPrivateKey(params.userId);
  if (!privateKey) {
    throw new ForbiddenError(
      "Your wallet was linked externally and cannot be used for server-side voting. " +
      "Please contact support or re-link via the auto-generate option."
    );
  }

  await ensureVoterEligible(user.walletAddress);

  let onChainCandidateId = candidate.onChainCandidateId;
  try {
    const onChainCount = await getCandidateCountOnChain();
    if (onChainCandidateId > onChainCount) {
      logger.warn("Candidate onChainCandidateId is stale — re-registering on-chain", {
        candidateId: candidate.id,
        staleOnChainCandidateId: onChainCandidateId,
        onChainCount
      });
      onChainCandidateId = await registerCandidateOnChain(candidate.name);
      await db.
      update(candidates).
      set({ onChainCandidateId }).
      where(eq(candidates.id, candidate.id));
      logger.info("Re-registered candidate on-chain and updated DB", {
        candidateId: candidate.id,
        newOnChainCandidateId: onChainCandidateId
      });
    }
  } catch (err) {

    logger.warn("Could not verify on-chain candidate count — proceeding as-is", {
      candidateId: candidate.id,
      error: String(err)
    });
  }

  const { txHash, blockNumber } = await castVoteAsUser(privateKey, onChainCandidateId);

  const insertResult = await db.execute(sql`
    INSERT INTO votes_cache (election_id, candidate_id, tx_hash, block_number, voter_user_id)
    VALUES (${params.electionId}, ${params.candidateId}, ${txHash}, ${blockNumber}, ${params.userId})
    RETURNING *
  `);
  const cached = insertResult.rows?.[0] ?? insertResult[0];

  await recordAudit(
    params.userId,
    "VOTE_CONFIRMED",
    { electionId: params.electionId, candidateId: params.candidateId },
    txHash,
    params.ipAddress
  );

  logger.info("Vote cast and cached", { txHash, voter: user.walletAddress });
  return { ...cached, txHash };
}

export async function getMyVoteStatus(params)

{

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
  const row = rows.rows?.[0] ?? rows[0];

  if (row) {
    return {
      hasVoted: true,
      vote: {
        candidateId: row.candidate_id,
        candidateName: row.candidate_name,
        candidateParty: row.candidate_party ?? null,
        txHash: row.tx_hash,
        blockNumber: Number(row.block_number),
        votedAt: row.voted_at
      }
    };
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, params.userId) });
  if (!user?.walletAddress) {return { hasVoted: false };}

  const { hasVoted } = await checkHasVoted(user.walletAddress);
  return { hasVoted };
}

export async function confirmVote(_params)

{
  throw new AppError(
    "Client-side wallet voting is no longer supported. " +
    "Use the server-managed wallet flow — no wallet app required.",
    410
  );
}