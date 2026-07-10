import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { useDeleteExpense } from "@/features/groups/hooks/useExpenseActions";

interface DeleteExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  expenseId: string;
  expenseTitle: string;
  expenseAmount: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export function DeleteExpenseDialog({
  isOpen,
  onClose,
  groupId,
  expenseId,
  expenseTitle,
  expenseAmount,
}: DeleteExpenseDialogProps) {
  const { mutate: deleteExpense, isPending } = useDeleteExpense(groupId);

  const handleDelete = () => {
    deleteExpense(expenseId, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="clay-card-elevated border-0 ring-0 rounded-3xl max-w-sm">
        <DialogHeader className="pb-2">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="clay-card-elevated p-4 rounded-2xl bg-red-500/10">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <div>
              <DialogTitle className="font-display text-lg font-bold">
                Delete Expense
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Are you sure you want to delete this expense?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Expense details */}
        <div className="clay-card-pressed p-4 rounded-2xl text-center my-2">
          <p className="font-display font-bold text-base text-foreground truncate">
            {expenseTitle}
          </p>
          <p className="font-sans font-bold text-xl text-foreground mt-1">
            {formatCurrency(expenseAmount)}
          </p>
        </div>

        {/* Warning */}
        <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-3 flex gap-3">
          <AlertTriangle
            size={16}
            className="text-red-500 shrink-0 mt-0.5"
          />
          <p className="text-xs text-red-600 leading-relaxed">
            This will reverse all balance calculations for this expense. This
            action cannot be undone.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="clay-btn-ghost font-display flex-1"
            disabled={isPending}
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className={`clay-btn-primary flex-1 px-6 py-2.5 text-sm font-display font-bold flex items-center justify-center gap-2 !bg-red-500 !shadow-[4px_4px_12px_rgba(239,68,68,0.3),-2px_-2px_8px_rgba(255,255,255,0.8)] hover:!bg-red-600 ${
              isPending ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isPending && <Loader2 className="animate-spin" size={16} />}
            {isPending ? "Deleting..." : "Delete"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
