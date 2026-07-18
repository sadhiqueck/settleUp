import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldDescription,
} from "@/shared/components/ui/field";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  GoogleIcon,
  MicrosoftIcon,
  YahooIcon,
  AppleIcon,
  ZohoIcon,
} from "@/shared/components/ui/icons";

interface OtpInputStepProps {
  otp: string;
  setOtp: (otp: string) => void;
  email: string;
  isLoading: boolean;
  onBack: () => void;
}

const getEmailProviders = (email: string) => {
  const lowerEmail = email.toLowerCase();
  if (lowerEmail.endsWith("@gmail.com"))
    return [
      { name: "Gmail", url: "https://mail.google.com/", Icon: GoogleIcon },
    ];
  if (
    lowerEmail.endsWith("@outlook.com") ||
    lowerEmail.endsWith("@hotmail.com")
  )
    return [
      {
        name: "Outlook",
        url: "https://outlook.live.com/",
        Icon: MicrosoftIcon,
      },
    ];
  if (lowerEmail.endsWith("@yahoo.com"))
    return [{ name: "Yahoo", url: "https://mail.yahoo.com/", Icon: YahooIcon }];
  if (
    lowerEmail.endsWith("@icloud.com") ||
    lowerEmail.endsWith("@me.com") ||
    lowerEmail.endsWith("@mac.com")
  )
    return [
      { name: "iCloud", url: "https://www.icloud.com/mail", Icon: AppleIcon },
    ];
  if (lowerEmail.endsWith("@zoho.com") || lowerEmail.endsWith("@zohomail.in"))
    return [{ name: "Zoho", url: "https://mail.zoho.com/", Icon: ZohoIcon }];

  // Custom domain fallback: suggest primary business email providers
  return [
    { name: "Gmail", url: "https://mail.google.com/", Icon: GoogleIcon },
    { name: "Outlook", url: "https://outlook.live.com/", Icon: MicrosoftIcon },
    { name: "Zoho", url: "https://mail.zoho.com/", Icon: ZohoIcon },
  ];
};

export function OtpInputStep({
  otp,
  setOtp,
  email,
  isLoading,
  onBack,
}: OtpInputStepProps) {
  const providers = getEmailProviders(email);

  return (
    <Field>
      <FieldLabel htmlFor="otp">Enter confirmation code</FieldLabel>
      <Input
        key="otp-input"
        id="otp"
        type="text"
        maxLength={6}
        placeholder="••••••"
        required
        value={otp}
        onChange={(e) => setOtp(e.target.value.slice(0, 6))}
        className="text-center tracking-[1em] pl-[1em] text-lg font-mono"
        autoComplete="one-time-code"
      />
      <FieldDescription className="mb-2 text-xs text-center flex flex-col items-center gap-3">
        <span>
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </span>

        {providers.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {providers.map((p) => (
              <Button
                key={p.name}
                type="button"
                variant="outline"
                className="h-7 px-3 text-xs rounded-full border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-muted-foreground/60 transition-colors gap-1.5"
                onClick={() => (p.url ? window.open(p.url, "_blank") : null)}
                title={`Open ${p.name}`}
              >
                <p.Icon size={14} />
                {providers.length === 1 ? `Open ${p.name}` : p.name}
              </Button>
            ))}
          </div>
        )}
      </FieldDescription>
      <Button
        type="submit"
        variant="glassyInverted"
        disabled={isLoading || otp.length !== 6}
        className="w-full gap-1.5 font-normal cursor-pointer opacity-90 "
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ShieldCheck className="size-4.5" />
        )}
        Verify Code
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={isLoading}
        className="w-full text-muted-foreground"
        onClick={onBack}
      >
        Back to email
      </Button>
    </Field>
  );
}
