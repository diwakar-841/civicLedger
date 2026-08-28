import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ClipboardList, LayoutDashboard, LogOut, Menu, Moon, Search, Settings, ShieldCheck, Sun, User, Vote, X } from "lucide-react";
import { useAuthContext } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useCandidateRequests } from "../../hooks/useCandidateRequests";
import { useNotifications } from "../../hooks/useNotifications";
import { Button } from "../shared/Button";
import { GlobalSearchBar } from "./GlobalSearchBar";

function UserAvatar({ photoUrl, name }: { photoUrl?: string | null; name?: string | null }) {
  const [error, setError] = useState(false);
  if (photoUrl && !error) return <img src={photoUrl} alt={name ?? "User avatar"} onError={() => setError(true)} className="h-9 w-9 rounded-full object-cover ring-2 ring-indigo-100" />;
  return <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white"><User className="h-4 w-4" /></span>;
}

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuthContext();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { requests } = useCandidateRequests();
  const { notifications } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pending = requests.filter((r) => r.status === "pending").length;
  const unread = notifications.filter((n) => !n.isRead).length;

  async function signOut() { setMenuOpen(false); await logout(); navigate("/login"); }
  const navClass = "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-navy-500 transition hover:bg-indigo-50 hover:text-indigo-700";
  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100/80 bg-white/90 shadow-sm backdrop-blur-xl dark:border-navy-800 dark:bg-navy-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <Link to={isAuthenticated ? "/profile" : "/elections"} onClick={close} className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"><Vote className="h-5 w-5" /></span>
          <div className="leading-tight"><p className="font-extrabold tracking-tight text-navy-900 dark:text-white">Civic Ledger</p><p className="hidden text-[10px] font-bold uppercase tracking-[.14em] text-navy-400 xs:block">Trusted voting</p></div>
        </Link>
        {isAuthenticated && <>
          <nav className="hidden items-center gap-1 lg:flex">
            {isAdmin ? <><Link to="/admin" className={navClass}><LayoutDashboard className="h-4 w-4" />Dashboard</Link><Link to="/admin/elections" className={navClass}><ClipboardList className="h-4 w-4" />Elections</Link></> : <Link to="/elections" className={navClass}><Vote className="h-4 w-4" />Elections</Link>}
            <Link to="/requests" className={navClass}><ClipboardList className="h-4 w-4" />Requests{pending > 0 && <span className="rounded-full bg-rose-100 px-1.5 text-[10px] text-rose-600">{pending}</span>}</Link>
          </nav>
          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(!searchOpen)} className="flex h-10 w-10 items-center justify-center rounded-xl text-navy-500 hover:bg-indigo-50 hover:text-indigo-700" aria-label="Search">{searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}</button>
            <Link to="/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-navy-500 hover:bg-indigo-50 hover:text-indigo-700"><Bell className="h-5 w-5" />{unread > 0 && <span className="absolute right-1 top-1 h-4 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[9px] font-bold leading-4 text-white">{unread > 9 ? "9+" : unread}</span>}</Link>
            <div className="ml-2 hidden items-center gap-2 border-l border-navy-100 pl-3 sm:flex"><UserAvatar photoUrl={(user as any)?.profilePhotoUrl} name={user?.fullName} /><span className="max-w-[120px] truncate text-xs font-bold text-navy-600">{user?.fullName}</span></div>
            <button onClick={() => { toggle(); }} className="hidden h-10 w-10 items-center justify-center rounded-xl text-navy-500 hover:bg-indigo-50 hover:text-indigo-700 sm:flex" aria-label="Toggle theme">{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex h-10 w-10 items-center justify-center rounded-xl text-navy-500 hover:bg-indigo-50 lg:hidden" aria-label="Menu">{menuOpen ? <X /> : <Menu />}</button>
          </div>
        </>}
      </div>
      {isAuthenticated && searchOpen && <div className="border-t border-navy-100 bg-white px-4 py-3 dark:border-navy-800 dark:bg-navy-950"><div className="mx-auto max-w-7xl sm:max-w-md"><GlobalSearchBar autoFocus onClose={() => setSearchOpen(false)} /></div></div>}
      {isAuthenticated && menuOpen && <div className="border-t border-navy-100 bg-white px-4 pb-4 pt-3 shadow-lg lg:hidden dark:border-navy-800 dark:bg-navy-950">
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-indigo-50 p-3 text-sm font-bold text-navy-700"><ShieldCheck className="h-4 w-4 text-indigo-600" />{user?.fullName}</div>
        <Link to={isAdmin ? "/admin" : "/elections"} onClick={close} className={navClass}>{isAdmin ? <LayoutDashboard className="h-4 w-4" /> : <Vote className="h-4 w-4" />}{isAdmin ? "Dashboard" : "Elections"}</Link>
        {isAdmin && <><Link to="/admin/elections" onClick={close} className={navClass}><ClipboardList className="h-4 w-4" />Elections</Link><Link to="/admin/audit-log" onClick={close} className={navClass}><ClipboardList className="h-4 w-4" />Audit log</Link></>}
        <Link to="/requests" onClick={close} className={navClass}><ClipboardList className="h-4 w-4" />Requests{pending > 0 && <span className="ml-auto rounded-full bg-rose-100 px-1.5 text-[10px] text-rose-600">{pending}</span>}</Link>
        <Link to="/notifications" onClick={close} className={navClass}><Bell className="h-4 w-4" />Notifications{unread > 0 && <span className="ml-auto rounded-full bg-rose-100 px-1.5 text-[10px] text-rose-600">{unread}</span>}</Link>
        <Link to="/profile" onClick={close} className={navClass}><User className="h-4 w-4" />Profile</Link><Link to="/settings/security" onClick={close} className={navClass}><Settings className="h-4 w-4" />Security</Link>
        <button onClick={() => { toggle(); close(); }} className={navClass}>{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{theme === "dark" ? "Light mode" : "Dark mode"}</button>
        <Button variant="ghost" size="sm" onClick={signOut} className="mt-1 w-full justify-start"><LogOut className="h-4 w-4" />Sign out</Button>
      </div>}
    </header>
  );
}