import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, Users, Pencil, Trash2, Eye } from "lucide-react";
import type { GroupExpense } from "@/hooks/useGroups";
import {
  formatCurrency,
  formatMessageTime,
} from "@/lib/format";

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: "🍕",
  TRANSPORT: "🚕",
  ACCOMMODATION: "🏨",
  SHOPPING: "🛍️",
  ENTERTAINMENT: "🎬",
  UTILITIES: "💡",
  RENT: "🏠",
  OTHER: "📦",
};

interface ExpenseMessageBubbleProps {
  expense: GroupExpense;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function ExpenseMessageBubble({
  expense,
  isOwn,
  onEdit,
  onDelete,
}: ExpenseMessageBubbleProps) {
  const [expanded, setExpanded] = useState(false);
  const emoji = CATEGORY_EMOJI[expense.category] ?? "📦";

  if (isOwn) {
    return (
      <div className="flex flex-col items-end gap-1 group">
        <div className="flex items-end gap-2 max-w-[85%]">
          <div className="chat-bubble-outgoing">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{emoji}</span>
              <span className="font-display font-bold text-[15px]">
                {expense.title}
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {formatCurrency(expense.amount)}
            </p>
            <p className="text-xs opacity-80 mt-1">
              Split {expense.splitMethod === "EQUAL" ? "equally" : expense.splitMethod.toLowerCase()} · {expense.splitCount} people
            </p>
            {expanded && (
              <div className="mt-3 pt-3 border-t border-white/20 space-y-1.5">
                {expense.splits.map((split) => (
                  <div
                    key={split.userId}
                    className="flex justify-between text-xs opacity-90"
                  >
                    <span>{split.name}</span>
                    <span className="font-semibold">
                      {formatCurrency(split.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-end gap-2 mt-2 opacity-70">
              <span className="text-[10px]">
                {formatMessageTime(expense.date)}
              </span>
              <Eye size={10} />
            </div>
          </div>
          <Avatar className="clay-avatar size-8 shrink-0">
            {expense.paidByAvatar && (
              <AvatarImage src={expense.paidByAvatar} alt={expense.paidBy} referrerPolicy="no-referrer" />
            )}
            <AvatarFallback className="bg-white/20 text-white text-xs font-bold">
              {expense.paidBy.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-10">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5"
          >
            {expanded ? "Hide" : "Details"}
          </button>
          <button onClick={onEdit} className="p-1 rounded hover:bg-soft-clay text-muted-foreground hover:text-primary">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-coral-red">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1 group">
      <span className="text-xs font-semibold text-muted-foreground ml-12">
        {expense.paidBy}
      </span>
      <div className="flex items-end gap-2 max-w-[85%]">
        <Avatar className="clay-avatar size-8 shrink-0">
          {expense.paidByAvatar && (
            <AvatarImage src={expense.paidByAvatar} alt={expense.paidBy} referrerPolicy="no-referrer" />
          )}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            {expense.paidBy.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div
          className="chat-bubble-incoming cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{emoji}</span>
            <span className="font-display font-bold text-[15px] text-foreground">
              {expense.title}
            </span>
          </div>
          <p className="text-xl font-bold text-foreground tracking-tight">
            {formatCurrency(expense.amount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Split {expense.splitMethod === "EQUAL" ? "equally" : expense.splitMethod.toLowerCase()} · your share{" "}
            {formatCurrency(
              expense.splits.find((s) => s.name === expense.paidBy)?.amount ??
                expense.amount / expense.splitCount,
            )}
          </p>
          {expanded && (
            <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                <Users size={10} />
                Split details
              </div>
              {expense.splits.map((split) => {
                const isPayer = split.userId === expense.paidById;
                return (
                  <div
                    key={split.userId}
                    className="flex justify-between text-xs"
                  >
                    <span className="font-medium">{split.name}</span>
                    <span className={isPayer ? "text-neon-green font-semibold" : "text-amber-700 font-semibold"}>
                      {isPayer ? "Paid" : formatCurrency(split.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-muted-foreground">
              {formatMessageTime(expense.date)}
            </span>
            <ChevronDown
              size={12}
              className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActivityBubbleProps {
  user: string;
  action: string;
  target?: string;
  timestamp: string;
}

export function ActivityBubble({
  user,
  action,
  target,
  timestamp,
}: ActivityBubbleProps) {
  return (
    <div className="chat-bubble-system">
      <span className="font-semibold text-foreground">{user}</span>{" "}
      {action}{" "}
      {target && (
        <span className="font-semibold text-foreground">{target}</span>
      )}
      <span className="block mt-0.5 opacity-60">{timestamp}</span>
    </div>
  );
}
