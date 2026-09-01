import { NavLink } from "react-router-dom";
import { Home, ShieldCheck, Users, Vote } from "lucide-react";

export function UserBottomNav() {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-navy-100/90 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-18px_rgba(12,20,40,.4)] backdrop-blur-xl dark:border-navy-800 dark:bg-navy-950/95"
    >
      <div className="mx-auto flex h-[4.65rem] max-w-lg items-center justify-around px-2">
        <NavLink
          to="/home"
          end
          className={({ isActive }) =>
            `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`
          }
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </NavLink>
        <NavLink
          to="/groups"
          className={({ isActive }) =>
            `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`
          }
        >
          <Users className="h-5 w-5" />
          <span>Groups</span>
        </NavLink>
        <NavLink
          to="/my-elections"
          className={({ isActive }) =>
            `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`
          }
        >
          <Vote className="h-5 w-5" />
          <span>My Elections</span>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`
          }
        >
          <ShieldCheck className="h-5 w-5" />
          <span>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
