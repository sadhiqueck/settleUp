import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Briefcase,
  Home,
  Users,
  Archive,
  LogOut,
  Plus,
} from "lucide-react";
import { useLogout, useUserProfile } from "@/hooks/useUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type NavFilter = "all" | "TRIP" | "HOME" | "OFFICE" | "FRIENDS" | "OTHER";

interface NavRailProps {
  activeFilter: NavFilter;
  onFilterChange: (filter: NavFilter) => void;
  groupCount: number;
  onCreateGroup: () => void;
}

const NAV_ITEMS: { id: NavFilter; label: string; icon: typeof LayoutGrid }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "OFFICE", label: "Work", icon: Briefcase },
  { id: "FRIENDS", label: "Friends", icon: Users },
  { id: "TRIP", label: "Travel", icon: Home },
  { id: "OTHER", label: "Archive", icon: Archive },
];

export function NavRail({
  activeFilter,
  onFilterChange,
  groupCount,
  onCreateGroup,
}: NavRailProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const logoutMutation = useLogout();
  const { data: userProfile } = useUserProfile();

  const userInitials = userProfile?.name
    ? userProfile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const isProfile = location.pathname === "/profile";

  return (
    <aside className="chat-nav-rail">
      {/* Logo */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-6 size-10 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
        title="SettleUp"
      >
        <div
          className="size-9 rounded-xl flex items-center justify-center font-display font-extrabold text-sm text-white"
          style={{
            background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
          }}
        >
          S
        </div>
      </button>

      {/* Category filters */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onFilterChange(id)}
            className={`chat-nav-item ${activeFilter === id ? "chat-nav-item-active" : ""}`}
            title={label}
          >
            <Icon size={20} strokeWidth={1.75} />
            <span className="text-[9px] font-semibold leading-none">{label}</span>
            {id === "all" && groupCount > 0 && (
              <span className="chat-nav-badge">{groupCount}</span>
            )}
          </button>
        ))}

        <div className="w-8 h-px bg-white/10 my-2" />

        <button
          onClick={() => navigate("/analytics")}
          className={`chat-nav-item ${location.pathname === "/analytics" ? "chat-nav-item-active" : ""}`}
          title="Analytics"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
          <span className="text-[9px] font-semibold">Charts</span>
        </button>

        <button
          onClick={onCreateGroup}
          className="chat-nav-item hover:text-primary"
          title="Create group"
        >
          <Plus size={22} strokeWidth={2} />
          <span className="text-[9px] font-semibold">New</span>
        </button>
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-1 mt-auto">
        <button
          onClick={() => navigate("/profile")}
          className={`chat-nav-item p-1 ${isProfile ? "chat-nav-item-active" : ""}`}
          title="Profile"
        >
          <Avatar className="size-8">
            {userProfile?.avatarUrl && (
              <AvatarImage
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                referrerPolicy="no-referrer"
              />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-[9px] font-semibold">Profile</span>
        </button>

        <button
          onClick={() => logoutMutation.mutate()}
          className="chat-nav-item hover:text-rose-500"
          title="Log out"
        >
          <LogOut size={18} />
          <span className="text-[9px] font-semibold">Exit</span>
        </button>
      </div>
    </aside>
  );
}
