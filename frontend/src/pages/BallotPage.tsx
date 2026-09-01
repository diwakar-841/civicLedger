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
import { formatError } from "../lib/formatError";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

const STEP_LABEL = {
  submitting: "Submitting your vote…",
  confirming: "Waiting for blockchain confirmation…"
};

export function BallotPage() {
  const { id } = useParams();
  const { election, loading, error } = useElection(id);
  const { user } = useAuthContext();
  const { castVote, loading: voting, step } = useCastVote();
  const { status: voteStatus, loading: voteStatusLoading } = useVoteStatus(id);
  const { show } = useToast();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [detailsCandidateId, setDetailsCandidateId] = useState(null);
  const [candidateQuery, setCandidateQuery] = useState("");

  useEffect(() => {
    if (!id || !election || voteStatusLoading || !voteStatus?.hasVoted || !voteStatus.vote) {return;}
    const v = voteStatus.vote;
    navigate(`/elections/${id}/confirmation`, {
      replace: true,
      state: {
        candidateName: v.candidateName,
        electionTitle: election.title,
        txHash: v.txHash,
        blockNumber: v.blockNumber,
        timestamp: v.votedAt
      }
    });
  }, [id, election, voteStatusLoading, voteStatus, navigate]);

  if (loading || voteStatusLoading || voteStatus?.hasVoted && voteStatus.vote) {
    return (
      _jsxDEV(Layout, {
 children:
        _jsxDEV(Spinner, { label: "Loading ballot" }, void 0, false) 
}, void 0, false
      ));

  }

  if (error || !election) {
    return (
      _jsxDEV(Layout, {
 children:
        _jsxDEV(Card, { className: "p-8 text-center text-navy-500", children: "Could not load this election." }, void 0, false) 
}, void 0, false
      ));

  }

  const status = deriveStatus(election);
  const candidate = election.candidates?.find((c) => {return c.id === selected;}) ?? null;
  const detailsCandidate = election.candidates?.find((c) => {return c.id === detailsCandidateId;}) ?? null;

  const nameCounts = (election.candidates ?? []).reduce(
    (acc, c) => {return { ...acc, [c.name.toLowerCase()]: (acc[c.name.toLowerCase()] ?? 0) + 1 };},
    {}
  );
  const selectedNameIsDuplicated =
  candidate !== null && nameCounts[candidate.name.toLowerCase()] > 1;
  const sameNameCandidates = selectedNameIsDuplicated ?
  (election.candidates ?? []).filter(
    (c) => {return c.name.toLowerCase() === candidate.name.toLowerCase();}
  ) :
  [];

  const trimmedQuery = candidateQuery.trim().toLowerCase();
  const visibleCandidates = (election.candidates ?? []).filter((c) => {
    if (!trimmedQuery) {return true;}
    return (
      c.name.toLowerCase().includes(trimmedQuery) ||
      (c.voterId ?? "").toLowerCase().includes(trimmedQuery));

  });

  async function handleVoteAuth(voteToken) {
    setShowAuthModal(false);
    if (!candidate || !election) {return;}
    try {
      await castVote(election.id, candidate.id, voteToken);
      navigate(`/elections/${election.id}/confirmation`, {
        state: {
          candidateName: candidate.name,
          candidateParty: candidate.party,
          candidateVoterId: candidate.voterId
        }
      });
    } catch (err) {
      show(formatError(err, "Your vote could not be submitted"), "error");
    }
  }

  const canVote = status === "active" && Boolean(user?.walletAddress);

  return (
    _jsxDEV(Layout, {
 children: [
      _jsxDEV("div", {
 className: "mx-auto max-w-2xl", children: [
        _jsxDEV("div", {
 className: "mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", children: [
          _jsxDEV("div", {
 children: [
            _jsxDEV("p", { className: "eyebrow mb-2 text-indigo-600", children: "Live ballot" }, void 0, false),
            _jsxDEV("h1", { className: "text-2xl font-extrabold text-navy-900 sm:text-3xl", children: election.title }, void 0, false),
            election.description &&
            _jsxDEV("p", { className: "mt-1 text-navy-500", children: election.description }, void 0, false)] 
}, void 0, true

          ),

          status === "active" && _jsxDEV(StatusBadge, { status: status }, void 0, false)] 
}, void 0, true
        ),

        status !== "active" &&
        _jsxDEV(Card, {
 className: "mb-6 flex items-start gap-3 border-amber-200 bg-amber-50 p-4", children: [
          _jsxDEV(AlertTriangle, { className: "mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" }, void 0, false),
          _jsxDEV("p", {
 className: "text-sm text-amber-800", children:
            status === "draft" ?
            "Voting hasn't opened for this election yet." :
            "Voting has closed for this election." 
}, void 0, false
          )] 
}, void 0, true
        ),

        status === "active" && !user?.walletAddress &&
        _jsxDEV("div", {
 className: "mb-6", children:
          _jsxDEV(WalletConnectPanel, {}, void 0, false) 
}, void 0, false
        ),

        status === "active" && !user?.isBiometricRegistered &&
        _jsxDEV(Card, {
 className: "mb-6 flex items-start gap-3 border-amber-200 bg-amber-50 p-4", children: [
          _jsxDEV(AlertTriangle, { className: "mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" }, void 0, false),
          _jsxDEV("p", { className: "text-sm text-amber-800", children: "You need to complete biometric setup before voting. Please sign out and sign in again to complete setup." }, void 0, false

          )] 
}, void 0, true
        ),

        _jsxDEV(Card, {
 className: "p-6 sm:p-8", children: [
          _jsxDEV("h2", { className: "mb-4 text-sm font-semibold uppercase tracking-wide text-navy-400", children: "Choose a candidate" }, void 0, false

          ),

          (election.candidates?.length ?? 0) > 1 &&
          _jsxDEV("div", {
 className: "relative mb-4", children: [
            _jsxDEV(Search, { className: "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" }, void 0, false),
            _jsxDEV("input", {
              value: candidateQuery,
              onChange: (e) => {return setCandidateQuery(e.target.value);},
              placeholder: "Search candidates by name or voter ID",
              className: "focus-ring w-full rounded-xl border border-navy-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm" 
}, void 0, false
            )] 
}, void 0, true
          ),

          _jsxDEV("div", {
 className: "flex flex-col gap-3", children: [
            visibleCandidates.map((c) => {return (
                _jsxDEV(CandidateCard, {

                  candidate: c,
                  selected: selected === c.id,
                  onSelect: () => {return setSelected(c.id);},
                  onViewDetails: () => {return setDetailsCandidateId(c.id);},
                  disabled: !canVote || !user?.isBiometricRegistered 
}, c.id, false
                ));
            }),
            visibleCandidates.length === 0 &&
            _jsxDEV("p", {
 className: "rounded-xl border border-navy-100 bg-navy-50 py-6 text-center text-sm text-navy-400", children: ["No candidates match “",
              candidateQuery, "”."] 
}, void 0, true
            )] 
}, void 0, true

          ),

          candidate && !selectedNameIsDuplicated &&
          _jsxDEV("div", {
 className: "mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4", children: [
            _jsxDEV(AlertTriangle, { className: "mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" }, void 0, false),
            _jsxDEV("p", {
 className: "text-sm text-amber-800", children: ["You are choosing ",
              _jsxDEV("strong", { children: candidate.name }, void 0, false),
              candidate.voterId ? ` (${candidate.voterId})` : "",
              candidate.party ? ` — ${candidate.party}` : "", ". Once submitted, your vote", " ",
              _jsxDEV("strong", { children: "cannot be changed" }, void 0, false), ". Please review the candidate details before continuing."] 
}, void 0, true
            )] 
}, void 0, true
          ),

          selectedNameIsDuplicated &&
          _jsxDEV("div", {
 className: "mt-6 flex items-start gap-3 rounded-xl border border-orange-300 bg-orange-50 p-4", children: [
            _jsxDEV(Users, { className: "mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" }, void 0, false),
            _jsxDEV("div", {
 className: "min-w-0 flex-1", children: [
              _jsxDEV("p", {
 className: "text-sm font-semibold text-orange-800", children: ["Multiple candidates share the name “",
                candidate.name, "” — make sure you have selected the right person"] 
}, void 0, true
              ),
              _jsxDEV("ul", {
 className: "mt-3 flex flex-col gap-1.5", children:
                sameNameCandidates.map((c) => {return (
                    _jsxDEV("li", {

                      className: `flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm ${
                      c.id === selected ?
                      "border-orange-400 bg-orange-100 font-semibold text-orange-900" :
                      "border-orange-200 bg-white text-orange-700"}`, children: [

                      _jsxDEV("span", { className: "font-medium", children: c.name }, void 0, false),
                      c.voterId &&
                      _jsxDEV("span", { className: "font-mono text-xs text-orange-600", children: c.voterId }, void 0, false),

                      c.party &&
                      _jsxDEV("span", { className: "text-xs text-orange-500", children: c.party }, void 0, false),

                      c.id === selected &&
                      _jsxDEV("span", { className: "ml-auto rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white", children: "Your choice" }, void 0, false

                      )] 
}, c.id, true

                    ));
                }) 
}, void 0, false
              ),
              _jsxDEV("p", {
 className: "mt-3 text-xs text-orange-700", children: ["You have selected ",
                _jsxDEV("strong", { children: candidate.name }, void 0, false),
                candidate.voterId ? ` (${candidate.voterId})` : "",
                candidate.party ? ` — ${candidate.party}` : "", ". Once submitted, your vote", " ",
                _jsxDEV("strong", { children: "cannot be changed" }, void 0, false), ". Tap the ", _jsxDEV("strong", { children: "ⓘ" }, void 0, false), " on a card to view their full profile before confirming."] 
}, void 0, true
              )] 
}, void 0, true
            )] 
}, void 0, true
          ),

          _jsxDEV(Button, {
            fullWidth: true,
            className: "mt-4",
            disabled: !selected || !canVote || !user?.isBiometricRegistered,
            loading: voting,
            onClick: () => {return setShowAuthModal(true);}, children:

            voting ? STEP_LABEL[step] ?? "Submitting vote…" : "Cast my vote" 
}, void 0, false
          )] 
}, void 0, true
        )] 
}, void 0, true
      ),

      detailsCandidate &&
      _jsxDEV(CandidateDetailsModal, {
        candidate: detailsCandidate,
        selected: selected === detailsCandidate.id,
        onSelect: () => {
          setSelected(detailsCandidate.id);
          setDetailsCandidateId(null);
        },
        onClose: () => {return setDetailsCandidateId(null);},
        disabled: !canVote || !user?.isBiometricRegistered 
}, void 0, false
      ),

      showAuthModal && candidate &&
      _jsxDEV(VoteAuthModal, {
        candidate: candidate,
        onSuccess: handleVoteAuth,
        onCancel: () => {return setShowAuthModal(false);} 
}, void 0, false
      )] 
}, void 0, true

    ));

}