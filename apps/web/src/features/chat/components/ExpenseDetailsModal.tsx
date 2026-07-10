import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { formatCurrency } from "@/shared/lib/format";
import type { GroupExpense } from "@/features/groups/hooks/useGroups";
import { Receipt, Users, BellRing, X } from "lucide-react";
import { toast } from "sonner";

interface ExpenseDetailsModalProps {
  expense: GroupExpense | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export function ExpenseDetailsModal({
  expense,
  isOpen,
  onClose,
  currentUserId,
}: ExpenseDetailsModalProps) {
  if (!expense) return null;

  const totalAmount = expense.amount;
  const payer = expense.splits.find((s) => s.userId === expense.paidById);

  const handleRemind = (name: string) => {
    toast.success(`Reminder sent to ${name}!`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-full h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:rounded-3xl rounded-none p-0 flex flex-col m-0 border-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-0 shrink-0 relative">
          {/* Mobile close button since DialogContent's default close might be hard to reach or we want a custom one */}
          <button 
            onClick={onClose}
            className="sm:hidden absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-4 mb-4 mt-2 sm:mt-0">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Receipt size={24} />
            </div>
            <div>
              <DialogTitle className="font-display text-xl font-bold line-clamp-1">
                {expense.title}
              </DialogTitle>
              <p className="text-2xl font-bold tracking-tight mt-1 text-foreground">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 no-scrollbar">
          <div className="space-y-6">
            {/* Paid By Section */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Paid By
              </h3>
              <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 border-2 border-background shadow-sm">
                    {expense.paidByAvatar && (
                      <AvatarImage src={expense.paidByAvatar} alt={expense.paidBy} referrerPolicy="no-referrer" />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {expense.paidBy.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">
                      {expense.paidBy} {payer?.userId === currentUserId ? "(You)" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Paid full amount
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neon-green">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Split Details Section */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <Users size={14} />
                Split Details
              </div>
              <div className="space-y-2">
                {expense.splits.map((split) => {
                  const isPayer = split.userId === expense.paidById;
                  const isMe = split.userId === currentUserId;
                  const sharePercentage = (split.amount / totalAmount) * 100;

                  return (
                    <div
                      key={split.userId}
                      className="bg-card p-4 rounded-2xl border border-border/50 hover:shadow-sm transition-shadow flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                              {split.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-sm">
                            {split.name} {isMe ? "(You)" : ""}
                          </span>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className={`font-bold ${isPayer ? "text-neon-green" : "text-amber-600 dark:text-amber-500"}`}>
                            {formatCurrency(split.amount)}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                            {sharePercentage.toFixed(0)}% share
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Bar (simulated share) */}
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isPayer ? "bg-neon-green" : "bg-amber-500"}`}
                          style={{ width: `${sharePercentage}%` }}
                        />
                      </div>

                      {/* Reminder Action */}
                      {!isPayer && !isMe && currentUserId === expense.paidById && (
                        <div className="pt-2 border-t border-border/50 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
                            onClick={() => handleRemind(split.name)}
                          >
                            <BellRing size={12} />
                            Remind
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
