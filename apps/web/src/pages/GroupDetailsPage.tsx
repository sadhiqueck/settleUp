import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ShoppingCart,
  User as UserIcon,
  /*Calendar*/ Info,
  Loader2,
  Plus,
  LogOut,
} from "lucide-react";
import { useGroup, useLeaveGroup } from "@/hooks/useGroups";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { InviteMemberModal } from "@/components/groups/InviteMemberModal";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export default function GroupDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"feed" | "balances" | "activity">(
    "feed",
  );
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { data: group, isLoading, error } = useGroup(id);
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
            <div className="space-y-4">
              {!group.expenses || group.expenses.length === 0 ? (
                <div className="clay-card p-12 flex flex-col items-center justify-center text-center animate-clay-fade-up">
                  <div className="clay-card p-4 mb-4 bg-soft-clay">
                    <ClayReceiptIcon
                      size={40}
                      className="text-muted-foreground opacity-50"
                    />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-1">
                    No expenses yet
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-50 mx-auto">
                    Start by adding your first expense to the group!
                  </p>
                  <Button
                    onClick={() => setIsAddExpenseOpen(true)}
                    className="clay-btn-primary mt-6 px-8 h-11 text-xs"
                  >
                    Add First Expense
                  </Button>
                </div>
              ) : (
                <>
                  {group.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="clay-card p-5 flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="size-12 rounded-2xl bg-soft-clay flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                          {expense.category === "Food" ? (
                            <ShoppingCart size={20} className="text-primary" />
                          ) : expense.category === "Transport" ? (
                            <span className="text-xl">🛵</span>
                          ) : (
                            <span className="text-xl">🏠</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display font-bold text-base truncate">
                            {expense.title}
                          </h4>
                          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-foreground">
                              {expense.paidBy === "You"
                                ? "You"
                                : expense.paidBy}
                            </span>{" "}
                            paid •{" "}
                            <span className="flex items-center gap-0.5">
                              <Clock size={10} /> {expense.date}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-sans font-bold text-lg">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="py-8 flex flex-col items-center justify-center opacity-60">
                    <p className="text-sm font-medium text-muted-foreground">
                      You've reached the beginning.
                    </p>
                  </div>
                </>
              )}
            </div>
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
                        <button className="clay-btn-secondary text-xs px-4 py-2 shrink-0 shadow-sm">
                          Mark Settled
                        </button>
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
                      <Clock size={10} /> {item.timestamp}
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
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="clay-card-elevated border-0 ring-0 rounded-3xl max-w-md">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="clay-card p-2">
                <ClayReceiptIcon size={28} />
              </div>
              <div>
                <DialogTitle className="font-display text-lg font-bold">
                  Add an Expense
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Log a new purchase for {group.name}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsAddExpenseOpen(false);
            }}
            className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto px-1 pb-2"
          >
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="expense-title"
                className="font-display font-bold text-sm"
              >
                What was this for?
              </Label>
              <Input
                id="expense-title"
                placeholder="e.g. Dinner"
                className="clay-input"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="expense-amount"
                className="font-display font-bold text-sm"
              >
                Amount
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                  ₹
                </span>
                <Input
                  id="expense-amount"
                  type="number"
                  placeholder="0"
                  className="clay-input pl-9"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="expense-category"
                className="font-display font-bold text-sm"
              >
                Category
              </Label>
              <select
                id="expense-category"
                className="clay-input text-sm cursor-pointer border-r-8 border-transparent"
              >
                <option value="Food">Food & Dining</option>
                <option value="Transport">Transport</option>
                <option value="Home">Home & Airbnb</option>
                <option value="General">General Expense</option>
              </select>
            </div>

            <div className="bg-soft-clay rounded-2xl p-4 mt-2 mb-2">
              <p className="text-sm font-semibold mb-2">Split Details</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Split Type
                </span>
                <Badge className="clay-badge text-[10px] items-center">
                  EQUAL SPLIT
                </Badge>
              </div>
              <Separator className="clay-divider my-3" />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="participating"
                  defaultChecked
                  className="size-4 accent-primary rounded-md"
                />
                <label htmlFor="participating" className="text-sm font-medium">
                  Split equally between all 5 members
                </label>
              </div>
            </div>

            <DialogFooter className="mt-2 border-none">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddExpenseOpen(false)}
                className="clay-btn-ghost font-display"
              >
                Cancel
              </Button>
              <button
                type="submit"
                className="clay-btn-primary px-6 py-2.5 text-sm font-display shadow-lg"
              >
                Log Expense
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Invite Member Modal ── */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        groupId={id!}
        groupName={group.name}
        inviteCode={group.inviteCode}
      />
    </div>
  );
}
