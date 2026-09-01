import { eq } from "drizzle-orm";
import { db, votesCache, candidates, elections } from "@voting/database";
import { NotFoundError } from "../lib/errors";

export async function getElectionSummary(electionId) {
  const election = await db.query.elections.findFirst({ where: eq(elections.id, electionId) });
  if (!election) {throw new NotFoundError("Election not found");}

  const electionCandidates = await db.query.candidates.findMany({ where: eq(candidates.electionId, electionId) });

  const votes = await db.query.votesCache.findMany({ where: eq(votesCache.electionId, electionId) });

  const totalVotesCast = votes.length;

  const votesPerCandidate = {};
  for (const v of votes) {
    votesPerCandidate[v.candidateId] = (votesPerCandidate[v.candidateId] ?? 0) + 1;
  }

  const candidateResults = electionCandidates.map((c) => {
    const candidateVotes = votesPerCandidate[c.id] ?? 0;
    const percent = totalVotesCast > 0 ? candidateVotes / totalVotesCast * 100 : 0;
    return {
      id: c.id,
      name: c.name,
      party: c.party ?? null,
      votes: candidateVotes,
      percent: Math.round(percent * 100) / 100
    };
  });

  return {
    electionId: election.id,
    status: election.status,
    totalVotesCast,
    candidates: candidateResults
  };
}