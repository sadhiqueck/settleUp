import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import { FieldGroup } from "@/shared/components/ui/field";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import { EmailInputStep } from "./shared/EmailInputStep";
import { OtpInputStep } from "./shared/OtpInputStep";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  
  const { sendOtp, verifyOtp, loginWithGoogle } = useAuth();
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address");
        return;
      }
      
      sendOtp.mutate(email, {
        onSuccess: () => {
          setStep("otp");
          if (cooldown === 0) setCooldown(5);
        }
      });
    } else {
      verifyOtp.mutate({ email, otp }, {
        onSuccess: () => {
          // Login specific redirect
          navigate("/dashboard"); 
        }
      });
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:gap-6 w-full max-w-md mx-auto justify-center",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 md:gap-4 text-center mb-0 md:mb-2">
        <div className="space-y-1 md:space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Sign in to Fettl
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground text-balance">
            Welcome back! Enter your email to access your account.
          </p>
        </div>
      </div>
      <form className="max-w-92 mx-auto w-full" onSubmit={handleSubmit}>
        <FieldGroup>
          {step === "email" ? (
            <EmailInputStep 
              email={email} 
              setEmail={setEmail} 
              isLoading={sendOtp.isPending} 
              cooldown={cooldown} 
              onGoogleLogin={loginWithGoogle} 
            />
          ) : (
            <OtpInputStep 
              otp={otp} 
              setOtp={setOtp} 
              email={email} 
              isLoading={verifyOtp.isPending} 
              onBack={() => setStep("email")} 
            />
          )}
        </FieldGroup>
      </form>

      <div className="text-center text-sm md:text-base text-muted-foreground px-6 mt-1">
        Don't have an account?{" "}
        <Link
          to="/signup"
          className="text-blue-500 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-white font-medium hover:underline transition-colors"
        >
          Sign up
        </Link>
      </div>

      <div className="px-6 text-center mt-4 text-xs text-muted-foreground">
        By signing in, you agree to our{" "}
        <Link to="/terms" className="underline hover:text-foreground transition-colors">Terms</Link> and{" "}
        <Link to="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</Link>.
      </div>
    </div>
  );
}
