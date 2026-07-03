import { User as UserIcon, Bell, Key, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileSidebarProps {
  className?: string;
  activeTab?: string;
}

export function ProfileSidebar({ className, activeTab = "personal" }: ProfileSidebarProps) {
  return (
    <aside className={cn("chat-list-panel flex-col h-full", className)}>
      <div className="p-4 md:p-6 border-b border-border/10 shrink-0">
        <h2 className="font-display font-extrabold text-xl text-foreground flex items-center gap-2">
          <Settings size={20} className="text-primary" /> Settings
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2">
        <button
          className={cn(
            "flex items-center gap-3 w-full chat-info-card p-4 text-left font-display font-bold text-sm transition-colors",
            activeTab === "personal"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-white"
          )}
        >
          <UserIcon size={18} /> Personal info
        </button>
        <button
          className={cn(
            "flex items-center gap-3 w-full chat-info-card p-4 text-left font-display font-bold text-sm transition-colors",
            activeTab === "notifications"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-white"
          )}
        >
          <Bell size={18} /> Notifications
        </button>
        <button
          className={cn(
            "flex items-center gap-3 w-full chat-info-card p-4 text-left font-display font-bold text-sm transition-colors",
            activeTab === "security"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-white"
          )}
        >
          <Key size={18} /> Security
        </button>
        <button
          className={cn(
            "flex items-center gap-3 w-full chat-info-card p-4 text-left font-display font-bold text-sm transition-colors",
            activeTab === "preferences"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-white"
          )}
        >
          <Settings size={18} /> Preferences
        </button>
      </div>
    </aside>
  );
}
