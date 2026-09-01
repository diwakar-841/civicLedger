import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, CheckCircle2, Image, ShieldCheck } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { TextField, TextAreaField } from "../components/shared/Input";
import { Spinner } from "../components/shared/Spinner";
import { useCandidateRequests } from "../hooks/useCandidateRequests";
import { apiClient } from "../lib/apiClient";
import { formatError } from "../lib/formatError";
import { useToast } from "../contexts/ToastContext";
import { fileToCompressedDataUrl } from "../lib/imageUpload";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function CandidateProfileCompletionPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { requests, loading, refetch } = useCandidateRequests();
  const { show } = useToast();
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    party: "",
    photoUrl: "",
    bio: "",
    qualification: "",
    supports: ""
  });

  async function pickPhoto(file) {
    if (!file) {return;}
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    try {
      const compressed = await fileToCompressedDataUrl(file);
      setForm((p) => {return { ...p, photoUrl: compressed };});
      setPhotoError(null);
    } catch {
      setPhotoError("Could not read that image. Try another one.");
    }
  }

  const request = requests.find((item) => {return item.id === requestId;});

  useEffect(() => {
    if (request?.status === "accepted" && request.profileCompleted) {
      navigate("/elections", { replace: true });
    }
  }, [request, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!requestId) {return;}
    setSaving(true);
    try {
      await apiClient.post(`/candidate-requests/${requestId}/profile`, form);
      await refetch();
      show("Candidate profile submitted successfully", "success");
      navigate("/elections");
    } catch (err) {
      show(formatError(err, "Could not submit candidate profile"), "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return _jsxDEV(Layout, { children: _jsxDEV(Spinner, { label: "Loading nomination" }, void 0, false) }, void 0, false);
  }

  if (!request || request.status !== "accepted") {
    return (
      _jsxDEV(Layout, {
 children:
        _jsxDEV(Card, {
 className: "mx-auto max-w-xl p-6", children: [
          _jsxDEV("h1", { className: "text-xl font-bold text-navy-900", children: "Candidate profile unavailable" }, void 0, false),
          _jsxDEV("p", { className: "mt-2 text-sm text-navy-500", children: "This nomination must be accepted before a profile can be submitted." }, void 0, false),
          _jsxDEV(Button, { className: "mt-5", onClick: () => {return navigate("/elections");}, children: "Back to elections" }, void 0, false)] 
}, void 0, true
        ) 
}, void 0, false
      ));

  }

  return (
    _jsxDEV(Layout, {
 children:
      _jsxDEV("div", {
 className: "mx-auto max-w-2xl", children: [
        _jsxDEV("div", {
 className: "mb-6 flex items-start gap-3", children: [
          _jsxDEV("span", {
 className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold-100", children:
            _jsxDEV(ShieldCheck, { className: "h-5 w-5 text-gold-700" }, void 0, false) 
}, void 0, false
          ),
          _jsxDEV("div", {
 children: [
            _jsxDEV("h1", { className: "text-2xl font-bold text-navy-900", children: "Complete your candidate profile" }, void 0, false),
            _jsxDEV("p", {
 className: "mt-1 text-sm text-navy-500", children: ["You accepted the nomination for ",
              _jsxDEV("strong", { children: request.electionTitle }, void 0, false), ". Only you can provide these details."] 
}, void 0, true

            )] 
}, void 0, true
          )] 
}, void 0, true
        ),

        _jsxDEV(Card, {
 className: "p-6", children:
          _jsxDEV("form", {
 onSubmit: handleSubmit, className: "flex flex-col gap-4", children: [
            _jsxDEV(TextField, {
              label: "Party / team",
              required: true,
              value: form.party,
              onChange: (e) => {return setForm((p) => {return { ...p, party: e.target.value };});},
              placeholder: "e.g. Progress Party" 
}, void 0, false
            ),
            _jsxDEV("div", {
 children: [
              _jsxDEV("label", {
 className: "mb-1.5 block text-sm font-medium text-navy-700", children: ["Photo ",
                _jsxDEV("span", { className: "text-red-500", children: "*" }, void 0, false)] 
}, void 0, true
              ),
              _jsxDEV("div", {
 className: "flex items-center gap-3", children: [
                _jsxDEV("div", {
 className: "h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-navy-200 bg-navy-50", children:
                  form.photoUrl ?
                  _jsxDEV("img", { src: form.photoUrl, alt: "Candidate photo preview", className: "h-full w-full object-cover" }, void 0, false) :

                  _jsxDEV("span", {
 className: "flex h-full w-full items-center justify-center text-navy-300", children:
                    _jsxDEV(Image, { className: "h-6 w-6" }, void 0, false) 
}, void 0, false
                  ) 
}, void 0, false

                ),
                _jsxDEV("input", {
                  ref: fileRef,
                  type: "file",
                  accept: "image/*",
                  className: "hidden",
                  onChange: (e) => {return pickPhoto(e.target.files?.[0]);} 
}, void 0, false
                ),
                _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
                  _jsxDEV(Button, {
 type: "button", variant: "secondary", onClick: () => {return fileRef.current?.click();}, children: [
                    _jsxDEV(Camera, { className: "h-4 w-4" }, void 0, false),
                    form.photoUrl ? "Change photo" : "Upload from gallery"] 
}, void 0, true
                  ),
                  form.photoUrl &&
                  _jsxDEV("button", {
                    type: "button",
                    onClick: () => {return setForm((p) => {return { ...p, photoUrl: "" };});},
                    className: "rounded-lg px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50", children:
                    "Remove" 
}, void 0, false

                  )] 
}, void 0, true

                )] 
}, void 0, true
              ),
              photoError && _jsxDEV("p", { className: "mt-1.5 text-xs text-red-500", children: photoError }, void 0, false),
              _jsxDEV("p", { className: "mt-1.5 text-xs text-navy-400", children: "Upload a clear photo of yourself from your gallery so voters can recognize you." }, void 0, false)] 
}, void 0, true
            ),
            _jsxDEV(TextAreaField, {
              label: "Short bio",
              required: true,
              rows: 4,
              value: form.bio,
              onChange: (e) => {return setForm((p) => {return { ...p, bio: e.target.value };});},
              placeholder: "Tell voters about yourself" 
}, void 0, false
            ),
            _jsxDEV(TextAreaField, {
              label: "Qualifications and experience",
              required: true,
              rows: 3,
              value: form.qualification,
              onChange: (e) => {return setForm((p) => {return { ...p, qualification: e.target.value };});},
              placeholder: "Relevant credentials, experience, or education" 
}, void 0, false
            ),
            _jsxDEV(TextAreaField, {
              label: "Agenda / what you support",
              required: true,
              rows: 4,
              value: form.supports,
              onChange: (e) => {return setForm((p) => {return { ...p, supports: e.target.value };});},
              placeholder: "Key policies or goals" 
}, void 0, false
            ),
            _jsxDEV("div", {
 className: "flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800", children: [
              _jsxDEV(Image, { className: "mt-0.5 h-4 w-4 flex-shrink-0" }, void 0, false), "Your name comes from your verified voter account and cannot be changed in this form."] 
}, void 0, true

            ),
            _jsxDEV(Button, {
              type: "submit",
              loading: saving,
              fullWidth: true,
              disabled: !form.party.trim() || !form.photoUrl.trim() || !form.bio.trim() || !form.qualification.trim() || !form.supports.trim(), children: [

              _jsxDEV(CheckCircle2, { className: "h-4 w-4" }, void 0, false), "Submit candidate profile"] 
}, void 0, true

            )] 
}, void 0, true
          ) 
}, void 0, false
        )] 
}, void 0, true
      ) 
}, void 0, false
    ));

}