import { User, Mail, Phone, Calendar, BookOpen, Briefcase, ShieldCheck } from "lucide-react";
import { Card } from "../shared/Card";

interface UserProfileCardProps {
  user: {
    fullName: string;
    email: string;
    phone?: string | null;
    dob?: string | null;
    bio?: string | null;
    qualifications?: string | null;
    experience?: string | null;
    profilePhotoUrl?: string | null;
  };
  isEditing?: boolean;
}

export function UserProfileCard({ user, isEditing }: UserProfileCardProps) {
  return (
    <Card className="flex flex-col gap-6 p-6 dark:bg-navy-900 dark:border-navy-700">
      <div className="flex flex-col gap-4 border-b border-navy-100 pb-6 sm:flex-row sm:items-center sm:gap-5 dark:border-navy-800">
        {user.profilePhotoUrl ? (
          <img
            src={user.profilePhotoUrl}
            alt={user.fullName}
            className="h-20 w-20 flex-shrink-0 rounded-2xl object-cover ring-4 ring-indigo-50"
          />
        ) : <span className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-extrabold text-white shadow-lg shadow-indigo-600/20">{user.fullName.slice(0, 1).toUpperCase()}</span>}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-bold text-navy-900 dark:text-navy-50">{user.fullName}</h2><span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700"><ShieldCheck className="h-3 w-3" />Administrator</span></div>
        <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
          {user.bio || "Manage elections and trusted civic participation from your account."}
        </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 flex-shrink-0 text-gold-400 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-navy-500 dark:text-navy-400">Email</p>
            <p className="text-sm text-navy-700 dark:text-navy-200 break-all">{user.email}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 flex-shrink-0 text-gold-400 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase text-navy-500 dark:text-navy-400">Phone</p>
              <p className="text-sm text-navy-700 dark:text-navy-200">{user.phone || "Not added yet"}</p>
            </div>
        </div>

        <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 flex-shrink-0 text-gold-400 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase text-navy-500 dark:text-navy-400">Date of Birth</p>
              <p className="text-sm text-navy-700 dark:text-navy-200">
                {user.dob ? new Date(user.dob).toLocaleDateString() : "Not added yet"}
              </p>
            </div>
        </div>
      </div>

      <div className="border-t border-navy-100 pt-5 dark:border-navy-800"><div className="flex gap-3">
          <BookOpen className="h-5 w-5 flex-shrink-0 text-gold-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase text-navy-500 dark:text-navy-400">Qualifications</p>
            <p className="mt-1 text-sm text-navy-700 dark:text-navy-200 whitespace-pre-wrap">
              {user.qualifications || "Not added yet"}
            </p>
          </div>
      </div></div>

      <div className="flex gap-3">
          <Briefcase className="h-5 w-5 flex-shrink-0 text-gold-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase text-navy-500 dark:text-navy-400">Experience</p>
            <p className="mt-1 text-sm text-navy-700 dark:text-navy-200 whitespace-pre-wrap">
              {user.experience || "Not added yet"}
            </p>
          </div>
      </div>
    </Card>
  );
}
