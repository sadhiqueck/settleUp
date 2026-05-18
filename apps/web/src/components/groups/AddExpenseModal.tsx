import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExpenseSchema, type CreateExpenseInput } from "@settleup/shared";
import type { z } from "zod";

type ExpenseFormValues = z.input<typeof createExpenseSchema>;
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClayReceiptIcon } from "@/components/clay-icons";
import { Loader2 } from "lucide-react";
import { useAddExpense } from "@/hooks/useExpense";
import { useUserProfile } from "@/hooks/useUser";
import type { GroupMember } from "@/hooks/useGroups";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  members: GroupMember[];
}

export function AddExpenseModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  members,
}: AddExpenseModalProps) {
  const { data: user } = useUserProfile();
  const { mutate: addExpense, isPending } = useAddExpense(groupId);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      title: "",
      amount: 0,
      paidById: "", // Will set when user loads
      category: "OTHER",
      splitMethod: "EQUAL",
      date: new Date().toISOString(),
      splits: [],
    },
  });

  const amount = useWatch({ control, name: "amount" }) || 0;
  const [includeAll, setIncludeAll] = useState(true);

  // Set default paidById
  useEffect(() => {
    if (user?.id) {
      setValue("paidById", user.id);
    }
  }, [user, setValue]);

  // Handle equal splits calculation dynamically
  useEffect(() => {
    if (!members.length) return;

    if (includeAll && amount > 0) {
      // Split amount equally
      const splitVal = amount / members.length;
      const splits = members.map((m) => {
        // Adjust the first one for precision if needed, but for simplicity let's just use exact float initially
        return {
          userId: m.id,
          amount: splitVal,
        };
      });
      setValue("splits", splits, { shouldValidate: true });
    } else if (includeAll && amount === 0) {
      setValue("splits", []);
    }
  }, [amount, includeAll, members, setValue]);

  const handleFormSubmit = (data: ExpenseFormValues) => {
    if (!data.splits || data.splits.length === 0) return;

    // The backend expects amount in standard units for creation, wait.
    // In expenses.service.ts, it doesn't divide by 100 on creation. Wait!
    // Let me check expenses.service.ts creation again.
    // "amount: data.amount"
    // "amountOwedToPayer = data.amount - split.amount"
    // So the backend expects the exact amount you want to store.
    // I'll send it multiplied by 100 to store in cents because that's typical, but wait, the form has it in standard format.
    // Let's check how expenses.service.ts reads it:
    // It says "totalExpense: totalExpense / 100" in getUserGroups. So backend stores in cents!
    const dataInCents: CreateExpenseInput = {
      ...data,
      category: data.category ?? "OTHER",
      splitMethod: data.splitMethod ?? "EQUAL",
      amount: Math.round(data.amount * 100),
      splits: data.splits.map((s) => ({
        ...s,
        amount: s.amount ? Math.round(s.amount * 100) : 0,
      })),
    };

    addExpense(dataInCents, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
                Log a new purchase for {groupName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
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
              {...register("title")}
            />
            {errors.title && (
              <span className="text-red-500 text-xs">
                {errors.title.message}
              </span>
            )}
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
                step="0.01"
                min="0.01"
                placeholder="0"
                className="clay-input pl-9"
                {...register("amount", { valueAsNumber: true })}
              />
            </div>
            {errors.amount && (
              <span className="text-red-500 text-xs">
                {errors.amount.message}
              </span>
            )}
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
              {...register("category")}
            >
              <option value="FOOD">Food & Dining</option>
              <option value="TRANSPORT">Transport</option>
              <option value="ACCOMMODATION">Accommodation</option>
              <option value="SHOPPING">Shopping</option>
              <option value="ENTERTAINMENT">Entertainment</option>
              <option value="UTILITIES">Utilities</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="bg-soft-clay rounded-2xl p-4 mt-2 mb-2">
            <p className="text-sm font-semibold mb-2">Split Details</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Split Type</span>
              <Badge className="clay-badge text-[10px] items-center">
                EQUAL SPLIT
              </Badge>
            </div>
            <Separator className="clay-divider my-3" />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="participating"
                checked={includeAll}
                onChange={(e) => setIncludeAll(e.target.checked)}
                className="size-4 accent-primary rounded-md"
              />
              <label htmlFor="participating" className="text-sm font-medium">
                Split equally between all {members.length} members
              </label>
            </div>
            {errors.splits && (
              <span className="text-red-500 text-xs block mt-2">
                {errors.splits.message}
              </span>
            )}
          </div>

          <DialogFooter className="mt-2 border-none">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
              className="clay-btn-ghost font-display"
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={isPending}
              className="clay-btn-primary px-6 py-2.5 text-sm font-display shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Log Expense
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
