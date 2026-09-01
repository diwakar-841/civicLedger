import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  Save,
  LockKeyhole,
  UserRoundCog,
} from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { TextAreaField, TextField } from "../components/shared/Input";
import { Spinner } from "../components/shared/Spinner";
import { UserProfileCard } from "../components/profile/UserProfileCard";
import { useAuthContext } from "../contexts/AuthContext";
import { apiClient } from "../lib/apiClient";
import { fileToCompressedDataUrl } from "../lib/imageUpload";

export function ProfilePage() {
  const { user, refreshUser } = useAuthContext();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    bio: user?.bio || "",
    qualifications: user?.qualifications || "",
    experience: user?.experience || "",
    profilePhotoUrl: user?.profilePhotoUrl || "",
  });

  useEffect(() => {
    if (!user || isEditing) return;
    setFormData({
      fullName: user.fullName || "",
      bio: user.bio || "",
      qualifications: user.qualifications || "",
      experience: user.experience || "",
      profilePhotoUrl: user.profilePhotoUrl || "",
    });
  }, [user, isEditing]);

  async function pickPhoto(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    try {
      const compressed = await fileToCompressedDataUrl(file);
      setFormData((prev) => ({ ...prev, profilePhotoUrl: compressed }));
      setPhotoError(null);
    } catch {
      setPhotoError("Could not read that image. Try another one.");
    }
  }

  async function handleSave() {
    if (!user) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await apiClient.put(`/users/${user.id}/profile`, formData);
      await refreshUser();
      setIsEditing(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to save profile";
      console.error("Profile save error:", error);
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <Spinner label="Loading profile" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg text-navy-600 hover:bg-navy-100 dark:text-navy-400 dark:hover:bg-navy-800"
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="eyebrow text-indigo-600">Account</p>
          <h1 className="mt-1 text-3xl font-extrabold text-navy-900 dark:text-navy-50">
            Admin profile
          </h1>
          <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
            Manage your identity and account preferences.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <UserProfileCard user={user} isEditing={isEditing} />
      </div>

      {!isEditing ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={() => setIsEditing(true)} fullWidth>
            <UserRoundCog className="h-4 w-4" />
            Edit profile
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate("/settings/security")}
            fullWidth
          >
            <LockKeyhole className="h-4 w-4" />
            Security settings
          </Button>
        </div>
      ) : (
        <Card className="flex flex-col gap-4 p-6 dark:bg-navy-900 dark:border-navy-700">
          <TextField
            label="Full Name"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            placeholder="Your full name"
            required
            maxLength={120}
          />
          <TextAreaField
            label="Bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell people a little about yourself"
            rows={3}
            maxLength={2000}
          />
          <TextAreaField
            label="Qualifications"
            value={formData.qualifications}
            onChange={(e) =>
              setFormData({ ...formData, qualifications: e.target.value })
            }
            placeholder="Your education, certifications, or qualifications"
            rows={3}
            maxLength={2000}
          />
          <TextAreaField
            label="Experience"
            value={formData.experience}
            onChange={(e) =>
              setFormData({ ...formData, experience: e.target.value })
            }
            placeholder="Your work, community, or volunteer experience"
            rows={3}
            maxLength={2000}
          />
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-navy-500 dark:text-navy-400">
              Profile photo
            </label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-navy-200 bg-navy-50 dark:border-navy-700 dark:bg-navy-800">
                {formData.profilePhotoUrl ? (
                  <img
                    src={formData.profilePhotoUrl}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-lg font-extrabold text-navy-400">
                    {(formData.fullName || "?")[0]?.toUpperCase()}
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
                  {formData.profilePhotoUrl
                    ? "Change photo"
                    : "Upload from gallery"}
                </Button>
                {formData.profilePhotoUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, profilePhotoUrl: "" }))
                    }
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
          </div>
          <p className="text-xs text-navy-500 dark:text-navy-400">
            Email, phone number, and date of birth are verified identity details
            and cannot be changed here.
          </p>
          {saveError && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            >
              {saveError}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              fullWidth
              className="flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditing(false);
                setSaveError(null);
                setPhotoError(null);
                setFormData({
                  fullName: user.fullName || "",
                  bio: user.bio || "",
                  qualifications: user.qualifications || "",
                  experience: user.experience || "",
                  profilePhotoUrl: user.profilePhotoUrl || "",
                });
              }}
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </Layout>
  );
}
