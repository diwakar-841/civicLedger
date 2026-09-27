import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertTriangle, Users, Search } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { Spinner } from "../components/shared/Spinner";
import { StatusBadge } from "../components/shared/Badge";
import { CandidateCard } from "../components/voting/CandidateCard";
import { CandidateDetailsModal } from "../components/voting/CandidateDetailModal";
import { WalletConnectPanel } from "../components/voting/WalletConnectPanel";
import { VoteAuthModal } from "../components/voting/VoteAuthModal";
import { useElection, deriveStatus } from "../hooks/useElections";
import { useAuthContext } from "../contexts/AuthContext";
import { useCastVote } from "../hooks/useCastVote";
import { useVoteStatus } from "../hooks/useVoteStatus";
import { useToast } from "../contexts/ToastContext";
import { formatError } from "../lib/formatError";

const STEP_LABEL: Record<string, string> = {
  submitting: "Submitting your vote…",
  confirming: "Waiting for blockchain confirmation…",
};

export function BallotPage() {
  const { id } = useParams();
  const { election, loading, error } = useElection(id);
  const { user } = useAuthContext();
  const { castVote, loading: voting, step } = useCastVote();
  const { status: voteStatus, loading: voteStatusLoading } = useVoteStatus(id);
  const { show } = useToast();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [detailsCandidateId, setDetailsCandidateId] = useState<string | null>(
    null,
  );
  const [candidateQuery, setCandidateQuery] = useState("");

  useEffect(() => {
    if (
      !id ||
      !election ||
      voteStatusLoading ||
      !voteStatus?.hasVoted ||
      !voteStatus.vote
    )
      return;
    const v = voteStatus.vote;
    navigate(`/elections/${id}/confirmation`, {
      replace: true,
      state: {
        candidateName: v.candidateName,
        electionTitle: election.title,
        txHash: v.txHash,
        blockNumber: v.blockNumber,
        timestamp: v.votedAt,
      },
    });
  }, [id, election, voteStatusLoading, voteStatus, navigate]);

  if (
    loading ||
    voteStatusLoading ||
    (voteStatus?.hasVoted && voteStatus.vote)
  ) {
    return (
      <Layout>
        <Spinner label="Loading ballot" />
      </Layout>
    );
  }

  if (error || !election) {
    return (
      <Layout>
        <Card className="p-8 text-center text-navy-500">
          Could not load this election.
        </Card>
      </Layout>
    );
  }

  const status = deriveStatus(election);
  const candidate = election.candidates?.find((c) => c.id === selected) ?? null;
  const detailsCandidate =
    election.candidates?.find((c) => c.id === detailsCandidateId) ?? null;

  const nameCounts = (election.candidates ?? []).reduce<Record<string, number>>(
    (acc, c) => ({
      ...acc,
      [c.name.toLowerCase()]: (acc[c.name.toLowerCase()] ?? 0) + 1,
    }),
    {},
  );
  const selectedNameIsDuplicated =
    candidate !== null && nameCounts[candidate.name.toLowerCase()] > 1;
  const sameNameCandidates = selectedNameIsDuplicated
    ? (election.candidates ?? []).filter(
        (c) => c.name.toLowerCase() === candidate!.name.toLowerCase(),
      )
    : [];

  const trimmedQuery = candidateQuery.trim().toLowerCase();
  const visibleCandidates = (election.candidates ?? []).filter((c) => {
    if (!trimmedQuery) return true;
    return (
      c.name.toLowerCase().includes(trimmedQuery) ||
      (c.voterId ?? "").toLowerCase().includes(trimmedQuery)
    );
  });

  async function handleVoteAuth(voteToken: string) {
    setShowAuthModal(false);
    if (!candidate || !election) return;
    try {
      await castVote(election.id, candidate.id, voteToken);
      navigate(`/elections/${election.id}/confirmation`, {
        state: {
          candidateName: candidate.name,
          candidateParty: candidate.party,
          candidateVoterId: candidate.voterId,
        },
      });
    } catch (err) {
      show(formatError(err, "Your vote could not be submitted"), "error");
    }
  }

  const canVote = status === "active" && Boolean(user?.walletAddress);

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow mb-2 text-indigo-600">Live ballot</p>
            <h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">
              {election.title}
            </h1>
            {election.description && (
              <p className="mt-1 text-navy-500">{election.description}</p>
            )}
          </div>
          {}
          {status === "active" && <StatusBadge status={status} />}
        </div>

        {status !== "active" && (
          <Card className="mb-6 flex items-start gap-3 border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              {status === "draft"
                ? "Voting hasn't opened for this election yet."
                : "Voting has closed for this election."}
            </p>
          </Card>
        )}

        {status === "active" && !user?.walletAddress && (
          <div className="mb-6">
            <WalletConnectPanel />
          </div>
        )}

        {status === "active" &&
          !user?.isBiometricRegistered &&
          !user?.hasVotingPin && (
            <Card className="mb-6 flex items-start gap-3 border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                You need a way to confirm your vote — set up a{" "}
                <button
                  type="button"
                  onClick={() => navigate("/pin-setup")}
                  className="font-semibold underline underline-offset-2"
                >
                  Voting PIN
                </button>{" "}
                or biometric login before voting.
              </p>
            </Card>
          )}

        <Card className="p-6 sm:p-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-navy-400">
            Choose a candidate
          </h2>

          {(election.candidates?.length ?? 0) > 1 && (
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
              <input
                value={candidateQuery}
                onChange={(e) => setCandidateQuery(e.target.value)}
                placeholder="Search candidates by name or voter ID"
                className="focus-ring w-full rounded-xl border border-navy-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm"
              />
            </div>
          )}

          <div className="flex flex-col gap-3">
            {visibleCandidates.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                selected={selected === c.id}
                onSelect={() => setSelected(c.id)}
                onViewDetails={() => setDetailsCandidateId(c.id)}
                disabled={!canVote || (!user?.isBiometricRegistered && !user?.hasVotingPin)}
              />
            ))}
            {visibleCandidates.length === 0 && (
              <p className="rounded-xl border border-navy-100 bg-navy-50 py-6 text-center text-sm text-navy-400">
                No candidates match &ldquo;{candidateQuery}&rdquo;.
              </p>
            )}
          </div>

          {}
          {candidate && !selectedNameIsDuplicated && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                You are choosing <strong>{candidate.name}</strong>
                {candidate.voterId ? ` (${candidate.voterId})` : ""}
                {candidate.party ? ` — ${candidate.party}` : ""}. Once
                submitted, your vote <strong>cannot be changed</strong>. Please
                review the candidate details before continuing.
              </p>
            </div>
          )}

          {selectedNameIsDuplicated && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-orange-300 bg-orange-50 p-4">
              <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-orange-800">
                  Multiple candidates share the name &ldquo;{candidate!.name}
                  &rdquo; — make sure you have selected the right person
                </p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {sameNameCandidates.map((c) => (
                    <li
                      key={c.id}
                      className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm ${
                        c.id === selected
                          ? "border-orange-400 bg-orange-100 font-semibold text-orange-900"
                          : "border-orange-200 bg-white text-orange-700"
                      }`}
                    >
                      <span className="font-medium">{c.name}</span>
                      {c.voterId && (
                        <span className="font-mono text-xs text-orange-600">
                          {c.voterId}
                        </span>
                      )}
                      {c.party && (
                        <span className="text-xs text-orange-500">
                          {c.party}
                        </span>
                      )}
                      {c.id === selected && (
                        <span className="ml-auto rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                          Your choice
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-orange-700">
                  You have selected <strong>{candidate!.name}</strong>
                  {candidate!.voterId ? ` (${candidate!.voterId})` : ""}
                  {candidate!.party ? ` — ${candidate!.party}` : ""}. Once
                  submitted, your vote <strong>cannot be changed</strong>. Tap
                  the <strong>ⓘ</strong> on a card to view their full profile
                  before confirming.
                </p>
              </div>
            </div>
          )}

          <Button
            fullWidth
            className="mt-4"
            disabled={!selected || !canVote || (!user?.isBiometricRegistered && !user?.hasVotingPin)}
            loading={voting}
            onClick={() => setShowAuthModal(true)}
          >
            {voting ? (STEP_LABEL[step] ?? "Submitting vote…") : "Cast my vote"}
          </Button>
        </Card>
      </div>

      {detailsCandidate && (
        <CandidateDetailsModal
          candidate={detailsCandidate}
          selected={selected === detailsCandidate.id}
          onSelect={() => {
            setSelected(detailsCandidate.id);
            setDetailsCandidateId(null);
          }}
          onClose={() => setDetailsCandidateId(null)}
          disabled={!canVote || (!user?.isBiometricRegistered && !user?.hasVotingPin)}
        />
      )}

      {showAuthModal && candidate && (
        <VoteAuthModal
          candidate={candidate}
          onSuccess={handleVoteAuth}
          onCancel={() => setShowAuthModal(false)}
        />
      )}
    </Layout>
  );
}
