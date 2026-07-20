import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import type { GroupExpense, GroupMember } from "@/features/groups/hooks/useGroups";
import { formatCurrency, formatMessageTime } from "@/shared/lib/format";
import { ExpenseDetailsModal } from "./ExpenseDetailsModal";

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
  currentUserId?: string;
  members: GroupMember[];
}

export const ExpenseMessageBubble = React.memo(function ExpenseMessageBubble({
  expense,
  isOwn,
  onEdit,
  onDelete,
  currentUserId,
  members,
}: ExpenseMessageBubbleProps) {
  const [showDetails, setShowDetails] = useState(false);
  const emoji = CATEGORY_EMOJI[expense.category] ?? "📦";

  // Get max 3 splits to show in the avatar stack
  const visibleSplits = expense.splits.slice(0, 3);
  const remainingSplits = Math.max(0, expense.splits.length - 3);

  const AvatarStack = () => (
    <div className="flex items-center mt-2 opacity-90">
      <div className="flex -space-x-2">
        {visibleSplits.map((split) => {
          const member = (members || []).find((m) => m.id === split.userId);
          return (
            <Avatar key={split.userId} className="size-5 border border-background">
              {member?.avatarUrl && (
                <AvatarImage src={member.avatarUrl} alt={split.name} referrerPolicy="no-referrer" />
              )}
              <AvatarFallback className="bg-muted text-[8px] font-bold text-muted-foreground">
                {split.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          );
        })}
      </div>
      {remainingSplits > 0 && (
        <span className="text-[10px] ml-1.5 font-medium">
          +{remainingSplits}
        </span>
      )}
    </div>
  );

  if (isOwn) {
    return (
      <div className="flex flex-col items-end gap-1 group">
        <div className="flex items-end gap-2 max-w-[85%]">
          <div
            className="chat-bubble-outgoing cursor-pointer"
            onClick={() => setShowDetails(true)}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{emoji}</span>
              <span className="font-display font-bold text-[15px]">
                Request for {expense.title}
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {formatCurrency(expense.amount)}
            </p>
            <AvatarStack />
            <div className="flex items-center justify-between gap-4 mt-2 opacity-70">
              <span className="text-[10px]">
                {formatMessageTime(expense.date)}
              </span>
              <ChevronDown size={12} className="opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
          <button onClick={onEdit} className="p-1 rounded hover:bg-soft-clay text-muted-foreground hover:text-primary">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-coral-red">
            <Trash2 size={12} />
          </button>
        </div>

        <ExpenseDetailsModal
          expense={expense}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          currentUserId={currentUserId}
        />
      </div>
    );
  }

  const myShare = expense.splits.find((s) => s.userId === currentUserId)?.amount ?? 0;

  return (
    <div className="flex flex-col items-start gap-1 group">
      <span className="text-xs font-semibold text-muted-foreground ml-12">
        {expense.paidBy}
      </span>
      <div className="flex items-end gap-2 max-w-[85%]">
        <Avatar className="app-avatar size-8 shrink-0 border border-border/50">
          {expense.paidByAvatar && (
            <AvatarImage src={expense.paidByAvatar} alt={expense.paidBy} referrerPolicy="no-referrer" />
          )}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            {expense.paidBy.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div
          className="chat-bubble-incoming cursor-pointer border border-border/50"
          onClick={() => setShowDetails(true)}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{emoji}</span>
            <span className="font-display font-bold text-[15px] text-foreground">
              Request for {expense.title}
            </span>
          </div>
          <p className="text-xl font-bold text-foreground tracking-tight">
            {formatCurrency(expense.amount)}
          </p>
          
          <div className="mt-2 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-semibold border border-primary/20 inline-block">
            Your share: {formatCurrency(myShare)}
          </div>
          
          <AvatarStack />

          <div className="flex items-center justify-between gap-4 mt-2">
            <span className="text-[10px] text-muted-foreground">
              {formatMessageTime(expense.date)}
            </span>
            <ChevronDown
              size={12}
              className="text-muted-foreground opacity-70 group-hover:opacity-100 transition-transform"
            />
          </div>
        </div>
      </div>

      <ExpenseDetailsModal
        expense={expense}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        currentUserId={currentUserId}
      />
    </div>
  );
});

interface ActivityBubbleProps {
  user: string;
  action: string;
  target?: string;
  timestamp: string;
}

export const ActivityBubble = React.memo(function ActivityBubble({
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
});
