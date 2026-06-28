import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Phone,
  MoreVertical,
  LogOut,
  Loader2,
  Paperclip,
  Mic,
  Send,
  Wallet,
  Info,
  ArrowLeft,
} from "lucide-react";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ClayArrowRightIcon,
  ClayWalletIcon,
  ClayReceiptIcon,
} from "@/components/clay-icons";
import type { GroupDetailsData, GroupExpense, GroupSettlement } from "@/hooks/useGroups";
import { useLeaveGroup } from "@/hooks/useGroups";
import { useUserProfile } from "@/hooks/useUser";
import { InviteMemberModal } from "@/components/groups/InviteMemberModal";
import { AddExpenseModal } from "@/components/groups/AddExpenseModal";
import { EditExpenseModal } from "@/components/groups/EditExpenseModal";
import { DeleteExpenseDialog } from "@/components/groups/DeleteExpenseDialog";
import { UpiPayButton } from "@/components/groups/UpiPayButton";
import { MarkAsPaidDialog } from "@/components/groups/MarkAsPaidDialog";
import {
  ExpenseMessageBubble,
  ActivityBubble,
} from "@/components/chat/ExpenseMessageBubble";
import { formatCurrency, formatRelativeDate } from "@/lib/format";

type ChatView = "expenses" | "balances" | "activity";

interface GroupChatPanelProps {
  group: GroupDetailsData;
}

function groupExpensesByDate(
  expenses: GroupExpense[],
): { label: string; expenses: GroupExpense[] }[] {
  const groups = new Map<string, GroupExpense[]>();
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
  return Array.from(groups.entries()).map(([label, exps]) => ({
    label,
    expenses: exps,
  }));
}

