import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Save, LockKeyhole, UserRoundCog } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { TextAreaField, TextField } from "../components/shared/Input";
import { Spinner } from "../components/shared/Spinner";
import { UserProfileCard } from "../components/profile/UserProfileCard";
import { useAuthContext } from "../contexts/AuthContext";
import { apiClient } from "../lib/apiClient";
import { fileToCompressedDataUrl } from "../lib/imageUpload";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function ProfilePage() {
  const { user, refreshUser } = useAuthContext();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const fileRef = useRef(null);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    bio: user?.bio || "",
    qualifications: user?.qualifications || "",
    experience: user?.experience || "",
    profilePhotoUrl: user?.profilePhotoUrl || ""
  });

  useEffect(() => {
    if (!user || isEditing) {return;}
    setFormData({
      fullName: user.fullName || "",
      bio: user.bio || "",
      qualifications: user.qualifications || "",
      experience: user.experience || "",
      profilePhotoUrl: user.profilePhotoUrl || ""
    });
  }, [user, isEditing]);

  async function pickPhoto(file) {
    if (!file) {return;}
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    try {
      const compressed = await fileToCompressedDataUrl(file);
      setFormData((prev) => {return { ...prev, profilePhotoUrl: compressed };});
      setPhotoError(null);
    } catch {
      setPhotoError("Could not read that image. Try another one.");
    }
  }

  async function handleSave() {
    if (!user) {return;}

    setIsSaving(true);
    setSaveError(null);
    try {
      await apiClient.put(`/users/${user.id}/profile`, formData);
      await refreshUser();
      setIsEditing(false);
    } catch (error) {
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
      _jsxDEV(Layout, {
 children:
        _jsxDEV("div", {
 className: "flex items-center justify-center py-12", children:
          _jsxDEV(Spinner, { label: "Loading profile" }, void 0, false) 
}, void 0, false
        ) 
}, void 0, false
      ));

  }

  return (
    _jsxDEV(Layout, {
 children: [
      _jsxDEV("div", {
 className: "mb-6 flex items-center gap-3", children: [
        _jsxDEV("button", {
          onClick: () => {return navigate(-1);},
          className: "focus-ring flex h-10 w-10 items-center justify-center rounded-lg text-navy-600 hover:bg-navy-100 dark:text-navy-400 dark:hover:bg-navy-800",
          type: "button", children:

          _jsxDEV(ArrowLeft, { className: "h-5 w-5" }, void 0, false) 
}, void 0, false
        ),
        _jsxDEV("div", {
 children: [
          _jsxDEV("p", { className: "eyebrow text-indigo-600", children: "Account" }, void 0, false),
          _jsxDEV("h1", { className: "mt-1 text-3xl font-extrabold text-navy-900 dark:text-navy-50", children: "Admin profile" }, void 0, false),
          _jsxDEV("p", { className: "mt-1 text-sm text-navy-500 dark:text-navy-400", children: "Manage your identity and account preferences." }, void 0, false)] 
}, void 0, true
        )] 
}, void 0, true
      ),

      _jsxDEV("div", {
 className: "mb-6", children:
        _jsxDEV(UserProfileCard, { user: user, isEditing: isEditing }, void 0, false) 
}, void 0, false
      ),

      !isEditing ?
      _jsxDEV("div", {
 className: "grid gap-3 sm:grid-cols-2", children: [
        _jsxDEV(Button, { onClick: () => {return setIsEditing(true);}, fullWidth: true, children: [_jsxDEV(UserRoundCog, { className: "h-4 w-4" }, void 0, false), "Edit profile"] }, void 0, true),
        _jsxDEV(Button, { variant: "secondary", onClick: () => {return navigate("/settings/security");}, fullWidth: true, children: [_jsxDEV(LockKeyhole, { className: "h-4 w-4" }, void 0, false), "Security settings"] }, void 0, true)] 
}, void 0, true
      ) :

      _jsxDEV(Card, {
 className: "flex flex-col gap-4 p-6 dark:bg-navy-900 dark:border-navy-700", children: [
        _jsxDEV(TextField, {
          label: "Full Name",
          value: formData.fullName,
          onChange: (e) => {return setFormData({ ...formData, fullName: e.target.value });},
          placeholder: "Your full name",
          required: true,
          maxLength: 120 
}, void 0, false
        ),
        _jsxDEV(TextAreaField, {
          label: "Bio",
          value: formData.bio,
          onChange: (e) => {return setFormData({ ...formData, bio: e.target.value });},
          placeholder: "Tell people a little about yourself",
          rows: 3,
          maxLength: 2000 
}, void 0, false
        ),
        _jsxDEV(TextAreaField, {
          label: "Qualifications",
          value: formData.qualifications,
          onChange: (e) => {return setFormData({ ...formData, qualifications: e.target.value });},
          placeholder: "Your education, certifications, or qualifications",
          rows: 3,
          maxLength: 2000 
}, void 0, false
        ),
        _jsxDEV(TextAreaField, {
          label: "Experience",
          value: formData.experience,
          onChange: (e) => {return setFormData({ ...formData, experience: e.target.value });},
          placeholder: "Your work, community, or volunteer experience",
          rows: 3,
          maxLength: 2000 
}, void 0, false
        ),
        _jsxDEV("div", {
 children: [
          _jsxDEV("label", { className: "mb-1.5 block text-xs font-bold uppercase tracking-wide text-navy-500 dark:text-navy-400", children: "Profile photo" }, void 0, false

          ),
          _jsxDEV("div", {
 className: "flex items-center gap-3", children: [
            _jsxDEV("div", {
 className: "h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-navy-200 bg-navy-50 dark:border-navy-700 dark:bg-navy-800", children:
              formData.profilePhotoUrl ?
              _jsxDEV("img", { src: formData.profilePhotoUrl, alt: "Profile preview", className: "h-full w-full object-cover" }, void 0, false) :

              _jsxDEV("span", {
 className: "flex h-full w-full items-center justify-center text-lg font-extrabold text-navy-400", children:
                (formData.fullName || "?")[0]?.toUpperCase() 
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
                formData.profilePhotoUrl ? "Change photo" : "Upload from gallery"] 
}, void 0, true
              ),
              formData.profilePhotoUrl &&
              _jsxDEV("button", {
                type: "button",
                onClick: () => {return setFormData((prev) => {return { ...prev, profilePhotoUrl: "" };});},
                className: "rounded-lg px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50", children:
                "Remove" 
}, void 0, false

              )] 
}, void 0, true

            )] 
}, void 0, true
          ),
          photoError && _jsxDEV("p", { className: "mt-1.5 text-xs text-red-500", children: photoError }, void 0, false)] 
}, void 0, true
        ),
        _jsxDEV("p", { className: "text-xs text-navy-500 dark:text-navy-400", children: "Email, phone number, and date of birth are verified identity details and cannot be changed here." }, void 0, false

        ),
        saveError &&
        _jsxDEV("p", {
 role: "alert", className: "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700", children:
          saveError 
}, void 0, false
        ),

        _jsxDEV("div", {
 className: "flex gap-3", children: [
          _jsxDEV(Button, {
            onClick: handleSave,
            disabled: isSaving,
            fullWidth: true,
            className: "flex items-center justify-center gap-2", children: [

            _jsxDEV(Save, { className: "h-4 w-4" }, void 0, false),
            isSaving ? "Saving..." : "Save Changes"] 
}, void 0, true
          ),
          _jsxDEV(Button, {
            variant: "secondary",
            onClick: () => {
              setIsEditing(false);
              setSaveError(null);
              setPhotoError(null);
              setFormData({
                fullName: user.fullName || "",
                bio: user.bio || "",
                qualifications: user.qualifications || "",
                experience: user.experience || "",
                profilePhotoUrl: user.profilePhotoUrl || ""
              });
            },
            fullWidth: true, children:
            "Cancel" 
}, void 0, false

          )] 
}, void 0, true
        )] 
}, void 0, true
      )] 
}, void 0, true

    ));

}