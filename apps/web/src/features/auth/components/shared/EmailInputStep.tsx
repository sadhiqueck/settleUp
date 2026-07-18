import { Input } from "@/shared/components/ui/input";
import { ChevronRight, X, Loader2 } from "lucide-react";
import { GoogleIcon } from "@/shared/components/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { Button } from "@/shared/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldSeparator,
} from "@/shared/components/ui/field";

interface EmailInputStepProps {
  email: string;
  setEmail: (email: string) => void;
  isLoading: boolean;
  cooldown: number;
  onGoogleLogin: () => void;
}

export function EmailInputStep({
  email,
  setEmail,
  isLoading,
  cooldown,
  onGoogleLogin,
}: EmailInputStepProps) {
  return (
    <>
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <div className="relative">
          <Input
            key="email-input"
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={email.length > 0 ? "pr-8" : ""}
          />
          {email.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setEmail("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted/50 transition-colors"
                  aria-label="Clear email"
                >
                  <X className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                <p>Clear Email</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <FieldDescription className="mb-2 text-xs">
          We'll use this to contact you. We never share your email.
        </FieldDescription>
        <Button
          type="submit"
          variant="outline"
          disabled={isLoading || cooldown > 0}
          className="w-full justify-center font-medium gap-1 transition-all text-muted-foreground"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : cooldown > 0 ? (
            `Resend available in ${cooldown}s`
          ) : (
            <>
              Continue with email
              <ChevronRight className="size-4 opacity-60" strokeWidth={2.8} />
            </>
          )}
        </Button>
      </Field>

      <FieldSeparator className="text-sm text-muted-foreground [&>span]:bg-white dark:[&>span]:bg-[#171717]">
        OR
      </FieldSeparator>

      <Field className="flex flex-col gap-3">
        <Button
          variant="glassyInverted"
          type="button"
          onClick={onGoogleLogin}
          className="w-full gap-1.5 font-normal opacity-90"
        >
          <GoogleIcon size={18} />
          Continue with Google
        </Button>
      </Field>
    </>
  );
}
