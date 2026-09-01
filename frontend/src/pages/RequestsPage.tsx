import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Clock, CheckCircle2, XCircle, UserRound, ShieldCheck, Users, Eye } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { EmptyState } from "../components/shared/EmptyState";
import { Spinner } from "../components/shared/Spinner";
import { CandidateRequestModal } from "../components/candidates/CandidateNominationRequest";
import { VoterDetailModal } from "../components/admin/VoterDetailModal";

import { useAuthContext } from "../contexts/AuthContext";
import { useCandidateRequests } from "../hooks/useCandidateRequests";
import { apiClient } from "../lib/apiClient";
import { formatError } from "../lib/formatError";
import { voterDisplayId } from "../lib/idFormat";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

function statusLabel(status) {
  return status === "accepted" ? "Accepted" : status === "rejected" ? "Declined" : status === "expired" ? "Expired" : "Pending";
}

export function RequestsPage() {
  const { isAdmin } = useAuthContext();
  const navigate = useNavigate();
  const { requests, loading, error, acceptRequest, rejectRequest } = useCandidateRequests();
  const [showNomineeActions, setShowNomineeActions] = useState(false);
  const [groupRequests, setGroupRequests] = useState([]);
  const [groupRequestError, setGroupRequestError] = useState(null);

  const [viewingVoter, setViewingVoter] = useState(null);
  useEffect(() => {
    if (isAdmin) {return;}
    apiClient.get("/groups/requests").
    then(({ data }) => {return setGroupRequests(Array.isArray(data) ? data : []);}).
    catch((err) => {return setGroupRequestError(formatError(err, "Could not load group invitations."));});
  }, [isAdmin]);

  const pending = requests.filter((request) => {return request.status === "pending";});

  return (
    _jsxDEV(Layout, {
 children: [
      _jsxDEV("div", {
 className: "mx-auto max-w-4xl", children: [
        _jsxDEV("div", {
 className: "mb-6 flex flex-col gap-4 rounded-2xl border border-navy-100 bg-white/70 p-5 shadow-sm sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:p-6 dark:border-navy-800 dark:bg-navy-900/60", children: [
          _jsxDEV("div", {
 children: [
            _jsxDEV("p", {
 className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold-600", children: [
              _jsxDEV(ClipboardList, { className: "h-4 w-4" }, void 0, false),
              isAdmin ? "Administration" : "Your requests"] 
}, void 0, true
            ),
            _jsxDEV("p", { className: "eyebrow text-indigo-600", children: "Inbox" }, void 0, false),
            _jsxDEV("h1", { className: "mt-2 text-3xl font-extrabold text-navy-900 dark:text-white", children: "Requests" }, void 0, false),
            _jsxDEV("p", {
 className: "mt-1 text-sm text-navy-500 dark:text-navy-300", children:
              isAdmin ?
              "Nomination requests and candidate responses." :
              "Respond to nominations and complete your candidate profile." 
}, void 0, false
            )] 
}, void 0, true
          ),
          !isAdmin && pending.length > 0 &&
          _jsxDEV("button", {
            type: "button",
            onClick: () => {return setShowNomineeActions(true);},
            className: "rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800", children: [
            "Review pending (",
            pending.length, ")"] 
}, void 0, true
          )] 
}, void 0, true

        ),

        loading && _jsxDEV(Spinner, { label: "Loading requests" }, void 0, false),
        !loading && error && _jsxDEV(EmptyState, { title: "Requests unavailable", description: error }, void 0, false),
        !loading && !error && requests.length === 0 && groupRequests.length === 0 &&
        _jsxDEV(EmptyState, {
          title: isAdmin ? "No nomination requests yet" : "No requests yet",
          description: isAdmin ? "Requests appear here once sent." : "Nomination and group invitations appear here.",
          icon: _jsxDEV(ClipboardList, { className: "h-6 w-6" }, void 0, false) 
}, void 0, false
        ),

        !isAdmin && groupRequestError && _jsxDEV("p", { className: "mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700", children: groupRequestError }, void 0, false),
        !isAdmin && groupRequests.length > 0 &&
        _jsxDEV("div", {
 className: "mb-6 space-y-3", children:
          groupRequests.map((r) => {return (
              _jsxDEV(Card, {
 className: "border-gold-200 bg-gold-50 p-5", children:
                _jsxDEV("div", {
 className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [
                  _jsxDEV("div", {
 className: "flex items-start gap-3", children: [
                    _jsxDEV("div", {
 className: "h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl border border-gold-200 bg-white", children:
                      r.group_photo_url ?
                      _jsxDEV("img", { src: r.group_photo_url, alt: "", className: "h-full w-full object-cover" }, void 0, false) :

                      _jsxDEV("span", {
 className: "flex h-full w-full items-center justify-center text-navy-400", children:
                        _jsxDEV(Users, { className: "h-5 w-5" }, void 0, false) 
}, void 0, false
                      ) 
}, void 0, false

                    ),
                    _jsxDEV("div", {
 children: [
                      _jsxDEV("p", { className: "font-semibold text-navy-900", children: ["Invitation to ", r.group_name] }, void 0, true),
                      r.group_description && _jsxDEV("p", { className: "mt-1 max-w-md text-sm text-navy-600", children: r.group_description }, void 0, false),
                      _jsxDEV("p", {
 className: "mt-1 text-xs font-semibold text-navy-500", children:
                        typeof r.group_member_count === "number" ? `${r.group_member_count} current member${r.group_member_count === 1 ? "" : "s"}` : "Private election group" 
}, void 0, false
                      ),
                      _jsxDEV("p", { className: "mt-2 text-xs text-navy-400", children: new Date(r.created_at || r.createdAt).toLocaleString() }, void 0, false)] 
}, void 0, true
                    )] 
}, void 0, true
                  ),
                  _jsxDEV("div", {
 className: "flex items-center gap-2 self-start sm:self-auto", children:
                    r.status === "pending" ?
                    _jsxDEV(_Fragment, {
 children: [
                      _jsxDEV("button", {
                        className: "rounded-lg bg-navy-900 px-3 py-2 text-xs font-semibold text-white",
                        onClick: async () => {
                          await apiClient.put(`/groups/requests/${r.id}/accept`);
                          setGroupRequests((prev) => {return prev.map((x) => {return x.id === r.id ? { ...x, status: "accepted" } : x;});});
                        }, children:
                        "Accept" 
}, void 0, false

                      ),
                      _jsxDEV("button", {
                        className: "rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700",
                        onClick: async () => {
                          await apiClient.put(`/groups/requests/${r.id}/reject`);
                          setGroupRequests((prev) => {return prev.map((x) => {return x.id === r.id ? { ...x, status: "rejected" } : x;});});
                        }, children:
                        "Reject" 
}, void 0, false

                      )] 
}, void 0, true
                    ) :

                    _jsxDEV("span", { className: "text-xs font-bold uppercase tracking-wide text-navy-500", children: r.status }, void 0, false) 
}, void 0, false

                  )] 
}, void 0, true
                ) 
}, r.id, false
              ));
          }) 
}, void 0, false
        ),

        !loading && !error && requests.length > 0 &&
        _jsxDEV("div", {
 className: "space-y-3", children:
          requests.map((request) => {
            const pendingRequest = request.status === "pending";
            const statusColor =
            request.status === "accepted" ?
            "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20" :
            request.status === "rejected" ?
            "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20" :
            pendingRequest ?
            "border-gold-200 bg-gold-50 dark:border-gold-900 dark:bg-gold-950/20" :
            "border-navy-200 bg-white dark:border-navy-800 dark:bg-navy-900";

            return (
              _jsxDEV(Card, {
 className: `p-5 ${statusColor}`, children: [
                _jsxDEV("div", {
 className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
                  _jsxDEV("div", {
 className: "flex items-start gap-3", children: [
                    _jsxDEV("span", {
 className: "mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/70 text-navy-700 dark:bg-navy-800 dark:text-gold-400", children:
                      isAdmin ? _jsxDEV(UserRound, { className: "h-4 w-4" }, void 0, false) : pendingRequest ? _jsxDEV(Clock, { className: "h-4 w-4" }, void 0, false) : _jsxDEV(ShieldCheck, { className: "h-4 w-4" }, void 0, false) 
}, void 0, false
                    ),
                    _jsxDEV("div", {
 children: [
                      _jsxDEV("h2", { className: "font-semibold text-navy-900 dark:text-white", children: request.electionTitle }, void 0, false),
                      request.electionDescription &&
                      _jsxDEV("p", { className: "mt-1 max-w-md text-sm text-navy-600 dark:text-navy-300", children: request.electionDescription }, void 0, false),

                      isAdmin &&
                      _jsxDEV("button", {
                        type: "button",
                        onClick: () =>
                        {return request.userId &&
                          setViewingVoter({
                            id: request.userId,
                            fullName: request.candidateName ?? "Unknown voter",
                            voterId: voterDisplayId(request.userId),
                            walletLinked: Boolean(request.candidateWalletLinked),
                            photoUrl: request.candidatePhotoUrl ?? null
                          });},

                        className: "mt-1 flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline", children: [

                        _jsxDEV(Eye, { className: "h-3.5 w-3.5" }, void 0, false),
                        request.candidateName ?? "Unknown voter"] 
}, void 0, true
                      ),

                      !isAdmin && _jsxDEV("p", { className: "mt-1 text-sm text-navy-600 dark:text-navy-300", children: "Nomination from the administrator" }, void 0, false),
                      _jsxDEV("p", {
 className: "mt-1 text-xs text-navy-500 dark:text-navy-400", children:
                        pendingRequest && request.expiresAt ?
                        `Response deadline: ${new Date(request.expiresAt).toLocaleString()}` :
                        request.respondedAt ?
                        `Responded: ${new Date(request.respondedAt).toLocaleString()}` :
                        "No response recorded" 
}, void 0, false
                      )] 
}, void 0, true
                    )] 
}, void 0, true
                  ),
                  _jsxDEV("div", {
 className: "flex items-center gap-2 self-start sm:self-auto", children: [
                    request.status === "accepted" ? _jsxDEV(CheckCircle2, { className: "h-4 w-4 text-emerald-600" }, void 0, false) : request.status === "rejected" ? _jsxDEV(XCircle, { className: "h-4 w-4 text-red-600" }, void 0, false) : _jsxDEV(Clock, { className: "h-4 w-4 text-gold-600" }, void 0, false),
                    _jsxDEV("span", { className: "text-sm font-semibold text-navy-700 dark:text-navy-200", children: statusLabel(request.status) }, void 0, false)] 
}, void 0, true
                  )] 
}, void 0, true
                ),
                isAdmin && request.status === "accepted" &&
                _jsxDEV("p", {
 className: "mt-4 border-t border-navy-200/70 pt-3 text-xs text-navy-600 dark:border-navy-800 dark:text-navy-300", children:
                  request.profileCompleted ? "Profile complete — ready for the ballot." : "Profile pending from the nominee." 
}, void 0, false
                ),

                !isAdmin && request.status === "accepted" && !request.profileCompleted &&
                _jsxDEV("button", {
                  type: "button",
                  onClick: () => {return navigate(`/candidate-profile/${request.id}`);},
                  className: "mt-4 rounded-lg border border-navy-300 px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-white dark:border-navy-700 dark:text-navy-200 dark:hover:bg-navy-800", children:
                  "Complete profile" 
}, void 0, false

                )] 
}, request.id, true

              ));

          }) 
}, void 0, false
        )] 
}, void 0, true

      ),

      !isAdmin && showNomineeActions &&
      _jsxDEV(CandidateRequestModal, {
        requests: requests,
        onAccept: acceptRequest,
        onReject: rejectRequest,
        onClose: () => {return setShowNomineeActions(false);} 
}, void 0, false
      ),

      viewingVoter && _jsxDEV(VoterDetailModal, { voter: viewingVoter, onClose: () => {return setViewingVoter(null);} }, void 0, false)] 
}, void 0, true
    ));

}