import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClayGroupIcon,
  ClayReceiptIcon,
  ClayWalletIcon,
  ClayBellIcon,
  ClayPlusIcon,
  ClayArrowRightIcon,
  ClayCheckIcon,
} from "@/components/clay-icons";
import {
  ArrowLeft,
  Clock,
  User as UserIcon,
  Info,
  Loader2,
  Plus,
  LogOut,
  Users,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import type { GroupExpense, GroupMember } from "@/hooks/useGroups";
import { useGroup, useLeaveGroup } from "@/hooks/useGroups";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { InviteMemberModal } from "@/components/groups/InviteMemberModal";
import { AddExpenseModal } from "@/components/groups/AddExpenseModal";
import { EditExpenseModal } from "@/components/groups/EditExpenseModal";
import { DeleteExpenseDialog } from "@/components/groups/DeleteExpenseDialog";
import { UpiPayButton } from "@/components/groups/UpiPayButton";
import { MarkAsPaidDialog } from "@/components/groups/MarkAsPaidDialog";
import { useUserProfile } from "@/hooks/useUser";
import type { GroupSettlement } from "@/hooks/useGroups";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

const CATEGORY_CONFIG: Record<
  string,
  { emoji: string; bg: string; label: string }
> = {
  FOOD: { emoji: "🍕", bg: "bg-orange-50", label: "Food" },
  TRANSPORT: { emoji: "🚕", bg: "bg-blue-50", label: "Transport" },
  ACCOMMODATION: { emoji: "🏨", bg: "bg-purple-50", label: "Stay" },
  SHOPPING: { emoji: "🛍️", bg: "bg-pink-50", label: "Shopping" },
  ENTERTAINMENT: { emoji: "🎬", bg: "bg-yellow-50", label: "Fun" },
  UTILITIES: { emoji: "💡", bg: "bg-teal-50", label: "Utilities" },
  RENT: { emoji: "🏠", bg: "bg-indigo-50", label: "Rent" },
  OTHER: { emoji: "📦", bg: "bg-gray-50", label: "Other" },
};

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function groupExpensesByDate(
  expenses: GroupExpense[],
): { label: string; expenses: GroupExpense[] }[] {
  const groups: Map<string, GroupExpense[]> = new Map();
  const today = new Date();
  for (const exp of expenses) {
    const d = new Date(exp.date);
    const isToday = d.toDateString() === today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const label = isToday
      ? "Today"
      : isYesterday
        ? "Yesterday"
        : new Intl.DateTimeFormat("en-IN", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }).format(d);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(exp);
  }
  return Array.from(groups.entries()).map(([label, expenses]) => ({
    label,
    expenses,
  }));
}

