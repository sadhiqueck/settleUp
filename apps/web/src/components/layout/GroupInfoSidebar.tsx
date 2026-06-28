import { useState } from "react";
import { ChevronDown, Users, Receipt, Wallet, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { GroupDetailsData } from "@/hooks/useGroups";
import { formatCurrency } from "@/lib/format";

interface GroupInfoSidebarProps {
  group: GroupDetailsData;
  onInvite: () => void;
}

export function GroupInfoSidebar({ group, onInvite }: GroupInfoSidebarProps) {
  const [filesExpanded, setFilesExpanded] = useState(true);

  const expenseCount = group.expenses?.length ?? 0;
  const categoryCounts = (group.expenses ?? []).reduce(
    (acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <aside className="chat-info-panel hidden xl:flex">
      {/* Group info card */}
      <div className="chat-info-card">
        <h3 className="font-display font-bold text-sm mb-3">Group info</h3>

        <button
          onClick={() => setFilesExpanded(!filesExpanded)}
          className="flex items-center justify-between w-full text-left py-2"
        >
          <span className="text-sm font-semibold flex items-center gap-2">
            <Receipt size={16} className="text-primary" />
            Expenses
          </span>
          <ChevronDown
            size={16}
            className={`text-muted-foreground transition-transform ${filesExpanded ? "rotate-180" : ""}`}
          />
        </button>

        {filesExpanded && (
          <div className="space-y-2 mt-1 pl-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                {expenseCount} total expenses
              </span>
            </div>
            {Object.entries(categoryCounts).slice(0, 4).map(([cat, count]) => (
              <div
                key={cat}
                className="flex items-center justify-between text-xs text-muted-foreground"
              >
                <span className="capitalize">{cat.toLowerCase()}</span>
                <span className="font-semibold text-foreground">{count}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total spent</span>
                <span className="text-sm font-bold">
                  {formatCurrency(group.totalExpense)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Members card */}
      <div className="chat-info-card flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-sm flex items-center gap-2">
            <Users size={16} className="text-primary" />
            {group.memberCount} members
          </h3>
          <button
            onClick={onInvite}
            className="size-7 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title="Invite member"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
          {group.members.map((member) => {
            const balance = group.balances.find(
              (b) => b.memberId === member.id,
            );
            return (
              <div
                key={member.id}
                className="flex items-center gap-2.5 py-1.5 px-1 rounded-xl hover:bg-soft-clay/60 transition-colors"
              >
                <Avatar className="size-8 shrink-0">
                  {member.avatarUrl && (
                    <AvatarImage
                      src={member.avatarUrl}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <AvatarFallback
                    className="text-[10px] font-bold text-white"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{member.name}</p>
                  {balance && balance.balance !== 0 && (
                    <p
                      className={`text-[10px] font-medium ${balance.balance > 0 ? "text-emerald-500" : "text-rose-500"}`}
                    >
                      {balance.balance > 0
                        ? `gets ${formatCurrency(balance.balance)}`
                        : `owes ${formatCurrency(Math.abs(balance.balance))}`}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick balance summary */}
      {group.settlements.length > 0 && (
        <div className="chat-info-card">
          <h3 className="font-display font-bold text-sm mb-2 flex items-center gap-2">
            <Wallet size={16} className="text-primary" />
            Pending settlements
          </h3>
          <p className="text-xs text-muted-foreground">
            {group.settlements.length} payment
            {group.settlements.length !== 1 ? "s" : ""} suggested
          </p>
        </div>
      )}
    </aside>
  );
}