export function GroupChatPanel({ group }: GroupChatPanelProps) {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatView, setChatView] = useState<ChatView>("expenses");
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<GroupExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<GroupExpense | null>(null);
  const [settlingPayment, setSettlingPayment] = useState<GroupSettlement | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const { data: currentUser } = useUserProfile();
  const leaveGroupMutation = useLeaveGroup();

  const dateGroups = useMemo(
    () => groupExpensesByDate(group.expenses ?? []),
    [group.expenses],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [group.expenses, chatView]);

  const onlineCount = Math.max(1, Math.floor(group.memberCount * 0.4));

  const handleLeaveGroup = () => {
    if (
      window.confirm(
        "Leave this group? Make sure your balance is settled first.",
      )
    ) {
      leaveGroupMutation.mutate(group.id, {
        onSuccess: () => navigate("/dashboard"),
        onError: (error: Error) => {
          const err = error as AxiosError<{ message: string }>;
          toast.error(err.response?.data?.message || "Failed to leave group");
        },
      });
    }
  };

  return (
    <div className="chat-main-panel">
      {/* Header */}
      <header className="chat-header">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="md:hidden size-9 rounded-full flex items-center justify-center hover:bg-soft-clay transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-lg font-extrabold text-foreground">
              {group.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {group.memberCount} members · {onlineCount} active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full size-9 text-muted-foreground">
            <Search size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full size-9 text-muted-foreground">
            <Phone size={18} />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full size-9 text-muted-foreground"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={18} />
            </Button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 clay-card py-1 min-w-[160px] animate-clay-scale-in">
                  <button
                    onClick={() => { setIsInviteModalOpen(true); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-soft-clay font-medium"
                  >
                    Invite members
                  </button>
                  <button
                    onClick={() => { handleLeaveGroup(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-red-50 text-rose-500 font-medium flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    Leave group
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* View tabs */}
      <div className="shrink-0 flex gap-1 px-6 py-2 border-b border-border/20 bg-[#fafbfc]">
        {(
          [
            { id: "expenses" as const, label: "Expenses", icon: ClayReceiptIcon },
            { id: "balances" as const, label: "Balances", icon: ClayWalletIcon },
            { id: "activity" as const, label: "Activity", icon: Info },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setChatView(id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-display font-bold transition-all ${
              chatView === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Messages / content area */}
      <div className="chat-messages">
        {chatView === "expenses" && (
          <>
            {(!group.expenses || group.expenses.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="clay-card p-5 rounded-full mb-4">
                  <ClayReceiptIcon size={40} className="text-muted-foreground opacity-50" />
                </div>
                <h3 className="font-display font-bold text-lg mb-1">No expenses yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Add your first expense using the bar below — it will show up as a message in this thread.
                </p>
              </div>
            ) : (
              dateGroups.map((dg) => (
                <div key={dg.label}>
                  <div className="chat-date-divider">
                    <span>{dg.label}</span>
                  </div>
                  <div className="space-y-4">
                    {dg.expenses.map((expense) => (
                      <ExpenseMessageBubble
                        key={expense.id}
                        expense={expense}
                        isOwn={expense.paidById === currentUser?.id}
                        onEdit={() => setEditingExpense(expense)}
                        onDelete={() => setDeletingExpense(expense)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {chatView === "balances" && (
          <div className="space-y-6 max-w-lg mx-auto">
            <div className="chat-info-card">
              <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
                <ClayWalletIcon size={20} /> Group balances
              </h3>
              <div className="space-y-3">
                {group.balances.map((member) => (
                  <div key={member.memberId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px] font-bold bg-primary text-primary-foreground">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold">{member.name}</span>
                    </div>
                    {member.balance > 0 ? (
                      <span className="clay-stat-green text-sm font-bold">
                        +{formatCurrency(member.balance)}
                      </span>
                    ) : member.balance < 0 ? (
                      <span className="clay-stat-red text-sm font-bold">
                        −{formatCurrency(Math.abs(member.balance))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">settled</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {group.settlements.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2 px-1">
                  <Wallet size={16} className="text-primary" /> Suggested payments
                </h3>
                <div className="space-y-2">
                  {group.settlements.map((settle, i) => (
                    <div key={i} className="chat-info-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <span className="font-bold bg-soft-clay px-2.5 py-1 rounded-full">{settle.from}</span>
                        <ClayArrowRightIcon size={14} className="text-muted-foreground" />
                        <span className="font-bold bg-soft-clay px-2.5 py-1 rounded-full">{settle.to}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{formatCurrency(settle.amount)}</span>
                        <button
                          onClick={() => setSettlingPayment(settle)}
                          className="clay-btn-secondary text-[10px] px-3 py-1.5"
                        >
                          Mark paid
                        </button>
                        <UpiPayButton
                          receiverVpa={settle.toVpa}
                          receiverName={settle.to}
                          amount={settle.amount}
                          groupName={group.name}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {chatView === "activity" && (
          <div className="space-y-3 max-w-lg mx-auto">
            {group.activity.map((item) => (
              <ActivityBubble
                key={item.id}
                user={item.user}
                action={item.action}
                target={item.target}
                timestamp={formatRelativeDate(item.timestamp)}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      {chatView === "expenses" && (
        <div className="chat-input-bar">
          <button className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-soft-clay transition-colors">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            placeholder="Add an expense..."
            readOnly
            onClick={() => setIsAddExpenseOpen(true)}
            className="chat-input-field cursor-pointer"
          />
          <button className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-soft-clay transition-colors">
            <Mic size={20} />
          </button>
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="chat-send-btn"
          >
            <Send size={18} />
          </button>
        </div>
      )}

      {/* Modals */}
      <AddExpenseModal
        key={isAddExpenseOpen ? "open" : "closed"}
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        groupId={group.id}
        groupName={group.name}
        members={group.members}
      />
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        groupId={group.id}
        groupName={group.name}
        inviteCode={group.inviteCode}
      />
      {editingExpense && (
        <EditExpenseModal
          isOpen
          onClose={() => setEditingExpense(null)}
          groupId={group.id}
          expense={editingExpense}
        />
      )}
      {deletingExpense && (
        <DeleteExpenseDialog
          isOpen
          onClose={() => setDeletingExpense(null)}
          groupId={group.id}
          expenseId={deletingExpense.id}
          expenseTitle={deletingExpense.title}
          expenseAmount={deletingExpense.amount}
        />
      )}
      {settlingPayment && (
        <MarkAsPaidDialog
          isOpen
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

export function GroupChatLoading() {
  return (
    <div className="chat-main-panel flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );
}

export function GroupChatEmpty() {
  return (
    <div className="chat-main-panel flex flex-col items-center justify-center text-center px-8">
      <div
        className="size-24 rounded-3xl flex items-center justify-center mb-6 font-display font-extrabold text-3xl text-white"
        style={{
          background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
          boxShadow: "0 8px 32px rgba(0, 199, 0, 0.3)",
        }}
      >
        SU
      </div>
      <h2 className="font-display text-2xl font-extrabold text-foreground mb-2">
        Settle<span className="text-emerald-500">Up</span>
      </h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        Select a group from the sidebar to view expenses, balances, and settlements — all in one conversation-style feed.
      </p>
    </div>
  );
}
