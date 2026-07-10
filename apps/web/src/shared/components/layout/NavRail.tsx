import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Briefcase,
  Home,
  Users,
  Archive,
  Plus,
} from "lucide-react";
import { useUserProfile } from "@/shared/hooks/useUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";

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
        className="hidden md:flex mb-6 size-10 rounded-xl items-center justify-center cursor-pointer hover:scale-105 transition-transform"
        title="SettleUp"
      >
        <img
          src="/icon-192x192.png"
          alt="SettleUp Logo"
          className="size-10 rounded-xl object-contain drop-shadow-md"
        />
      </button>

      {/* Category filters */}
      <nav className="flex flex-row md:flex-col items-center justify-start md:justify-center gap-1 md:flex-initial w-full md:w-auto overflow-x-auto md:overflow-visible no-scrollbar px-2 md:px-0">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onFilterChange(id)}
            className={`chat-nav-item shrink-0 ${activeFilter === id ? "chat-nav-item-active" : ""}`}
            title={label}
          >
            <Icon size={20} strokeWidth={1.75} />
            <span className="text-[9px] font-semibold leading-none">{label}</span>
            {id === "all" && groupCount > 0 && (
              <span className="chat-nav-badge">{groupCount}</span>
            )}
          </button>
        ))}

        <div className="hidden md:block w-8 h-px bg-white/10 my-2 shrink-0" />
        <div className="md:hidden h-8 w-px bg-white/10 mx-2 shrink-0" />

        <button
          onClick={() => navigate("/analytics")}
          className={`chat-nav-item shrink-0 ${location.pathname === "/analytics" ? "chat-nav-item-active" : ""}`}
          title="Analytics"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
          <span className="text-[9px] font-semibold">Charts</span>
        </button>

        <button
          onClick={onCreateGroup}
          className="chat-nav-item hover:text-primary shrink-0"
          title="Create group"
        >
          <Plus size={22} strokeWidth={2} />
          <span className="text-[9px] font-semibold">New</span>
        </button>
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-row md:flex-col items-center gap-1 md:mt-auto shrink-0 pr-2 md:pr-0">
        <div className="md:hidden h-8 w-px bg-white/10 mx-2 shrink-0" />
        <button
          onClick={() => navigate("/profile")}
          className={`chat-nav-item shrink-0 p-1 ${isProfile ? "chat-nav-item-active" : ""}`}
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
      </div>
    </aside>
  );
}
