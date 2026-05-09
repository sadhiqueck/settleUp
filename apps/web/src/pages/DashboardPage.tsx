import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ClayWalletIcon,
  ClayMoneyIcon,
  ClayGroupIcon,
  ClayPlusIcon,
  ClayLinkIcon,
  // ClayReceiptIcon,
  ClayChartIcon,
  ClayBellIcon,
  ClayArrowRightIcon,
} from "@/components/clay-icons";
import {
  LogOut,
  ChevronRight,
  Clock,
  Users,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useGroups, useCreateGroup, useJoinGroup } from "@/hooks/useGroups";
import type { GroupData } from "@/hooks/useGroups";

const CATEGORIES = [
  { label: "Travel", value: "TRIP" },
  { label: "Home", value: "HOME" },
  { label: "Work", value: "OFFICE" },
  { label: "Friends", value: "FRIENDS" },
  { label: "Other", value: "OTHER" },
];

/* ═══════════════════════════════════════════════ */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

/* ─── Stat Card ─── */
function StatCard({
  icon,
  label,
  value,
  variant,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant: "green" | "red" | "neutral";
  delay: string;
}) {
  return (
    <div
      className="clay-card-elevated p-6 flex items-center gap-5 animate-clay-fade-up"
      style={{ opacity: 0, animationDelay: delay }}
    >
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground font-display font-medium truncate">
          {label}
        </p>
        <p
          className={`text-2xl font-bold font-sans mt-1 ${variant === "green"
              ? "clay-stat-green"
              : variant === "red"
                ? "clay-stat-red"
                : "text-foreground"
            }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─── Group Card ─── */
function GroupCard({ group, delay }: { group: GroupData; delay: string }) {
  const navigate = useNavigate();

  const categoryColors: Record<string, string> = {
    Travel: "clay-badge-green",
    Home: "clay-badge-neutral",
    Food: "clay-badge-green",
    Sports: "clay-badge-neutral",
    Entertainment: "clay-badge-green",
    Shopping: "clay-badge-neutral",
    Other: "clay-badge-neutral",
  };

  return (
    <Card
      onClick={() => navigate(`/groups/${group.id}`)}
      className="clay-card border-0 ring-0 p-0 cursor-pointer group animate-clay-fade-up overflow-visible"
      style={{ opacity: 0, animationDelay: delay }}
    >
      <CardHeader className="pb-3 pt-6 px-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="clay-card p-2 shrink-0">
              <ClayGroupIcon size={28} />
            </div>
            <div className="min-w-0">
              <CardTitle className="font-display text-base font-bold truncate">
                {group.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 mt-0.5">
                <Users size={13} />
                <span>{group.memberCount} members</span>
              </CardDescription>
            </div>
          </div>
          <span
            className={`clay-badge ${categoryColors[group.category] || "clay-badge-neutral"} text-[11px]`}
          >
            {group.category}
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-3">
        {/* Avatar stack */}
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {group.members.slice(0, 4).map((member, i) => (
              <Avatar
                key={i}
                className="clay-avatar size-8 border-2 border-white"
              >
                <AvatarFallback
                  className="text-xs font-bold text-white"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initial}
                </AvatarFallback>
              </Avatar>
            ))}
            {group.memberCount > 4 && (
              <Avatar className="clay-avatar size-8 border-2 border-white">
                <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                  +{group.memberCount - 4}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Total spent</p>
            <p className="text-sm font-bold font-sans">
              {formatCurrency(group.totalExpense)}
            </p>
          </div>
        </div>

        <Separator className="clay-divider my-4" />

        {/* Balance & activity */}
        <div className="flex items-center justify-between">
          <div>
            {group.userBalance > 0 ? (
              <p className="text-sm font-semibold clay-stat-green">
                You are owed {formatCurrency(group.userBalance)}
              </p>
            ) : group.userBalance < 0 ? (
              <p className="text-sm font-semibold clay-stat-red">
                You owe {formatCurrency(group.userBalance)}
              </p>
            ) : (
              <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                ✅ All settled up
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={12} />
            <span>{group.lastActivity}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-6 pb-5">
        <Button
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/groups/${group.id}`);
          }}
          className="w-full clay-btn-ghost text-sm font-display font-semibold gap-2 hover:text-primary"
        >
          View Details
          <ChevronRight
            size={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ─── Empty State ─── */
function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 animate-clay-scale-in"
      style={{ opacity: 0 }}
    >
      <div className="clay-card-elevated p-8 rounded-full mb-6">
        <ClayGroupIcon size={72} />
      </div>
      <h3 className="font-display text-2xl font-bold text-foreground mb-2">
        No groups yet
      </h3>
      <p className="text-muted-foreground font-display text-center max-w-sm">
        Create your first group to start tracking expenses with friends and
        family.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Loading Skeleton
   ═══════════════════════════════════════════════ */
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="clay-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="font-display text-2xl font-extrabold text-foreground tracking-tight">
            Settle<span className="text-neon-green">Up</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-muted animate-pulse" />
            <div className="size-9 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="h-9 w-72 bg-muted rounded-xl animate-pulse" />
          <div className="h-5 w-96 bg-muted rounded-lg animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="clay-card-elevated p-6 h-24 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="clay-card p-6 h-56 animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Error State
   ═══════════════════════════════════════════════ */
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 animate-clay-scale-in"
      style={{ opacity: 0 }}
    >
      <div className="clay-card-elevated p-8 rounded-full mb-6 bg-red-500/10">
        <AlertCircle size={72} className="text-red-500" />
      </div>
      <h3 className="font-display text-2xl font-bold text-foreground mb-2">
        Something went wrong
      </h3>
      <p className="text-muted-foreground font-display text-center max-w-sm mb-6">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="clay-btn-primary px-6 py-2.5 text-sm font-display font-bold"
      >
        Try Again
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Dashboard Page
   ═══════════════════════════════════════════════ */
export default function DashboardPage() {
  const { data: groups = [], isLoading, isError, error, refetch } = useGroups();
  const createGroupMutation = useCreateGroup();
  const joinGroupMutation = useJoinGroup();

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Get user from localStorage (set during login)
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userName = user?.name?.split(" ")[0] || "there";
  const userInitials = user?.name
    ? user.name
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "U";

  // Loading state
  if (isLoading) return <DashboardSkeleton />;

  // Aggregate stats
  const totalOwed = groups.reduce(
    (sum, g) => sum + (g.userBalance > 0 ? g.userBalance : 0),
    0,
  );
  const totalOwe = groups.reduce(
    (sum, g) => sum + (g.userBalance < 0 ? Math.abs(g.userBalance) : 0),
    0,
  );

  // Filter groups
  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Handle create group form submission
  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;

    createGroupMutation.mutate(
      { name, category, description: description || undefined },
      {
        onSuccess: () => {
          setCreateOpen(false);
          (e.target as HTMLFormElement).reset();
        },
      },
    );
  };

  const handleJoinSubmit = (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const inviteCode = formData.get("inviteCode") as string;
    if (inviteCode) {
      joinGroupMutation.mutate(inviteCode, {
        onSuccess: () => {
          setJoinOpen(false);
          (e.target as HTMLFormElement).reset();
        },
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Navigation ── */}
      <nav className="clay-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-extrabold text-foreground tracking-tight">
              Settle<span className="text-neon-green">Up</span>
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="clay-btn-ghost rounded-full size-10 relative"
            >
              <ClayBellIcon size={22} />
              {/* Notification dot */}
              <span className="absolute top-1.5 right-1.5 size-2.5 bg-coral-red rounded-full ring-2 ring-white" />
            </Button>

            <button
              onClick={() => navigate("/profile")}
              className="clay-card p-0.5 rounded-full cursor-pointer hover:scale-105 transition-transform"
            >
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold font-display text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>

            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-coral-red"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8 animate-clay-fade-up" style={{ opacity: 0 }}>
          <h2 className="font-display text-3xl font-bold text-foreground">
            Hey, <span className="text-neon-green">{userName}</span> 👋
          </h2>
          <p className="text-muted-foreground font-display mt-1">
            Here's your expense overview across all groups.
          </p>
        </div>

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <StatCard
            icon={<ClayWalletIcon size={44} />}
            label="You are owed"
            value={formatCurrency(totalOwed)}
            variant="green"
            delay="0.1s"
          />
          <StatCard
            icon={<ClayMoneyIcon size={44} />}
            label="You owe"
            value={formatCurrency(totalOwe)}
            variant="red"
            delay="0.2s"
          />
          <StatCard
            icon={<ClayGroupIcon size={44} />}
            label="Active groups"
            value={String(groups.length)}
            variant="neutral"
            delay="0.3s"
          />
        </div>

        {/* ── Action Bar ── */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-clay-fade-up"
          style={{ opacity: 0, animationDelay: "0.35s" }}
        >
          <div className="flex items-center gap-3">
            <h3 className="font-display text-xl font-bold text-foreground">
              Your Groups
            </h3>
            <Badge className="clay-badge clay-badge">
              {filteredGroups.length}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="clay-input pl-9 pr-4 py-2 text-sm h-auto w-full sm:w-56"
              />
            </div>

            {/* Create Group */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <button className="clay-btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
                  <ClayPlusIcon size={20} />
                  <span className="font-display font-bold">Create Group</span>
                </button>
              </DialogTrigger>
              <DialogContent className="clay-card-elevated border-0 ring-0 rounded-3xl">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="clay-card p-2">
                      <ClayPlusIcon size={28} />
                    </div>
                    <div>
                      <DialogTitle className="font-display text-lg font-bold">
                        Create New Group
                      </DialogTitle>
                      <DialogDescription>
                        Start splitting expenses with your crew.
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <form
                  onSubmit={handleCreateGroup}
                  className="flex flex-col gap-5"
                >
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="group-name"
                      className="font-display font-semibold text-sm"
                    >
                      Group Name
                    </Label>
                    <Input
                      id="group-name"
                      name="name"
                      placeholder="e.g. Weekend Trip"
                      className="clay-input"
                      required
                      disabled={createGroupMutation.isPending}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="group-category"
                      className="font-display font-semibold text-sm"
                    >
                      Category
                    </Label>
                    <select
                      id="group-category"
                      name="category"
                      className="clay-input text-sm cursor-pointer"
                      required
                      disabled={createGroupMutation.isPending}
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="group-description"
                      className="font-display font-semibold text-sm"
                    >
                      Description{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <textarea
                      id="group-description"
                      name="description"
                      placeholder="What's this group about?"
                      className="clay-input min-h-20 resize-none"
                      rows={3}
                      disabled={createGroupMutation.isPending}
                    />
                  </div>

                  {createGroupMutation.isError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
                      <AlertCircle size={18} />
                      <p className="text-sm font-medium">
                        {(createGroupMutation.error as { response?: { data?: { message?: string } } })?.response?.data
                          ?.message || "Failed to create group"}
                      </p>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCreateOpen(false)}
                      className="clay-btn-ghost font-display"
                      disabled={createGroupMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <button
                      type="submit"
                      disabled={createGroupMutation.isPending}
                      className="clay-btn-primary px-6 py-2.5 text-sm font-display font-bold flex items-center gap-2"
                    >
                      {createGroupMutation.isPending && (
                        <Loader2 className="animate-spin" size={16} />
                      )}
                      {createGroupMutation.isPending
                        ? "Creating..."
                        : "Create Group"}
                    </button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Join Group */}
            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <button className="clay-btn-ghost flex items-center gap-2 text-sm px-5 py-2.5">
                  <ClayLinkIcon size={20} />
                  <span className="font-display font-semibold">Join Group</span>
                </button>
              </DialogTrigger>
              <DialogContent className="clay-card-elevated border-0 ring-0 rounded-3xl">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="clay-card p-2">
                      <ClayLinkIcon size={28} />
                    </div>
                    <div>
                      <DialogTitle className="font-display text-lg font-bold">
                        Join a Group
                      </DialogTitle>
                      <DialogDescription>
                        Enter the invite code shared by your friend.
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <form
                  onSubmit={handleJoinSubmit}
                  className="flex flex-col gap-5"
                >
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="invite-code"
                      className="font-display font-semibold text-sm"
                    >
                      Invite Code
                    </Label>
                    <Input
                      id="invite-code"
                      name="inviteCode"
                      placeholder="e.g. ABC-12345"
                      className="clay-input text-center text-lg font-mono tracking-widest"
                      required
                      disabled={joinGroupMutation.isPending}
                    />
                  </div>

                  {joinGroupMutation.isError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
                      <AlertCircle size={18} />
                      <p className="text-sm font-medium">
                        {(joinGroupMutation.error as {  response?: { data?: { message?: string } } })?.response?.data
                          ?.message || "Failed to join group. Check the code."}
                      </p>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setJoinOpen(false)}
                      className="clay-btn-ghost font-display"
                      disabled={joinGroupMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <button
                      type="submit"
                      disabled={joinGroupMutation.isPending}
                      className="clay-btn-primary px-6 py-2.5 text-sm font-display font-bold flex items-center gap-2"
                    >
                      {joinGroupMutation.isPending && (
                        <Loader2 className="animate-spin" size={16} />
                      )}
                      {joinGroupMutation.isPending ? "Joining..." : "Join Group"}
                    </button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── Group Grid ── */}
        {isError ? (
          <ErrorState
            message={
              (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
              "Could not load your groups. Please try again."
            }
            onRetry={() => refetch()}
          />
        ) : filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredGroups.map((group, i) => (
              <GroupCard
                key={group.id}
                group={group}
                delay={`${0.4 + i * 0.1}s`}
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            className="flex flex-col items-center justify-center py-16 animate-clay-fade-up"
            style={{ opacity: 0 }}
          >
            <div className="clay-card-pressed p-6 rounded-full mb-4">
              <Search size={32} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-display text-lg">
              No groups match "
              <span className="font-semibold">{searchQuery}</span>"
            </p>
          </div>
        )}

        {/* ── Quick Actions Footer ── */}
        <div
          className="mt-12 clay-card-elevated p-8 flex flex-col sm:flex-row items-center justify-between gap-6 animate-clay-fade-up"
          style={{ opacity: 0, animationDelay: "0.8s" }}
        >
          <div className="flex items-center gap-4">
            <div className="clay-card p-3">
              <ClayChartIcon size={36} />
            </div>
            <div>
              <h4 className="font-display text-lg font-bold text-foreground">
                Spending Insights
              </h4>
              <p className="text-sm text-muted-foreground">
                View analytics and trends across all your groups.
              </p>
            </div>
          </div>
          <button className="clay-btn-secondary flex items-center gap-2 text-sm font-display font-semibold shrink-0">
            Coming Soon
            <ClayArrowRightIcon size={16} />
          </button>
        </div>
      </main>
    </div>
  );
}
