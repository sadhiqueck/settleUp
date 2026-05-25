import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClayShieldIcon } from "@/components/clay-icons";
import { Loader2, CheckCircle2, AlertCircle, AtSign } from "lucide-react";
import { useUpdateProfile } from "@/hooks/useUser";
import { VPA_REGEX } from "@settleup/shared";

interface VpaOnboardingModalProps {
  isOpen: boolean;
}

export function VpaOnboardingModal({ isOpen }: VpaOnboardingModalProps) {
  const [vpa, setVpa] = useState("");
  const [touched, setTouched] = useState(false);
  const updateProfileMutation = useUpdateProfile();
  console.log(VPA_REGEX)

  const isValid = VPA_REGEX.test(vpa);
  const showError = touched && vpa.length > 0 && !isValid;
  const showSuccess = vpa.length > 0 && isValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    updateProfileMutation.mutate(
      { vpa },
      {
        onError: () => {
          setTouched(true);
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="clay-card-elevated border-0 ring-0 rounded-3xl max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Decorative glow */}
        <div
          className="absolute top-[-30%] right-[-20%] w-56 h-56 rounded-full opacity-15 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #00C700 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        <div
          className="absolute bottom-[-20%] left-[-15%] w-40 h-40 rounded-full opacity-10 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #6CE71D 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <DialogHeader className="pb-1 relative z-10">
          <div className="flex flex-col items-center text-center gap-4">
            {/* Icon */}
            <div className="clay-card-elevated p-4 rounded-2xl animate-clay-float">
              <ClayShieldIcon size={40} />
            </div>

            <div>
              <DialogTitle className="font-display text-xl font-extrabold">
                Set Up Your UPI ID
              </DialogTitle>
              <DialogDescription className="text-sm mt-2 max-w-xs mx-auto leading-relaxed">
                Add your UPI ID so group members can pay you directly through
                any UPI app.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 pt-2 relative z-10"
        >
          {/* VPA Input */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="onboarding-vpa"
              className="font-display font-bold text-sm"
            >
              UPI ID (VPA)
            </Label>
            <div className="relative">
              <AtSign
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                id="onboarding-vpa"
                type="text"
                value={vpa}
                onChange={(e) => {
                  setVpa(e.target.value.trim());
                  if (!touched) setTouched(true);
                }}
                onBlur={() => setTouched(true)}
                placeholder="yourname@upi"
                className={`clay-input pl-11 pr-11 transition-all ${
                  showError
                    ? "ring-2 ring-red-500/30 border-red-500/50"
                    : showSuccess
                      ? "ring-2 ring-green-500/30 border-green-500/50"
                      : ""
                }`}
                autoFocus
                disabled={updateProfileMutation.isPending}
              />
              {/* Validation icon */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {showSuccess && (
                  <CheckCircle2
                    size={18}
                    className="text-green-500 animate-in fade-in zoom-in duration-200"
                  />
                )}
                {showError && (
                  <AlertCircle
                    size={18}
                    className="text-red-500 animate-in fade-in zoom-in duration-200"
                  />
                )}
              </div>
            </div>

            {/* Validation messages */}
            {showError && (
              <p className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                Enter a valid UPI ID (e.g. name@okaxis, phone@ybl, user@paytm)
              </p>
            )}
            {showSuccess && (
              <p className="text-xs text-green-600 font-medium animate-in fade-in slide-in-from-top-1 duration-200 flex items-center gap-1">
                <CheckCircle2 size={12} />
                Valid UPI ID format
              </p>
            )}

            {/* API error */}
            {updateProfileMutation.isError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} />
                <p className="text-xs font-medium">
                  Failed to save. Please try again.
                </p>
              </div>
            )}
          </div>

          {/* Info banner */}
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex gap-3">
            <div className="shrink-0 mt-0.5">
              <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-base">💡</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your UPI ID is used to receive payments from group members when
                they settle up. You can change it anytime from your profile.
              </p>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!isValid || updateProfileMutation.isPending}
            className={`clay-btn-primary w-full text-base font-display font-bold flex items-center justify-center gap-2 py-3 transition-all duration-200 ${
              !isValid || updateProfileMutation.isPending
                ? "opacity-50 cursor-not-allowed grayscale-[0.3]"
                : "hover:scale-[1.01]"
            }`}
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Saving...
              </>
            ) : (
              "Save & Continue"
            )}
          </button>

          {/* Skip hint */}
          <p className="text-[11px] text-muted-foreground/60 text-center font-medium">
            This is required to receive payments from your friends
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
