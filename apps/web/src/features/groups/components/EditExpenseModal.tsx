import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Loader2, Pencil } from "lucide-react";
import { useUpdateExpense } from "@/features/groups/hooks/useExpenseActions";
import type { GroupExpense } from "@/features/groups/hooks/useGroups";

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  expense: GroupExpense;
}

const CATEGORIES = [
  { value: "FOOD", label: "Food & Dining" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "ACCOMMODATION", label: "Accommodation" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "RENT", label: "Rent" },
  { value: "OTHER", label: "Other" },
];

export function EditExpenseModal({
  isOpen,
  onClose,
  groupId,
  expense,
}: EditExpenseModalProps) {
  const [title, setTitle] = useState(expense.title);
  const [category, setCategory] = useState(expense.category);
  const [notes, setNotes] = useState(expense.notes || "");
  const { mutate: updateExpense, isPending } = useUpdateExpense(groupId);

  const hasChanges =
    title !== expense.title ||
    category !== expense.category ||
    notes !== (expense.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !hasChanges) return;

    updateExpense(
      {
        expenseId: expense.id,
        data: {
          title: title.trim(),
          category: category as any,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="clay-card-elevated border-0 ring-0 rounded-3xl max-w-md">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="clay-card p-2">
              <Pencil size={24} className="text-primary" />
            </div>
            <div>
              <DialogTitle className="font-display text-lg font-bold">
                Edit Expense
              </DialogTitle>
              <DialogDescription className="text-sm">
                Update expense details. To change the amount, delete and
                recreate.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="edit-title"
              className="font-display font-bold text-sm"
            >
              Title
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What was this for?"
              className="clay-input"
              required
              disabled={isPending}
            />
          </div>

          {/* Amount (read-only) */}
          <div className="flex flex-col gap-2">
            <Label className="font-display font-bold text-sm text-muted-foreground">
              Amount{" "}
              <span className="font-normal text-xs">(cannot be changed)</span>
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                ₹
              </span>
              <Input
                value={expense.amount.toLocaleString("en-IN")}
                className="clay-input pl-9 bg-soft-clay opacity-60 cursor-not-allowed"
                disabled
              />
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="edit-category"
              className="font-display font-bold text-sm"
            >
              Category
            </Label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="clay-input text-sm cursor-pointer pr-8"
              disabled={isPending}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="edit-notes"
              className="font-display font-bold text-sm"
            >
              Notes
            </Label>
            <textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="clay-input min-h-15 resize-none"
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="clay-btn-ghost font-display"
              disabled={isPending}
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={isPending || !hasChanges || !title.trim()}
              className={`clay-btn-primary px-6 py-2.5 text-sm font-display font-bold flex items-center gap-2 ${
                isPending || !hasChanges || !title.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isPending && <Loader2 className="animate-spin" size={16} />}
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
