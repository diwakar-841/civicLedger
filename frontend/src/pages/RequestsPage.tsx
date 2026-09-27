import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  UserRound,
  ShieldCheck,
  Users,
  Eye,
} from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { EmptyState } from "../components/shared/EmptyState";
import { Spinner } from "../components/shared/Spinner";
import { CandidateRequestModal } from "../components/candidates/CandidateNominationRequest";
import { VoterDetailModal } from "../components/admin/VoterDetailModal";
import type { VoterSearchResult } from "../hooks/useAdminElections";
import { useAuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { formatError } from "../lib/formatError";
import { useCandidateRequests } from "../hooks/useCandidateRequests";
import { apiClient } from "../lib/apiClient";
import { voterDisplayId } from "../lib/idFormat";

function statusLabel(status: string) {
  return status === "accepted"
    ? "Accepted"
    : status === "rejected"
      ? "Declined"
      : status === "expired"
        ? "Expired"
        : "Pending";
}

export function RequestsPage() {
  const { isAdmin } = useAuthContext();
  const { show } = useToast();
  const navigate = useNavigate();
  const { requests, loading, error, acceptRequest, rejectRequest } =
    useCandidateRequests();
  const [showNomineeActions, setShowNomineeActions] = useState(false);
  const [groupRequests, setGroupRequests] = useState<any[]>([]);
  const [groupRequestError, setGroupRequestError] = useState<string | null>(
    null,
  );

  const [viewingVoter, setViewingVoter] = useState<VoterSearchResult | null>(
    null,
  );
  useEffect(() => {
    if (isAdmin) return;
    apiClient
      .get("/groups/requests")
      .then(({ data }) => setGroupRequests(Array.isArray(data) ? data : []))
      .catch((err) =>
        setGroupRequestError(
          err?.response?.data?.error || "Could not load group invitations.",
        ),
      );
  }, [isAdmin]);

  const pending = requests.filter((request) => request.status === "pending");

  return (
    <Layout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-navy-100 bg-white/70 p-5 shadow-sm sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:p-6 dark:border-navy-800 dark:bg-navy-900/60">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold-600">
              <ClipboardList className="h-4 w-4" />
              {isAdmin ? "Administration" : "Your requests"}
            </p>
            <p className="eyebrow text-indigo-600">Inbox</p>
            <h1 className="mt-2 text-3xl font-extrabold text-navy-900 dark:text-white">
              Requests
            </h1>
            <p className="mt-1 text-sm text-navy-500 dark:text-navy-300">
              {isAdmin
                ? "Nomination requests and candidate responses."
                : "Respond to nominations and complete your candidate profile."}
            </p>
          </div>
          {!isAdmin && pending.length > 0 && (
            <button
              type="button"
              onClick={() => setShowNomineeActions(true)}
              className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
            >
              Review pending ({pending.length})
            </button>
          )}
        </div>

        {loading && <Spinner label="Loading requests" />}
        {!loading && error && (
          <EmptyState title="Requests unavailable" description={error} />
        )}
        {!loading &&
          !error &&
          requests.length === 0 &&
          groupRequests.length === 0 && (
            <EmptyState
              title={isAdmin ? "No nomination requests yet" : "No requests yet"}
              description={
                isAdmin
                  ? "Requests appear here once sent."
                  : "Nomination and group invitations appear here."
              }
              icon={<ClipboardList className="h-6 w-6" />}
            />
          )}
        {!isAdmin && groupRequestError && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {groupRequestError}
          </p>
        )}
        {!isAdmin && groupRequests.length > 0 && (
          <div className="mb-6 space-y-3">
            {groupRequests.map((r) => (
              <Card key={r.id} className="border-gold-200 bg-gold-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl border border-gold-200 bg-white">
                      {r.group_photo_url ? (
                        <img
                          src={r.group_photo_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-navy-400">
                          <Users className="h-5 w-5" />
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-navy-900">
                        Invitation to {r.group_name}
                      </p>
                      {r.group_description && (
                        <p className="mt-1 max-w-md text-sm text-navy-600">
                          {r.group_description}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-semibold text-navy-500">
                        {typeof r.group_member_count === "number"
                          ? `${r.group_member_count} current member${r.group_member_count === 1 ? "" : "s"}`
                          : "Private election group"}
                      </p>
                      <p className="mt-2 text-xs text-navy-400">
                        {new Date(r.created_at || r.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {r.status === "pending" ? (
                      <>
                        <button
                          className="rounded-lg bg-navy-900 px-3 py-2 text-xs font-semibold text-white"
                          onClick={async () => {
                            try {
                              await apiClient.put(
                                `/groups/requests/${r.id}/accept`,
                              );
                              setGroupRequests((prev) =>
                                prev.map((x) =>
                                  x.id === r.id
                                    ? { ...x, status: "accepted" }
                                    : x,
                                ),
                              );
                            } catch (err) {
                              show(
                                formatError(err, "Could not accept this invitation."),
                                "error",
                              );
                            }
                          }}
                        >
                          Accept
                        </button>
                        <button
                          className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700"
                          onClick={async () => {
                            try {
                              await apiClient.put(
                                `/groups/requests/${r.id}/reject`,
                              );
                              setGroupRequests((prev) =>
                                prev.map((x) =>
                                  x.id === r.id
                                    ? { ...x, status: "rejected" }
                                    : x,
                                ),
                              );
                            } catch (err) {
                              show(
                                formatError(err, "Could not decline this invitation."),
                                "error",
                              );
                            }
                          }}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-wide text-navy-500">
                        {r.status}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((request) => {
              const pendingRequest = request.status === "pending";
              const statusColor =
                request.status === "accepted"
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
                  : request.status === "rejected"
                    ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
                    : pendingRequest
                      ? "border-gold-200 bg-gold-50 dark:border-gold-900 dark:bg-gold-950/20"
                      : "border-navy-200 bg-white dark:border-navy-800 dark:bg-navy-900";

              return (
                <Card key={request.id} className={`p-5 ${statusColor}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/70 text-navy-700 dark:bg-navy-800 dark:text-gold-400">
                        {isAdmin ? (
                          <UserRound className="h-4 w-4" />
                        ) : pendingRequest ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                      </span>
                      <div>
                        <h2 className="font-semibold text-navy-900 dark:text-white">
                          {request.electionTitle}
                        </h2>
                        {request.electionDescription && (
                          <p className="mt-1 max-w-md text-sm text-navy-600 dark:text-navy-300">
                            {request.electionDescription}
                          </p>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() =>
                              request.userId &&
                              setViewingVoter({
                                id: request.userId,
                                fullName:
                                  request.candidateName ?? "Unknown voter",
                                voterId: voterDisplayId(request.userId),
                                walletLinked: Boolean(
                                  request.candidateWalletLinked,
                                ),
                                photoUrl: request.candidatePhotoUrl ?? null,
                              })
                            }
                            className="mt-1 flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {request.candidateName ?? "Unknown voter"}
                          </button>
                        )}
                        {!isAdmin && (
                          <p className="mt-1 text-sm text-navy-600 dark:text-navy-300">
                            Nomination from the administrator
                          </p>
                        )}
                        <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                          {pendingRequest && request.expiresAt
                            ? `Response deadline: ${new Date(request.expiresAt).toLocaleString()}`
                            : request.respondedAt
                              ? `Responded: ${new Date(request.respondedAt).toLocaleString()}`
                              : "No response recorded"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {request.status === "accepted" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : request.status === "rejected" ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gold-600" />
                      )}
                      <span className="text-sm font-semibold text-navy-700 dark:text-navy-200">
                        {statusLabel(request.status)}
                      </span>
                    </div>
                  </div>
                  {isAdmin && request.status === "accepted" && (
                    <p className="mt-4 border-t border-navy-200/70 pt-3 text-xs text-navy-600 dark:border-navy-800 dark:text-navy-300">
                      {request.profileCompleted
                        ? "Profile complete — ready for the ballot."
                        : "Profile pending from the nominee."}
                    </p>
                  )}
                  {!isAdmin &&
                    request.status === "accepted" &&
                    !request.profileCompleted && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/candidate-profile/${request.id}`)
                        }
                        className="mt-4 rounded-lg border border-navy-300 px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-white dark:border-navy-700 dark:text-navy-200 dark:hover:bg-navy-800"
                      >
                        Complete profile
                      </button>
                    )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {!isAdmin && showNomineeActions && (
        <CandidateRequestModal
          requests={requests}
          onAccept={acceptRequest}
          onReject={rejectRequest}
          onClose={() => setShowNomineeActions(false)}
        />
      )}
      {viewingVoter && (
        <VoterDetailModal
          voter={viewingVoter}
          onClose={() => setViewingVoter(null)}
        />
      )}
    </Layout>
  );
}