/* ── Expense Feed Component ── */
function ExpenseFeed({
  expenses,
  onAddExpense,
  currentUserId,
  onEditExpense,
  onDeleteExpense,
  members,
}: {
  expenses: GroupExpense[];
  onAddExpense: () => void;
  currentUserId: string | undefined;
  onEditExpense: (expense: GroupExpense) => void;
  onDeleteExpense: (expense: GroupExpense) => void;
  members: GroupMember[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dateGroups = useMemo(
    () => groupExpensesByDate(expenses ?? []),
    [expenses],
  );

  if (!expenses || expenses.length === 0) {
    return (
      <div className="clay-card p-12 flex flex-col items-center justify-center text-center animate-clay-fade-up">
        <div className="clay-card p-4 mb-4 bg-soft-clay">
          <ClayReceiptIcon
            size={40}
            className="text-muted-foreground opacity-50"
          />
        </div>
        <h3 className="font-display font-bold text-lg mb-1">No expenses yet</h3>
        <p className="text-sm text-muted-foreground max-w-55 mx-auto">
          Start by adding your first expense to the group!
        </p>
        <Button
          onClick={onAddExpense}
          className="clay-btn-primary mt-6 px-8 h-11 text-xs"
        >
          Add First Expense
        </Button>
      </div>
    );
  }

  let itemIndex = 0;

  return (
    <div className="space-y-6">
      {dateGroups.map((group) => (
        <div key={group.label}>
          {/* Date Header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="font-display font-extrabold text-xs uppercase tracking-widest text-muted-foreground">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-linear-to-r from-border to-transparent" />
          </div>

          {/* Expense Cards */}
          <div className="space-y-3">
            {group.expenses.map((expense) => {
              const cat =
                CATEGORY_CONFIG[expense.category] ?? CATEGORY_CONFIG.OTHER;
              const delay = Math.min(itemIndex++ * 0.05, 0.4);
              const isOwnExpense = expense.paidById === currentUserId;
              return (
                <div
                  key={expense.id}
                  className="clay-card p-0 overflow-hidden group animate-clay-fade-up"
                  style={{ opacity: 0, animationDelay: `${delay}s` }}
                >
                  {/* Main row — clickable to expand */}
                  <div
                    className="flex items-center gap-4 p-4 sm:p-5 cursor-pointer select-none"
                    onClick={() => setExpandedId(expandedId === expense.id ? null : expense.id)}
                  >
                    {/* Category Icon */}
                    <div
                      className={`size-12 rounded-2xl ${cat.bg} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300`}
                    >
                      <span className="text-xl">{cat.emoji}</span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-[15px] truncate">
                          {expense.title}
                        </h4>
                        <Badge className="clay-badge clay-badge-neutral text-[10px] px-2 py-0 shrink-0 hidden sm:inline-flex">
                          {cat.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-1">
                        <span className="font-semibold text-foreground">
                          {expense.paidBy}
                        </span>{" "}
                        paid
                        <span className="text-border">•</span>
                        <Clock size={10} className="opacity-60" />
                        <span>{formatRelativeDate(expense.date)}</span>
                        {expense.splitCount > 1 && (
                          <>
                            <span className="text-border">•</span>
                            <Users size={10} className="opacity-60" />
                            <span>Split {expense.splitCount}</span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Amount + Actions + Chevron */}
                    <div className="flex items-center gap-3 shrink-0 pl-2">
                      <div className="text-right">
                        <p className="font-sans font-bold text-lg tracking-tight">
                          {formatCurrency(expense.amount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                          {expense.splitMethod === "EQUAL"
                            ? "Equal"
                            : expense.splitMethod.toLowerCase()}
                        </p>
                      </div>
                      {/* Edit/Delete actions (only for payer's own expenses) */}
                      {isOwnExpense && (
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditExpense(expense); }}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title="Edit expense"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteExpense(expense); }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      <ChevronDown
                        size={16}
                        className={`text-muted-foreground transition-transform duration-300 ${expandedId === expense.id ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>

                  {/* Expandable split breakdown */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      expandedId === expense.id ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                      <div className="border-t border-border/50 pt-4 space-y-3">
                        {/* Section header */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <Users size={12} className="text-primary" />
                          Split Details ({expense.splits.length} members)
                        </div>

                        {/* Unified split list */}
                        <div className="space-y-1.5">
                          {expense.splits.map((split) => {
                            const isPayer = split.userId === expense.paidById;
                            return (
                              <div
                                key={split.userId}
                                className="flex items-center gap-3 clay-card-pressed px-3 py-2.5 rounded-xl"
                              >
                                <div
                                  className={`size-7 rounded-full flex items-center justify-center shrink-0 ${
                                    isPayer ? "bg-primary/15" : "bg-amber-500/15"
                                  }`}
                                >
                                  <span
                                    className={`text-[11px] font-bold ${
                                      isPayer ? "text-primary" : "text-amber-700"
                                    }`}
                                  >
                                    {split.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-semibold text-foreground truncate">
                                    {split.name}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground font-medium">
                                    {isPayer ? "Paid the bill" : `Share: ${formatCurrency(split.amount)}`}
                                  </span>
                                </div>
                                <div className="ml-auto shrink-0">
                                  {isPayer ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                      Paid
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-500/10 px-2.5 py-1 rounded-full">
                                      Owes {formatCurrency(split.amount)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* End of feed */}
      <div className="py-6 flex flex-col items-center justify-center">
        <div className="w-8 h-1 rounded-full bg-border mb-3 opacity-40" />
        <p className="text-xs font-medium text-muted-foreground opacity-50">
          You've reached the beginning
        </p>
      </div>
    </div>
  );
}

export default function GroupDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"feed" | "balances" | "activity">(
    "feed",
  );
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<GroupExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<GroupExpense | null>(null);
  const [settlingPayment, setSettlingPayment] = useState<GroupSettlement | null>(null);
  const { data: group, isLoading, error } = useGroup(id);
  const { data: currentUser } = useUserProfile();
  const leaveGroupMutation = useLeaveGroup();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        Error: {error.message}
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center h-screen">
        Group not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      {/* ── Top Navigation ── */}
      <nav className="clay-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="clay-btn-ghost size-10 p-0 rounded-full flex items-center justify-center shrink-0"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </Button>

          <div className="flex-1 min-w-0 px-4 text-center">
            <h1 className="font-display text-xl font-bold text-foreground truncate">
              {group.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="clay-btn-ghost rounded-full size-10 relative shrink-0"
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to leave this group? Make sure your balance is 0.",
                  )
                ) {
                  leaveGroupMutation.mutate(id!, {
                    onSuccess: () => navigate("/"),
                    onError: (error: Error) => {
                      const err = error as AxiosError<{ message: string }>;
                      toast.error(
                        err.response?.data?.message || "Failed to leave group",
                      );
                    },
                  });
                }
              }}
              disabled={leaveGroupMutation.isPending}
            >
              {leaveGroupMutation.isPending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <LogOut size={20} className="text-red-500" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="clay-btn-ghost rounded-full size-10 relative shrink-0"
            >
              <ClayBellIcon size={22} />
            </Button>
          </div>
        </div>
      </nav>

      <main
        className="max-w-3xl mx-auto px-6 py-8 animate-clay-fade-up"
        style={{ opacity: 0 }}
      >
        {/* ── Header ── */}
        <div className="clay-card-elevated p-8 mb-8 flex flex-col items-center text-center relative overflow-hidden">
          {/* Subtle bg glow */}
          <div
            className="absolute top-[-50%] left-[-10%] w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, #00C700 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />

          <div className="clay-card p-3 mb-4 z-10">
            <ClayGroupIcon size={48} />
          </div>

          <h2 className="font-display text-3xl font-extrabold text-foreground z-10">
            {group.name}
          </h2>
          <div className="flex items-center gap-2 mt-2 mb-6 z-10">
            <Badge className="clay-badge clay-badge text-[11px] uppercase tracking-wider px-3">
              {group.category}
            </Badge>
            <span className="text-muted-foreground text-sm flex items-center gap-1 font-medium">
              <UserIcon size={14} /> {group.memberCount} members
            </span>
          </div>

          {/* Avatar stack */}
          <div className="flex items-center justify-center -space-x-3 mb-8 z-10">
            {group.members.map((member) => (
              <Avatar
                key={member.id}
                className="clay-avatar size-10 border-2 border-white ring-2 ring-background"
              >
                {member.avatarUrl && (
                  <AvatarImage
                    src={member.avatarUrl}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                  />
                )}
                <AvatarFallback
                  className="font-bold text-white text-sm"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initial}
                </AvatarFallback>
              </Avatar>
            ))}
            <div
              onClick={() => setIsInviteModalOpen(true)}
              className="clay-avatar size-10 border-2 border-white ring-2 ring-background bg-soft-clay flex items-center justify-center rounded-full text-xs font-bold text-muted-foreground cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <Plus size={18} />
            </div>
          </div>

          {/* Group Total */}
          <div className="w-full clay-card-pressed p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-xl p-2 shadow-sm">
                <ClayReceiptIcon size={24} />
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Total Group Spend
                </p>
                <p className="text-xl font-bold font-sans text-foreground">
                  {formatCurrency(group.totalExpense)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="clay-btn-ghost text-xs px-4 h-9"
            >
              View Report
            </Button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex bg-soft-clay p-1 rounded-2xl mb-6 shadow-inner">
          <button
            onClick={() => setActiveTab("feed")}
            className={`flex-1 py-2.5 rounded-xl font-display font-bold text-sm transition-all ${
              activeTab === "feed"
                ? "bg-white text-foreground shadow-sm scale-100"
                : "text-muted-foreground hover:text-foreground scale-95"
            }`}
          >
            Expense Feed
          </button>
          <button
            onClick={() => setActiveTab("balances")}
            className={`flex-1 py-2.5 rounded-xl font-display font-bold text-sm transition-all ${
              activeTab === "balances"
                ? "bg-white text-foreground shadow-sm scale-100"
                : "text-muted-foreground hover:text-foreground scale-95"
            }`}
          >
            Balances & Settlement
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex-1 py-2.5 rounded-xl font-display font-bold text-sm transition-all ${
              activeTab === "activity"
                ? "bg-white text-foreground shadow-sm scale-100"
                : "text-muted-foreground hover:text-foreground scale-95"
            }`}
          >
            Activity
          </button>
        </div>

        {/* ── Sections ── */}
        <div
          className="animate-clay-fade-up"
          style={{ opacity: 0, animationDelay: "0.1s" }}
        >
          {activeTab === "feed" ? (
            <ExpenseFeed
              expenses={group.expenses}
              onAddExpense={() => setIsAddExpenseOpen(true)}
              currentUserId={currentUser?.id}
              onEditExpense={(expense) => setEditingExpense(expense)}
              onDeleteExpense={(expense) => setDeletingExpense(expense)}
              members={group.members}
            />
          ) : activeTab === "balances" ? (
            <div className="space-y-8">
              {/* Balances */}
              <div>
                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                  <ClayWalletIcon size={24} /> Group Balances
                </h3>
                <div className="clay-card-elevated p-6 space-y-5">
                  {group.balances.map((member) => (
                    <div
                      key={member.memberId}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 shadow-sm">
                          <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-display font-semibold text-sm">
                          {member.name}
                        </span>
                      </div>
                      <div className="text-right">
                        {member.balance > 0 ? (
                          <span className="clay-stat-green text-sm font-bold font-sans">
                            gets back {formatCurrency(member.balance)}
                          </span>
                        ) : member.balance < 0 ? (
                          <span className="clay-stat-red text-sm font-bold font-sans">
                            owes {formatCurrency(Math.abs(member.balance))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm font-semibold">
                            settled
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settlement Suggestions */}
              <div>
                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                  <Info size={22} className="text-secondary" /> Optimized
                  Settlements
                </h3>
                <div className="space-y-3">
                  {group.settlements.map((settle, i) => (
                    <div
                      key={i}
                      className="clay-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-sm bg-soft-clay px-3 py-1 rounded-full">
                          {settle.from}
                        </span>
                        <ClayArrowRightIcon
                          size={16}
                          className="text-muted-foreground mx-1"
                        />
                        <span className="font-display font-bold text-sm bg-soft-clay px-3 py-1 rounded-full">
                          {settle.to}
                        </span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        <span className="font-sans font-bold text-lg">
                          {formatCurrency(settle.amount)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSettlingPayment(settle)}
                            className="clay-btn-secondary text-xs px-4 py-2 shrink-0 shadow-sm flex items-center gap-1.5 hover:scale-[1.02] transition-transform"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            Mark Paid
                          </button>
                          <UpiPayButton
                            receiverVpa={settle.toVpa}
                            receiverName={settle.to}
                            amount={settle.amount}
                            groupName={group.name}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {group.activity.map((item) => (
                <div
                  key={item.id}
                  className="clay-card p-4 flex items-start gap-4"
                >
                  <div className="size-10 rounded-full bg-soft-clay flex items-center justify-center shrink-0">
                    {item.type === "expense" ? (
                      <ClayReceiptIcon size={20} />
                    ) : item.type === "settlement" ? (
                      <ClayCheckIcon size={20} />
                    ) : (
                      <Info size={16} className="text-secondary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium">
                      <span className="font-bold text-foreground">
                        {item.user}
                      </span>{" "}
                      {item.action}{" "}
                      {item.target && (
                        <span className="font-bold text-foreground">
                          {item.target}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock size={10} /> {formatRelativeDate(item.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Quick Add Floating Action Button ── */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="clay-btn-primary size-16 rounded-full flex items-center justify-center p-0 shadow-2xl hover:scale-105 active:scale-95 group"
        >
          <ClayPlusIcon
            size={32}
            className="transition-transform group-hover:rotate-90"
          />
        </button>
      </div>

      {/* ── Add Expense Modal ── */}
      <AddExpenseModal
        key={isAddExpenseOpen ? "open" : "closed"}
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        groupId={group.id}
        groupName={group.name}
        members={group.members}
      />

      {/* ── Invite Member Modal ── */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        groupId={id!}
        groupName={group.name}
        inviteCode={group.inviteCode}
      />

      {/* ── Edit Expense Modal ── */}
      {editingExpense && (
        <EditExpenseModal
          isOpen={true}
          onClose={() => setEditingExpense(null)}
          groupId={group.id}
          expense={editingExpense}
        />
      )}

      {/* ── Delete Expense Dialog ── */}
      {deletingExpense && (
        <DeleteExpenseDialog
          isOpen={true}
          onClose={() => setDeletingExpense(null)}
          groupId={group.id}
          expenseId={deletingExpense.id}
          expenseTitle={deletingExpense.title}
          expenseAmount={deletingExpense.amount}
        />
      )}

      {/* ── Mark as Paid Dialog ── */}
      {settlingPayment && (
        <MarkAsPaidDialog
          isOpen={true}
          onClose={() => setSettlingPayment(null)}
          groupId={group.id}
          fromName={settlingPayment.from}
          fromId={settlingPayment.fromId}
          toName={settlingPayment.to}
          toId={settlingPayment.toId}
          amount={settlingPayment.amount}
        />
      )}
    </div>
  );
}
