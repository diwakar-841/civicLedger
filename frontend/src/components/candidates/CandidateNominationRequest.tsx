import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Clock, CheckCircle2, XCircle, Fingerprint, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "../shared/Button";
import { Card } from "../shared/Card";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function CandidateRequestModal({
  requests,
  onAccept,
  onReject,
  onClose
}) {
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [method, setMethod] = useState("biometric");
  const [pin, setPin] = useState("");

  const [action, setAction] = useState(null);
  const [error, setError] = useState("");

  const submitting = action !== null;

  const pendingRequests = requests.filter((r) => {return r.status === "pending";});
  const respondedRequests = requests.filter((r) => {return r.status !== "pending";});

  async function handleAccept(request) {
    setAction("accept");
    setError("");
    try {
      await onAccept(request.id, method, method === "pin" ? pin : undefined);
      setSelectedRequest(null);
      setPin("");
      onClose?.();
      navigate(`/candidate-profile/${request.id}`);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Verification failed");
    } finally {
      setAction(null);
    }
  }

  async function handleReject(request) {
    setAction("reject");
    setError("");
    try {
      await onReject(request.id, rejectionReason);
      setSelectedRequest(null);
      setRejectionReason("");
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not decline this request");
    } finally {
      setAction(null);
    }
  }

  function getTimeRemaining(expiresAt) {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs < 0) {return "Expired";}
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor(diffMs % (1000 * 60 * 60) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
  }

  function getStatusColor(status) {
    if (status === "accepted") {return "bg-emerald-50 border-emerald-200";}
    if (status === "rejected") {return "bg-red-50 border-red-200";}
    if (status === "expired") {return "bg-amber-50 border-amber-200";}
    return "bg-blue-50 border-blue-200";
  }

  function getStatusIcon(status) {
    if (status === "accepted") {return _jsxDEV(CheckCircle2, { className: "h-4 w-4 text-emerald-600" }, void 0, false);}
    if (status === "rejected") {return _jsxDEV(XCircle, { className: "h-4 w-4 text-red-600" }, void 0, false);}
    return _jsxDEV(Clock, { className: "h-4 w-4 text-amber-600" }, void 0, false);
  }

  if (requests.length === 0) {return null;}

  return (
    _jsxDEV("div", {
 className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children:
      _jsxDEV(Card, {
 className: "max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6", children: [
        _jsxDEV("div", {
 className: "mb-6 flex items-center justify-between", children: [
          _jsxDEV("div", {
 children: [
            _jsxDEV("h2", { className: "text-xl font-bold text-navy-900", children: "Candidate nominations" }, void 0, false),
            _jsxDEV("p", { className: "mt-1 text-sm text-navy-500", children: "Accept or decline your nominations." }, void 0, false)] 
}, void 0, true
          ),
          _jsxDEV("button", {
            onClick: () => {setSelectedRequest(null);onClose?.();},
            className: "text-navy-400 hover:text-navy-600",
            "aria-label": "Close", children:

            _jsxDEV(X, { className: "h-5 w-5" }, void 0, false) 
}, void 0, false
          )] 
}, void 0, true
        ),

        pendingRequests.length > 0 &&
        _jsxDEV("div", {
 className: "mb-6", children: [
          _jsxDEV("h3", {
 className: "mb-3 text-sm font-semibold uppercase tracking-wide text-navy-700", children: ["Pending (",
            pendingRequests.length, ")"] 
}, void 0, true
          ),
          _jsxDEV("div", {
 className: "space-y-3", children:
            pendingRequests.map((request) => {return (
                _jsxDEV("button", {

                  type: "button",
                  onClick: () => {setSelectedRequest(request);setError("");},
                  className: "w-full rounded-lg border border-blue-200 bg-blue-50 p-4 text-left transition hover:bg-blue-100", children:

                  _jsxDEV("div", {
 className: "flex items-start justify-between gap-3", children: [
                    _jsxDEV("div", {
 children: [
                      _jsxDEV("p", { className: "font-semibold text-navy-900", children: request.electionTitle }, void 0, false),
                      request.electionDescription &&
                      _jsxDEV("p", { className: "mt-1 max-w-sm text-xs text-navy-500", children: request.electionDescription }, void 0, false),

                      _jsxDEV("p", { className: "mt-1 text-sm text-navy-600", children: "Nomination from the administrator" }, void 0, false)] 
}, void 0, true
                    ),
                    _jsxDEV("span", {
 className: "flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-blue-600", children: [
                      _jsxDEV(Clock, { className: "h-3 w-3" }, void 0, false),
                      getTimeRemaining(request.expiresAt)] 
}, void 0, true
                    )] 
}, void 0, true
                  ) 
}, request.id, false
                ));
            }) 
}, void 0, false
          )] 
}, void 0, true
        ),

        selectedRequest && selectedRequest.status === "pending" &&
        _jsxDEV("div", {
 className: "mb-6 overflow-hidden rounded-xl border border-navy-200 bg-white", children: [
          _jsxDEV("div", {
 className: "border-b border-navy-100 px-4 py-3", children: [
            _jsxDEV("h4", { className: "font-semibold text-navy-900", children: ["Respond to ", selectedRequest.electionTitle] }, void 0, true),
            _jsxDEV("p", { className: "mt-0.5 text-xs text-navy-500", children: "Verification is required to accept." }, void 0, false)] 
}, void 0, true
          ),

          _jsxDEV("div", {
 className: "px-4 py-4", children: [
            _jsxDEV("p", { className: "mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500", children: "Verification method" }, void 0, false

            ),
            _jsxDEV("div", {
 className: "mb-4 flex rounded-lg border border-navy-200 bg-navy-50 p-1", children: [
              _jsxDEV("button", {
                type: "button",
                disabled: submitting,
                onClick: () => {setMethod("biometric");setError("");},
                className: `flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                method === "biometric" ? "bg-navy-900 text-white" : "text-navy-500"}`, children: [

                _jsxDEV(Fingerprint, { className: "h-4 w-4" }, void 0, false), "Fingerprint / face ID"] 
}, void 0, true

              ),
              _jsxDEV("button", {
                type: "button",
                disabled: submitting,
                onClick: () => {setMethod("pin");setError("");},
                className: `flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                method === "pin" ? "bg-navy-900 text-white" : "text-navy-500"}`, children: [

                _jsxDEV(KeyRound, { className: "h-4 w-4" }, void 0, false), "Login PIN"] 
}, void 0, true

              )] 
}, void 0, true
            ),

            method === "biometric" ?
            _jsxDEV("div", {
 className: "mb-4 flex items-center gap-3 rounded-lg border border-navy-200 bg-navy-50 p-3 text-sm text-navy-600", children: [
              _jsxDEV(Fingerprint, { className: "h-6 w-6 flex-shrink-0 text-gold-600" }, void 0, false), "Your device will prompt for fingerprint or face ID."] 
}, void 0, true

            ) :

            _jsxDEV("div", {
 className: "mb-4", children: [
              _jsxDEV("label", { className: "mb-1.5 block text-sm font-medium text-navy-700", children: "Login PIN" }, void 0, false),
              _jsxDEV("input", {
                type: "password",
                inputMode: "numeric",
                maxLength: 6,
                value: pin,
                onChange: (e) => {return setPin(e.target.value.replace(/\D/g, "").slice(0, 6));},
                placeholder: "••••••",
                disabled: submitting,
                className: "w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm font-mono tracking-widest text-navy-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 disabled:opacity-60" 
}, void 0, false
              )] 
}, void 0, true
            ),

            error &&
            _jsxDEV("p", { className: "mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700", children: error }, void 0, false),

            _jsxDEV("div", {
 className: "flex flex-col gap-2 sm:flex-row", children: [
              _jsxDEV(Button, {
                onClick: () => {return handleAccept(selectedRequest);},
                loading: action === "accept",
                disabled: submitting || method === "pin" && pin.length !== 6,
                className: "flex-1 bg-emerald-600 hover:bg-emerald-700", children: [

                action !== "accept" && _jsxDEV(ShieldCheck, { className: "h-4 w-4" }, void 0, false),
                action === "accept" ? "Verifying…" : "Verify and accept"] 
}, void 0, true
              ),
              _jsxDEV(Button, {
                onClick: () => {return handleReject(selectedRequest);},
                loading: action === "reject",
                disabled: submitting,
                variant: "ghost",
                className: "flex-1 border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700", children: [

                action !== "reject" && _jsxDEV(XCircle, { className: "h-4 w-4" }, void 0, false),
                action === "reject" ? "Declining…" : "Decline"] 
}, void 0, true
              )] 
}, void 0, true
            )] 
}, void 0, true
          )] 
}, void 0, true
        ),

        respondedRequests.length > 0 &&
        _jsxDEV("div", {
 children: [
          _jsxDEV("h3", { className: "mb-3 text-sm font-semibold uppercase tracking-wide text-navy-700", children: "History" }, void 0, false),
          _jsxDEV("div", {
 className: "space-y-2", children:
            respondedRequests.map((request) => {return (
                _jsxDEV("div", {
 className: `rounded-lg border p-3 ${getStatusColor(request.status)}`, children:
                  _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
                    getStatusIcon(request.status),
                    _jsxDEV("div", {
 children: [
                      _jsxDEV("p", { className: "text-sm font-semibold text-navy-900", children: request.electionTitle }, void 0, false),
                      _jsxDEV("p", {
 className: "text-xs capitalize text-navy-600", children: [
                        request.status,
                        request.status === "accepted" && !request.profileCompleted && " · profile still needed",
                        request.respondedAt && ` on ${new Date(request.respondedAt).toLocaleDateString()}`] 
}, void 0, true
                      )] 
}, void 0, true
                    ),
                    request.status === "accepted" && !request.profileCompleted &&
                    _jsxDEV("button", {
                      type: "button",
                      onClick: () => {return navigate(`/candidate-profile/${request.id}`);},
                      className: "ml-auto text-xs font-semibold text-navy-700 underline", children:
                      "Complete profile" 
}, void 0, false

                    )] 
}, void 0, true

                  ) 
}, request.id, false
                ));
            }) 
}, void 0, false
          )] 
}, void 0, true
        )] 
}, void 0, true

      ) 
}, void 0, false
    ));

}