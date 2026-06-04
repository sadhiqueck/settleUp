import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExpenseSchema, type CreateExpenseInput } from "@settleup/shared";
import type { z } from "zod";

type Item = {
  id: string;
  name: string;
  price: number;
  assignedTo: string[];
};

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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClayReceiptIcon } from "@/components/clay-icons";
import { Loader2, Check, Users } from "lucide-react";
import { useAddExpense } from "@/hooks/useExpense";
import { useUserProfile } from "@/hooks/useUser";
import type { GroupMember } from "@/hooks/useGroups";

/* ─── Helpers ─── */

function formatSplitAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

/* ─── Component ─── */

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  members: GroupMember[];
}
interface SplitItem {
  userId: string;
  amount?: number;
  percentage?: number;
  shares?: number;
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
    getValues,
    control,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      title: "",
      amount: 0,
      paidById: user?.id ?? "",
      category: "OTHER",
      splitMethod: "EQUAL",
      date: new Date().toISOString(),
      splits: [],
    },
  });

  const hasSetPaidBy = useRef(false);

  useEffect(() => {
    if (user?.id && !hasSetPaidBy.current) {
      reset((prev) => ({ ...prev, paidById: user.id }));
      hasSetPaidBy.current = true;
    }
  }, [user?.id, reset]);

  const amount = useWatch({ control, name: "amount" }) || 0;
  const splitMethod = useWatch({ control, name: "splitMethod" }) || "EQUAL";

  // Track which members are included in the split (by member ID)
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    () => new Set(members.map((m) => m.id)),
  );

  // Track values for EXACT, PERCENTAGE, SHARES, ITEMIZED
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});

  // States for ITEMIZED mode
  const [items, setItems] = useState<Item[]>([
    {
      id: Math.random().toString(36).substring(2, 9),
      name: "",
      price: 0,
      assignedTo: [],
    },
  ]);
  const [tax, setTax] = useState<number>(0);
  const [tip, setTip] = useState<number>(0);

  // Derived: selected members list
  const selectedMembers = useMemo(
    () => members.filter((m) => selectedMemberIds.has(m.id)),
    [members, selectedMemberIds],
  );

  // Derived: per-person split amount (equal split)
  const perPersonAmount = useMemo(() => {
    if (selectedMembers.length === 0 || amount <= 0) return 0;
    return amount / selectedMembers.length;
  }, [amount, selectedMembers.length]);

  // Derived calculations for other modes
  const { totalEnteredAmount, totalPercentage, totalShares } = useMemo(() => {
    let totalEnteredAmount = 0;
    let totalPercentage = 0;
    let totalShares = 0;
    selectedMembers.forEach((m) => {
      const val = Number(splitValues[m.id]) || 0;
      if (splitMethod === "EXACT") totalEnteredAmount += val;
      else if (splitMethod === "PERCENTAGE") totalPercentage += val;
      else if (splitMethod === "SHARES") totalShares += val;
    });
    return { totalEnteredAmount, totalPercentage, totalShares };
  }, [selectedMembers, splitValues, splitMethod]);

  // Derived calculations for ITEMIZED mode
  const itemizedTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    members.forEach((m) => (totals[m.id] = 0));

    let subtotal = 0;

    items.forEach((item) => {
      if (item.price > 0 && item.assignedTo.length > 0) {
        subtotal += item.price;
        const splitAmount = item.price / item.assignedTo.length;
        item.assignedTo.forEach((userId) => {
          totals[userId] += splitAmount;
        });
      }
    });

    const extra = (tax || 0) + (tip || 0);
    if (subtotal > 0 && extra > 0) {
      members.forEach((m) => {
        const share = totals[m.id] / subtotal;
        totals[m.id] += share * extra;
      });
    }

    return { totals, subtotal, total: subtotal + extra };
  }, [items, tax, tip, members]);

  const isValidSplit = useMemo(() => {
    if (splitMethod === "ITEMIZED") {
      const hasItemizedSplit = Object.values(itemizedTotals.totals).some(
        (v) => v > 0,
      );
      return hasItemizedSplit && Math.abs(itemizedTotals.total - amount) < 0.01;
    }
    if (selectedMembers.length === 0) return false;
    if (splitMethod === "EQUAL") return true;
    if (splitMethod === "EXACT") {
      return Math.abs(totalEnteredAmount - amount) < 0.01;
    }
    if (splitMethod === "PERCENTAGE") {
      return Math.abs(totalPercentage - 100) < 0.01;
    }
    if (splitMethod === "SHARES") {
      return totalShares > 0;
    }
    return true;
  }, [
    splitMethod,
    totalEnteredAmount,
    amount,
    totalPercentage,
    totalShares,
    selectedMembers.length,
    itemizedTotals,
  ]);

  // Toggle a member in/out of the split
  const toggleMember = useCallback((memberId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        // Don't allow deselecting the last member
        if (next.size <= 1) return prev;
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }, []);

  // Select / deselect all
  const toggleAll = () => {
    setSelectedMemberIds((prev) => {
      if (prev.size === members.length) {
        return new Set(user?.id ? [user.id] : [members[0]?.id]);
      }
      return new Set(members.map((m) => m.id));
    });
  };

  const handleSplitValueChange = (memberId: string, val: string) => {
    setSplitValues((prev) => ({ ...prev, [memberId]: val }));
    // Auto-select if value is added and member is not selected
    if (Number(val) > 0 && !selectedMemberIds.has(memberId)) {
      setSelectedMemberIds((prev) => {
        const next = new Set(prev);
        next.add(memberId);
        return next;
      });
    }
  };

  // Itemized UX helpers
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        name: "",
        price: 0,
        assignedTo: [],
      },
    ]);
  };

  const updateItem = <K extends keyof Item>(
    id: string,
    field: K,
    value: Item[K],
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleItemAssignment = (itemId: string, memberId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const isAssigned = item.assignedTo.includes(memberId);
          return {
            ...item,
            assignedTo: isAssigned
              ? item.assignedTo.filter((id) => id !== memberId)
              : [...item.assignedTo, memberId],
          };
        }
        return item;
      }),
    );
  };

  // Sync amount for ITEMIZED
  useEffect(() => {
    let currentAmount = amount;
    // A. Sync amount if in ITEMIZED mode
    if (splitMethod === "ITEMIZED") {
      const computedTotal = Number((itemizedTotals.total || 0).toFixed(2));
      if (amount !== computedTotal) {
        setValue("amount", computedTotal, { shouldValidate: true });
        currentAmount = computedTotal; // Use the updated amount immediately in this render cycle
      }
    }
    // B. Calculate next splits array
    let nextSplits: SplitItem[] = [];
    if (splitMethod === "ITEMIZED") {
      nextSplits = members
        .filter((m) => (itemizedTotals.totals[m.id] || 0) > 0)
        .map((m) => ({
          userId: m.id,
          amount: Number((itemizedTotals.totals[m.id] || 0).toFixed(2)),
        }));
    } else if (selectedMembers.length > 0 && currentAmount > 0) {
      if (splitMethod === "EQUAL") {
        const splitAmount = Number(
          (currentAmount / selectedMembers.length).toFixed(2),
        );
        nextSplits = selectedMembers.map((m) => ({
          userId: m.id,
          amount: splitAmount,
        }));
      } else {
        nextSplits = selectedMembers
          .map((m): SplitItem => {
            const val = Number(splitValues[m.id]) || 0;
            const base = { userId: m.id };
            if (splitMethod === "EXACT") return { ...base, amount: val };
            if (splitMethod === "PERCENTAGE")
              return { ...base, percentage: val };
            if (splitMethod === "SHARES") return { ...base, shares: val };
            return base;
          })
          .filter((s) => s.amount || s.percentage || s.shares);
      }
    }
    // C. Prevent render loops: Deep-compare before updating RHF state
    // getValues() synchronously inspects the form state without triggering any re-renders.
    const currentSplits = getValues("splits") || [];
    const hasSplitsChanged =
      JSON.stringify(currentSplits) !== JSON.stringify(nextSplits);
    if (hasSplitsChanged) {
      setValue("splits", nextSplits, { shouldValidate: true });
    }
  }, [
    amount,
    splitMethod,
    selectedMembers,
    splitValues,
    itemizedTotals.total,
    itemizedTotals.totals,
    members,
    setValue,
    getValues,
  ]);

  // Form submission
  const handleFormSubmit = (data: ExpenseFormValues) => {
    if (!data.splits || data.splits.length === 0 || !isValidSplit) return;

    const dataInCents: CreateExpenseInput = {
      ...data,
      category: data.category ?? "OTHER",
      splitMethod: data.splitMethod ?? "EQUAL",
      amount: Math.round(data.amount * 100),
      splits: data.splits.map((s) => ({
        ...s,
        amount: s.amount ? Math.round(s.amount * 100) : undefined,
      })),
    };

    addExpense(dataInCents, {
      onSuccess: () => {
        reset();
        setSelectedMemberIds(new Set(members.map((m) => m.id)));
        setSplitValues({});
        onClose();
      },
    });
  };

  const allSelected = selectedMemberIds.size === members.length;

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
          className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto px-1 pb-2"
        >
          {/* Title */}
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

          {/* Amount */}
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
                disabled={splitMethod === "ITEMIZED"}
                className={`clay-input pl-9 ${
                  splitMethod === "ITEMIZED" ? "bg-soft-clay opacity-60" : ""
                }`}
                {...register("amount", { valueAsNumber: true })}
              />
            </div>
            {errors.amount && (
              <span className="text-red-500 text-xs">
                {errors.amount.message}
              </span>
            )}
          </div>

          {/* Category */}
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

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="expense-notes"
              className="font-display font-bold text-sm"
            >
              Notes
            </Label>
            <textarea
              id="expense-notes"
              placeholder="Optional notes..."
              className="clay-input min-h-15 resize-none"
              {...register("notes")}
            />
          </div>

          {/* ── Split Section ── */}
          <div className="bg-soft-clay rounded-2xl p-4 mt-1">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-display font-bold flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Split Between
              </p>
              <select
                className="clay-input text-xs py-1 px-2 h-auto cursor-pointer border-none shadow-sm rounded-lg font-bold uppercase w-30 bg-white text-primary text-center appearance-none"
                style={{ textAlignLast: "center" }}
                {...register("splitMethod")}
              >
                <option value="EQUAL">EQUAL SPLIT</option>
                <option value="EXACT">EXACT AMOUNTS</option>
                <option value="PERCENTAGE">PERCENTAGE</option>
                <option value="SHARES">BY SHARES</option>
                <option value="ITEMIZED">ITEMIZED</option>
              </select>
            </div>

            {/* Select all toggle & Member list for non-ITEMIZED */}
            {splitMethod === "ITEMIZED" ? (
              <div className="flex flex-col gap-3 mt-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-3 rounded-xl shadow-sm border border-border"
                  >
                    <div className="flex gap-2 items-start">
                      <div className="flex-1 min-w-0">
                        <Input
                          placeholder="Item name (e.g. Pizza)"
                          className="h-8 text-sm clay-input mb-2"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(item.id, "name", e.target.value)
                          }
                        />
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">
                          Shared by
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {members.map((m) => {
                            const isAssigned = item.assignedTo.includes(m.id);
                            return (
                              <Avatar
                                key={m.id}
                                onClick={() =>
                                  toggleItemAssignment(item.id, m.id)
                                }
                                className={`size-6 cursor-pointer transition-all ${isAssigned ? "ring-2 ring-primary ring-offset-1 scale-110" : "opacity-40 hover:opacity-100 grayscale hover:grayscale-0"}`}
                              >
                                {m.avatarUrl && (
                                  <AvatarImage
                                    src={m.avatarUrl}
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <AvatarFallback
                                  style={{ backgroundColor: m.color }}
                                  className="text-[10px] text-white font-bold"
                                >
                                  {m.initial}
                                </AvatarFallback>
                              </Avatar>
                            );
                          })}
                        </div>
                      </div>
                      <div className="w-24 shrink-0 flex flex-col items-end gap-2">
                        <Input
                          type="number"
                          placeholder="₹ 0"
                          min="0"
                          step="0.01"
                          className="h-8 text-sm clay-input text-right"
                          value={item.price || ""}
                          onChange={(e) =>
                            updateItem(item.id, "price", Number(e.target.value))
                          }
                        />
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-red-400 hover:text-red-500 text-[10px] font-bold px-1"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="ghost"
                  onClick={addItem}
                  className="border border-dashed border-border text-primary hover:bg-soft-clay w-full h-8 text-xs"
                >
                  + Add Item
                </Button>

                <Separator className="clay-divider my-2" />

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-[10px] text-muted-foreground font-bold uppercase ml-1">
                      Tax
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="₹ 0"
                      className="h-8 text-xs clay-input"
                      value={tax || ""}
                      onChange={(e) => setTax(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-[10px] text-muted-foreground font-bold uppercase ml-1">
                      Tip
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="₹ 0"
                      className="h-8 text-xs clay-input"
                      value={tip || ""}
                      onChange={(e) => setTip(Number(e.target.value))}
                    />
                  </div>
                </div>

                {itemizedTotals.total > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mt-2 flex flex-col gap-1">
                    {members.map((m) => {
                      const owes = itemizedTotals.totals[m.id];
                      if (!owes) return null;
                      return (
                        <div
                          key={m.id}
                          className="flex justify-between text-xs"
                        >
                          <span className="font-medium text-foreground">
                            {m.id === user?.id ? "You" : m.name}
                          </span>
                          <span className="font-bold text-primary">
                            {formatSplitAmount(owes)}
                          </span>
                        </div>
                      );
                    })}
                    <Separator className="clay-divider my-1.5" />
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-foreground">
                        Total calculated
                      </span>
                      <span className="font-black text-primary">
                        {formatSplitAmount(itemizedTotals.total)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Select all toggle */}
                {splitMethod === "EQUAL" && (
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white mb-2 text-sm font-medium transition-all hover:shadow-sm"
                  >
                    <span className="text-muted-foreground">
                      {allSelected
                        ? "Deselect all"
                        : `Select all ${members.length} members`}
                    </span>
                    <div
                      className={`size-5 rounded-md flex items-center justify-center transition-all duration-200 ${
                        allSelected
                          ? "bg-primary text-white shadow-sm"
                          : "bg-soft-clay border border-border"
                      }`}
                    >
                      {allSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                )}

                <Separator className="clay-divider my-2" />

                {/* Member list */}
                <div className="space-y-1 max-h-45 overflow-y-auto pr-1">
                  {members.map((member) => {
                    const isSelected = selectedMemberIds.has(member.id);
                    const isOnlySelected =
                      isSelected && selectedMemberIds.size === 1;

                    return (
                      <div
                        key={member.id}
                        className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl transition-all duration-200 group ${
                          isSelected
                            ? "bg-white shadow-sm"
                            : "bg-transparent hover:bg-white/60 opacity-50"
                        }`}
                      >
                        <div
                          className={`flex items-center gap-3 flex-1 ${
                            splitMethod === "EQUAL" && isOnlySelected
                              ? "cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                          onClick={() =>
                            (splitMethod !== "EQUAL" || !isOnlySelected) &&
                            toggleMember(member.id)
                          }
                        >
                          {/* Avatar */}
                          <Avatar className="size-8 shrink-0">
                            {member.avatarUrl && (
                              <AvatarImage
                                src={member.avatarUrl}
                                alt={member.name}
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <AvatarFallback
                              className="text-xs font-bold text-white"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.initial}
                            </AvatarFallback>
                          </Avatar>

                          {/* Name + amount */}
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {member.id === user?.id ? "You" : member.name}
                            </p>
                            {splitMethod === "EQUAL" &&
                              isSelected &&
                              amount > 0 && (
                                <p className="text-xs text-primary font-medium">
                                  {formatSplitAmount(perPersonAmount)}
                                </p>
                              )}
                          </div>
                        </div>

                        {/* Inputs & Checkbox indicator */}
                        <div className="flex items-center gap-2 shrink-0">
                          {splitMethod !== "EQUAL" && (
                            <div className="w-20">
                              <Input
                                type="number"
                                min="0"
                                step={splitMethod === "SHARES" ? "1" : "0.01"}
                                placeholder={
                                  splitMethod === "PERCENTAGE" ? "0%" : "0"
                                }
                                className={`h-8 text-xs clay-input text-right ${
                                  !isSelected ? "opacity-50" : ""
                                }`}
                                value={splitValues[member.id] || ""}
                                onChange={(e) =>
                                  handleSplitValueChange(
                                    member.id,
                                    e.target.value,
                                  )
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}

                          {/* Toggle Checkbox */}
                          <div
                            onClick={() =>
                              !isOnlySelected && toggleMember(member.id)
                            }
                            className={`size-5 rounded-md flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer ${
                              isSelected
                                ? "bg-primary text-white shadow-sm"
                                : "bg-soft-clay border border-border group-hover:border-primary/30"
                            } ${
                              isOnlySelected && splitMethod === "EQUAL"
                                ? "cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary */}
                {amount > 0 && selectedMembers.length > 0 && (
                  <>
                    <Separator className="clay-divider my-3" />
                    {splitMethod === "EQUAL" ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">
                          {selectedMembers.length} of {members.length} members
                        </span>
                        <span className="font-bold text-foreground">
                          {formatSplitAmount(perPersonAmount)} / person
                        </span>
                      </div>
                    ) : splitMethod === "EXACT" ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">
                          Total: {formatSplitAmount(totalEnteredAmount)}
                        </span>
                        <span
                          className={`font-bold ${
                            Math.abs(totalEnteredAmount - amount) < 0.01
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {Math.abs(totalEnteredAmount - amount) < 0.01
                            ? "Amount matches"
                            : `Remaining: ${formatSplitAmount(
                                amount - totalEnteredAmount,
                              )}`}
                        </span>
                      </div>
                    ) : splitMethod === "PERCENTAGE" ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">
                          Total Percentage
                        </span>
                        <span
                          className={`font-bold ${
                            Math.abs(totalPercentage - 100) < 0.01
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {totalPercentage}% / 100%
                        </span>
                      </div>
                    ) : splitMethod === "SHARES" ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">
                          Total Shares
                        </span>
                        <span className="font-bold text-foreground">
                          {totalShares}
                        </span>
                      </div>
                    ) : null}
                  </>
                )}
              </>
            )}

            {errors.splits && (
              <span className="text-red-500 text-xs block mt-2">
                {errors.splits.message || "Please check the split values"}
              </span>
            )}
            {!isValidSplit && splitMethod !== "EQUAL" && (
              <span className="text-red-500 text-xs block mt-2">
                {splitMethod === "PERCENTAGE"
                  ? "Percentages must add up to 100%"
                  : splitMethod === "EXACT" || splitMethod === "ITEMIZED"
                    ? "Split amounts must add up to the total expense amount"
                    : "Please enter valid split values"}
              </span>
            )}
          </div>

          {/* ── Footer ── */}
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
              disabled={
                isPending ||
                (splitMethod !== "ITEMIZED" && selectedMembers.length === 0) ||
                !isValidSplit
              }
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
