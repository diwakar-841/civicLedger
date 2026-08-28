import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Plus, ShieldCheck, Users, Vote, X } from "lucide-react";

const items = [
  { label: "Home", to: "/admin", icon: Home, end: true },
  { label: "Groups", to: "/admin/groups", icon: Users },
  { label: "Elections", to: "/admin/elections", icon: Vote },
  { label: "Profile", to: "/profile", icon: ShieldCheck },
];

export function AdminBottomNav() {
  const [createOpen, setCreateOpen] = useState(false);
  const location = useLocation();

  if (location.pathname.startsWith("/admin/") && (
    location.pathname.includes("/new") ||
    location.pathname.includes("/candidates") ||
    location.pathname.includes("/analytics") ||
    location.pathname.includes("/status")
  )) return null;

  return (
    <>
      {createOpen && (
        <div className="fixed inset-0 z-40 bg-navy-950/20 backdrop-blur-[2px]" onClick={() => setCreateOpen(false)}>
          <div className="absolute bottom-24 left-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-3xl border border-navy-100 bg-white p-3 shadow-elevated dark:border-navy-700 dark:bg-navy-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 pb-2 pt-1">
              <div><p className="eyebrow text-indigo-600">Quick create</p><p className="font-bold text-navy-900 dark:text-white">Start something new</p></div>
              <button className="rounded-xl p-2 text-navy-400 hover:bg-navy-50" onClick={() => setCreateOpen(false)} aria-label="Close create menu"><X className="h-5 w-5" /></button>
            </div>
            <NavLink to="/admin/groups/new" onClick={() => setCreateOpen(false)} className="flex items-center gap-3 rounded-2xl p-3 text-left hover:bg-teal-50">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700"><Users className="h-5 w-5" /></span>
              <span><span className="block font-bold text-navy-900 dark:text-white">Create group</span><span className="text-xs text-navy-500">Bring voters together</span></span>
            </NavLink>
            <NavLink to="/admin/elections/new" onClick={() => setCreateOpen(false)} className="flex items-center gap-3 rounded-2xl p-3 text-left hover:bg-indigo-50">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700"><Vote className="h-5 w-5" /></span>
              <span><span className="block font-bold text-navy-900 dark:text-white">Create election</span><span className="text-xs text-navy-500">Set up a new ballot</span></span>
            </NavLink>
          </div>
        </div>
      )}
      <nav aria-label="Admin navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-navy-100/90 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-18px_rgba(12,20,40,.4)] backdrop-blur-xl dark:border-navy-800 dark:bg-navy-950/95">
        <div className="mx-auto flex h-[4.65rem] max-w-lg items-center justify-around px-2">
          <NavLink to={items[0].to} end className={({ isActive }) => `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`}><Home className="h-5 w-5" /><span>Home</span></NavLink>
          <NavLink to={items[1].to} className={({ isActive }) => `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`}><Users className="h-5 w-5" /><span>Groups</span></NavLink>
          <button onClick={() => setCreateOpen(!createOpen)} aria-label="Create" className={`bottom-nav-create ${createOpen ? "rotate-45 bg-navy-900" : ""}`}><Plus className="h-6 w-6" /></button>
          <NavLink to={items[2].to} className={({ isActive }) => `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`}><Vote className="h-5 w-5" /><span>Elections</span></NavLink>
          <NavLink to={items[3].to} className={({ isActive }) => `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`}><ShieldCheck className="h-5 w-5" /><span>Profile</span></NavLink>
        </div>
      </nav>
    </>
  );
}