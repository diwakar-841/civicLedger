import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Fingerprint,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../shared/Button";
import { Card } from "../shared/Card";
import type { CandidateRequest } from "../../hooks/useCandidateRequests";

interface CandidateRequestModalProps {
  requests: CandidateRequest[];
  onAccept: (
    requestId: string,
    method: "biometric" | "pin",
    pin?: string,
  ) => Promise<string | undefined>;
  onReject: (requestId: string, reason?: string) => Promise<void>;
  onClose?: () => void;
  loading?: boolean;
}

export function CandidateRequestModal({
  requests,
  onAccept,
  onReject,
  onClose,
}: CandidateRequestModalProps) {
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] =
    useState<CandidateRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [method, setMethod] = useState<"biometric" | "pin">("biometric");
  const [pin, setPin] = useState("");
  // Track WHICH action is running, not just that something is running —
  // a single `submitting` flag put a spinner on both buttons at once.
  const [action, setAction] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState("");

  const submitting = action !== null;

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const respondedRequests = requests.filter((r) => r.status !== "pending");

  async function handleAccept(request: CandidateRequest) {
    setAction("accept");
    setError("");
    try {
      await onAccept(request.id, method, method === "pin" ? pin : undefined);
      setSelectedRequest(null);
      setPin("");
      onClose?.();
      navigate(`/candidate-profile/${request.id}`);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Verification failed",
      );
    } finally {
      setAction(null);
    }
  }

  async function handleReject(request: CandidateRequest) {
    setAction("reject");
    setError("");
    try {
      await onReject(request.id, rejectionReason);
      setSelectedRequest(null);
      setRejectionReason("");
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Could not decline this request",
      );
    } finally {
      setAction(null);
    }
  }

  function getTimeRemaining(expiresAt: string): string {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs < 0) return "Expired";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
  }

  function getStatusColor(status: string): string {
    if (status === "accepted") return "bg-emerald-50 border-emerald-200";
    if (status === "rejected") return "bg-red-50 border-red-200";
    if (status === "expired") return "bg-amber-50 border-amber-200";
    return "bg-blue-50 border-blue-200";
  }

  function getStatusIcon(status: string) {
    if (status === "accepted")
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    if (status === "rejected")
      return <XCircle className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-amber-600" />;
  }

  if (requests.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-navy-900">
              Candidate nominations
            </h2>
            <p className="mt-1 text-sm text-navy-500">
              Accept or decline your nominations.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedRequest(null);
              onClose?.();
            }}
            className="text-navy-400 hover:text-navy-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-700">
              Pending ({pendingRequests.length})
            </h3>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => {
                    setSelectedRequest(request);
                    setError("");
                  }}
                  className="w-full rounded-lg border border-blue-200 bg-blue-50 p-4 text-left transition hover:bg-blue-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-navy-900">
                        {request.electionTitle}
                      </p>
                      {request.electionDescription && (
                        <p className="mt-1 max-w-sm text-xs text-navy-500">
                          {request.electionDescription}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-navy-600">
                        Nomination from the administrator
                      </p>
                    </div>
                    <span className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-blue-600">
                      <Clock className="h-3 w-3" />
                      {getTimeRemaining(request.expiresAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedRequest && selectedRequest.status === "pending" && (
          <div className="mb-6 overflow-hidden rounded-xl border border-navy-200 bg-white">
            <div className="border-b border-navy-100 px-4 py-3">
              <h4 className="font-semibold text-navy-900">
                Respond to {selectedRequest.electionTitle}
              </h4>
              <p className="mt-0.5 text-xs text-navy-500">
                Verification is required to accept.
              </p>
            </div>

            <div className="px-4 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">
                Verification method
              </p>
              <div className="mb-4 flex rounded-lg border border-navy-200 bg-navy-50 p-1">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setMethod("biometric");
                    setError("");
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                    method === "biometric"
                      ? "bg-navy-900 text-white"
                      : "text-navy-500"
                  }`}
                >
                  <Fingerprint className="h-4 w-4" />
                  Fingerprint / face ID
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setMethod("pin");
                    setError("");
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                    method === "pin"
                      ? "bg-navy-900 text-white"
                      : "text-navy-500"
                  }`}
                >
                  <KeyRound className="h-4 w-4" />
                  Login PIN
                </button>
              </div>

              {method === "biometric" ? (
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-navy-200 bg-navy-50 p-3 text-sm text-navy-600">
                  <Fingerprint className="h-6 w-6 flex-shrink-0 text-gold-600" />
                  Your device will prompt for fingerprint or face ID.
                </div>
              ) : (
                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-navy-700">
                    Login PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="••••••"
                    disabled={submitting}
                    className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm font-mono tracking-widest text-navy-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 disabled:opacity-60"
                  />
                </div>
              )}

              {error && (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => handleAccept(selectedRequest)}
                  loading={action === "accept"}
                  disabled={
                    submitting || (method === "pin" && pin.length !== 6)
                  }
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {action !== "accept" && <ShieldCheck className="h-4 w-4" />}
                  {action === "accept" ? "Verifying…" : "Verify and accept"}
                </Button>
                <Button
                  onClick={() => handleReject(selectedRequest)}
                  loading={action === "reject"}
                  disabled={submitting}
                  variant="ghost"
                  className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {action !== "reject" && <XCircle className="h-4 w-4" />}
                  {action === "reject" ? "Declining…" : "Decline"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {respondedRequests.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-700">
              History
            </h3>
            <div className="space-y-2">
              {respondedRequests.map((request) => (
                <div
                  key={request.id}
                  className={`rounded-lg border p-3 ${getStatusColor(request.status)}`}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <div>
                      <p className="text-sm font-semibold text-navy-900">
                        {request.electionTitle}
                      </p>
                      <p className="text-xs capitalize text-navy-600">
                        {request.status}
                        {request.status === "accepted" &&
                          !request.profileCompleted &&
                          " · profile still needed"}
                        {request.respondedAt &&
                          ` on ${new Date(request.respondedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    {request.status === "accepted" &&
                      !request.profileCompleted && (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/candidate-profile/${request.id}`)
                          }
                          className="ml-auto text-xs font-semibold text-navy-700 underline"
                        >
                          Complete profile
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
