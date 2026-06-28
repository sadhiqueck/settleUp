import { useState } from "react";
import { Outlet, useParams, useLocation } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { NavRail, type NavFilter } from "@/components/layout/NavRail";
import { GroupListSidebar } from "@/components/layout/GroupListSidebar";
import { GroupInfoSidebar } from "@/components/layout/GroupInfoSidebar";
import { useGroups, useCreateGroup, useJoinGroup, useGroup } from "@/hooks/useGroups";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InviteMemberModal } from "@/components/groups/InviteMemberModal";
import {
  ClayPlusIcon,
  ClayLinkIcon,
} from "@/components/clay-icons";

const CATEGORIES = [
  { label: "Travel", value: "TRIP" },
  { label: "Home", value: "HOME" },
  { label: "Work", value: "OFFICE" },
  { label: "Friends", value: "FRIENDS" },
  { label: "Other", value: "OTHER" },
];

export function ChatAppLayout() {
  const { id: activeGroupId } = useParams();
  const location = useLocation();
  const hideGroupList =
    !!activeGroupId || location.pathname === "/profile" || location.pathname === "/analytics";
  const { data: groups = [], isLoading, isError, error, refetch } = useGroups();
  const { data: activeGroup } = useGroup(activeGroupId);
  const createGroupMutation = useCreateGroup();
  const joinGroupMutation = useJoinGroup();

  const [navFilter, setNavFilter] = useState<NavFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const CATEGORY_MAP: Record<string, NavFilter> = {
    TRIP: "TRIP",
    TRAVEL: "TRIP",
    HOME: "HOME",
    OFFICE: "OFFICE",
    WORK: "OFFICE",
    FRIENDS: "FRIENDS",
    OTHER: "OTHER",
  };

  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const catKey = g.category.toUpperCase();
    const normalizedCategory = CATEGORY_MAP[catKey] ?? "OTHER";
    const matchesFilter =
      navFilter === "all" || normalizedCategory === navFilter;
    return matchesSearch && matchesFilter;
  });

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createGroupMutation.mutate(
      {
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        description: (formData.get("description") as string) || undefined,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          (e.target as HTMLFormElement).reset();
        },
      },
    );
  };

  const handleJoinSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inviteCode = new FormData(e.currentTarget).get("inviteCode") as string;
    if (inviteCode) {
      joinGroupMutation.mutate(inviteCode, {
        onSuccess: () => {
          setJoinOpen(false);
          (e.target as HTMLFormElement).reset();
        },
      });
    }
  };

  return (
    <div className="chat-shell-wrapper">
      <div className="chat-shell">
        <NavRail
          activeFilter={navFilter}
          onFilterChange={setNavFilter}
          groupCount={groups.length}
          onCreateGroup={() => setCreateOpen(true)}
        />

        <div className={`chat-middle-container ${hideGroupList ? "hidden md:flex" : "flex"}`}>
          <GroupListSidebar
            groups={filteredGroups}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={isLoading}
            onJoinGroup={() => setJoinOpen(true)}
          />

          {isError ? (
            <div className="chat-main-panel flex flex-col items-center justify-center gap-4 px-8">
              <AlertCircle size={48} className="text-coral-red" />
              <p className="text-muted-foreground text-center max-w-sm">
                {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                  "Could not load groups."}
              </p>
              <button onClick={() => refetch()} className="clay-btn-primary px-6 py-2 text-sm">
                Try again
              </button>
            </div>
          ) : isLoading ? (
            <div className="chat-main-panel flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <Outlet />
          )}
        </div>

        {activeGroup && activeGroupId && (
          <GroupInfoSidebar
            group={activeGroup}
            onInvite={() => setInviteOpen(true)}
          />
        )}
      </div>

      {/* Create Group Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="clay-card-elevated border-0 ring-0 rounded-3xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="clay-card p-2">
                <ClayPlusIcon size={28} />
              </div>
              <div>
                <DialogTitle className="font-display text-lg font-bold">
                  Create new group
                </DialogTitle>
                <DialogDescription>
                  Start splitting expenses with your crew.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="group-name" className="font-display font-semibold text-sm">
                Group name
              </Label>
              <Input id="group-name" name="name" placeholder="Weekend trip" className="clay-input" required disabled={createGroupMutation.isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-category" className="font-display font-semibold text-sm">
                Category
              </Label>
              <select id="group-category" name="category" className="clay-input text-sm cursor-pointer" required disabled={createGroupMutation.isPending}>
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description" className="font-display font-semibold text-sm">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <textarea id="group-description" name="description" placeholder="What's this group about?" className="clay-input min-h-16 resize-none" rows={2} disabled={createGroupMutation.isPending} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="clay-btn-ghost" disabled={createGroupMutation.isPending}>
                Cancel
              </Button>
              <button type="submit" disabled={createGroupMutation.isPending} className="clay-btn-primary px-6 py-2 text-sm font-display font-bold flex items-center gap-2">
                {createGroupMutation.isPending && <Loader2 className="animate-spin" size={16} />}
                Create group
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="clay-card-elevated border-0 ring-0 rounded-3xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="clay-card p-2">
                <ClayLinkIcon size={28} />
              </div>
              <div>
                <DialogTitle className="font-display text-lg font-bold">
                  Join a group
                </DialogTitle>
                <DialogDescription>
                  Enter the invite code from your friend.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="invite-code" className="font-display font-semibold text-sm">
                Invite code
              </Label>
              <Input id="invite-code" name="inviteCode" placeholder="ABC-12345" className="clay-input text-center text-lg font-mono tracking-widest" required disabled={joinGroupMutation.isPending} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setJoinOpen(false)} className="clay-btn-ghost" disabled={joinGroupMutation.isPending}>
                Cancel
              </Button>
              <button type="submit" disabled={joinGroupMutation.isPending} className="clay-btn-primary px-6 py-2 text-sm font-display font-bold flex items-center gap-2">
                {joinGroupMutation.isPending && <Loader2 className="animate-spin" size={16} />}
                Join group
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {activeGroup && activeGroupId && (
        <InviteMemberModal
          isOpen={inviteOpen}
          onOpenChange={setInviteOpen}
          groupId={activeGroupId}
          groupName={activeGroup.name}
          inviteCode={activeGroup.inviteCode}
        />
      )}
    </div>
  );
}
