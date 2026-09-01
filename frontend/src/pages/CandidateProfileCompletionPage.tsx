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
import { fileToCompressedDataUrl } from "../lib/imageUpload";

export function CandidateProfileCompletionPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { requests, loading, refetch } = useCandidateRequests();
  const { show } = useToast();
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    party: "",
    photoUrl: "",
    bio: "",
    qualification: "",
    supports: "",
  });

  async function pickPhoto(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    try {
      const compressed = await fileToCompressedDataUrl(file);
      setForm((p) => ({ ...p, photoUrl: compressed }));
      setPhotoError(null);
    } catch {
      setPhotoError("Could not read that image. Try another one.");
    }
  }

  const request = requests.find((item) => item.id === requestId);

  useEffect(() => {
    if (request?.status === "accepted" && request.profileCompleted) {
      navigate("/elections", { replace: true });
    }
  }, [request, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!requestId) return;
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
    return (
      <Layout>
        <Spinner label="Loading nomination" />
      </Layout>
    );
  }

  if (!request || request.status !== "accepted") {
    return (
      <Layout>
        <Card className="mx-auto max-w-xl p-6">
          <h1 className="text-xl font-bold text-navy-900">
            Candidate profile unavailable
          </h1>
          <p className="mt-2 text-sm text-navy-500">
            This nomination must be accepted before a profile can be submitted.
          </p>
          <Button className="mt-5" onClick={() => navigate("/elections")}>
            Back to elections
          </Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold-100">
            <ShieldCheck className="h-5 w-5 text-gold-700" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">
              Complete your candidate profile
            </h1>
            <p className="mt-1 text-sm text-navy-500">
              You accepted the nomination for{" "}
              <strong>{request.electionTitle}</strong>. Only you can provide
              these details.
            </p>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField
              label="Party / team"
              required
              value={form.party}
              onChange={(e) =>
                setForm((p) => ({ ...p, party: e.target.value }))
              }
              placeholder="e.g. Progress Party"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-700">
                Photo <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-navy-200 bg-navy-50">
                  {form.photoUrl ? (
                    <img
                      src={form.photoUrl}
                      alt="Candidate photo preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-navy-300">
                      <Image className="h-6 w-6" />
                    </span>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickPhoto(e.target.files?.[0])}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    {form.photoUrl ? "Change photo" : "Upload from gallery"}
                  </Button>
                  {form.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, photoUrl: "" }))}
                      className="rounded-lg px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {photoError && (
                <p className="mt-1.5 text-xs text-red-500">{photoError}</p>
              )}
              <p className="mt-1.5 text-xs text-navy-400">
                Upload a clear photo of yourself from your gallery so voters can
                recognize you.
              </p>
            </div>
            <TextAreaField
              label="Short bio"
              required
              rows={4}
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Tell voters about yourself"
            />
            <TextAreaField
              label="Qualifications and experience"
              required
              rows={3}
              value={form.qualification}
              onChange={(e) =>
                setForm((p) => ({ ...p, qualification: e.target.value }))
              }
              placeholder="Relevant credentials, experience, or education"
            />
            <TextAreaField
              label="Agenda / what you support"
              required
              rows={4}
              value={form.supports}
              onChange={(e) =>
                setForm((p) => ({ ...p, supports: e.target.value }))
              }
              placeholder="Key policies or goals"
            />
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              <Image className="mt-0.5 h-4 w-4 flex-shrink-0" />
              Your name comes from your verified voter account and cannot be
              changed in this form.
            </div>
            <Button
              type="submit"
              loading={saving}
              fullWidth
              disabled={
                !form.party.trim() ||
                !form.photoUrl.trim() ||
                !form.bio.trim() ||
                !form.qualification.trim() ||
                !form.supports.trim()
              }
            >
              <CheckCircle2 className="h-4 w-4" />
              Submit candidate profile
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
