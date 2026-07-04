import { useNavigate, useParams } from "react-router-dom";
import { Search, Pin } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { GroupData } from "@/hooks/useGroups";
import { formatCurrency } from "@/lib/format";

interface GroupListSidebarProps {
  groups: GroupData[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  onJoinGroup?: () => void;
  className?: string;
}

function getLastMessagePreview(group: GroupData): string {
  if (group.userBalance > 0) {
    return `You're owed ${formatCurrency(group.userBalance)}`;
  }
  if (group.userBalance < 0) {
    return `You owe ${formatCurrency(group.userBalance)}`;
  }
  return "All settled up ✓";
}

export function GroupListSidebar({
  groups,
  searchQuery,
  onSearchChange,
  isLoading,
  onJoinGroup,
  className = "",
}: GroupListSidebarProps) {
  const navigate = useNavigate();
  const { id: activeGroupId } = useParams();

  return (
    <aside className={`chat-list-panel ${className}`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-2 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-foreground">
            Groups
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {groups.length} active conversation{groups.length !== 1 ? "s" : ""}
          </p>
        </div>
        {onJoinGroup && (
          <button
            onClick={onJoinGroup}
            className="text-xs font-display font-bold text-primary hover:underline"
          >
            Join
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mx-4 mt-4 mb-3">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="chat-list-search w-full pl-10"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-4">
        {isLoading ? (
          <div className="space-y-3 px-3 py-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl">
                <Skeleton className="size-12 rounded-2xl shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">No groups found</p>
          </div>
        ) : (
          groups.map((group) => {
            const isActive = activeGroupId === group.id;
            const hasBalance = group.userBalance !== 0;

            return (
              <button
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className={`chat-list-item w-[calc(100%-16px)] text-left ${isActive ? "chat-list-item-active" : ""}`}
              >
                <Avatar className="clay-avatar size-12 shrink-0 rounded-2xl bg-[#f0eef9]">
                  <img
                    src={`/icons/${(group.category || 'other').toLowerCase()}.png`}
                    alt={group.category}
                    className="w-full h-full object-cover rounded-2xl mix-blend-multiply"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/icons/other.png' }}
                  />
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-bold text-sm truncate">
                      {group.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {group.lastActivity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p
                      className={`text-xs truncate ${hasBalance ? "font-medium text-foreground" : "text-muted-foreground"}`}
                    >
                      {getLastMessagePreview(group)}
                    </p>
                    {hasBalance && (
                      <span
                        className={`shrink-0 min-w-[20px] h-5 rounded-full text-[10px] font-bold flex items-center justify-center px-1.5 ${
                          group.userBalance > 0
                            ? "bg-emerald-500 text-white"
                            : "bg-rose-500 text-white"
                        }`}
                      >
                        !
                      </span>
                    )}
                    {group.userBalance === 0 && group.memberCount > 5 && (
                      <Pin size={12} className="text-muted-foreground/50 shrink-0" />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
