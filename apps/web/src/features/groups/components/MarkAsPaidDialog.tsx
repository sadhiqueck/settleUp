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
import { Loader2, CheckCircle2 } from "lucide-react";
import { ClayArrowRightIcon } from "@/shared/components/ui/clay-icons";
import { useMarkAsPaid } from "@/features/groups/hooks/useGroups";
import { toast } from "sonner";
import type { AxiosError } from "axios";

interface MarkAsPaidDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  fromName: string;
  fromId: string;
  toName: string;
  toId: string;
  amount: number; // In display currency (e.g. ₹500, not paise)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export function MarkAsPaidDialog({
  isOpen,
  onClose,
  groupId,
  fromName,
  fromId,
  toName,
  toId,
  amount,
}: MarkAsPaidDialogProps) {
  const [note, setNote] = useState("");
  const { mutate: markAsPaid, isPending } = useMarkAsPaid();

  const handleConfirm = () => {
    markAsPaid(
      {
        groupId,
        payerId: fromId,
        receiverId: toId,
        amount: Math.round(amount * 100), // Convert to paise
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Payment recorded successfully!", {
            description: `${fromName} → ${toName}: ${formatCurrency(amount)}`,
          });
          onClose();
        },
        onError: (error: Error) => {
          const err = error as AxiosError<{ message: string }>;
          toast.error(
            err.response?.data?.message || "Failed to record payment",
          );
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="clay-card-elevated border-0 ring-0 rounded-3xl max-w-sm">
        <DialogHeader className="pb-2">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="clay-card-elevated p-4 rounded-2xl bg-primary/10">
              <CheckCircle2 size={32} className="text-primary" />
            </div>
            <div>
              <DialogTitle className="font-display text-lg font-bold">
                Mark as Paid
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Record this payment as completed
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Settlement details */}
        <div className="clay-card-pressed p-5 rounded-2xl text-center my-1 space-y-3">
          <p className="font-sans font-extrabold text-3xl text-foreground">
            {formatCurrency(amount)}
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="font-display font-bold text-sm bg-white px-3 py-1 rounded-full shadow-sm">
              {fromName}
            </span>
            <ClayArrowRightIcon
              size={16}
              className="text-muted-foreground mx-1"
            />
            <span className="font-display font-bold text-sm bg-white px-3 py-1 rounded-full shadow-sm">
              {toName}
            </span>
          </div>
        </div>

        {/* Optional note */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Paid in cash, Google Pay, Bank transfer..."
            maxLength={200}
            className="w-full clay-card-pressed px-4 py-3 rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
          />
        </div>

        {/* Info note */}
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-3 flex gap-3">
          <CheckCircle2
            size={16}
            className="text-primary shrink-0 mt-0.5"
          />
          <p className="text-xs text-foreground/70 leading-relaxed">
            This will update the group balances immediately. Both parties'
            balances will be adjusted to reflect this payment.
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
            onClick={handleConfirm}
            disabled={isPending}
            className={`clay-btn-primary flex-1 px-6 py-2.5 text-sm font-display font-bold flex items-center justify-center gap-2 ${
              isPending ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isPending && <Loader2 className="animate-spin" size={16} />}
            {isPending ? "Recording..." : "Confirm Payment"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
