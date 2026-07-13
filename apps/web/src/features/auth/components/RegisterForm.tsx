import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { apiClient } from "@/shared/lib/apiClient";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { ClayGoogleIcon } from "@/shared/components/ui/clay-icons";
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function RegisterForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post(`/auth/register`, {
        email,
        name,
        password,
      });

      const { user } = response.data;
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          Array.isArray(err.response?.data?.message)
            ? err.response.data.message[0]
            : err.response?.data?.message ||
                "Failed to create account. Please try again later.",
        );
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-2xl flex items-start gap-3 text-destructive animate-in fade-in slide-in-from-top-2 shadow-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleRegister}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="register-name"
            className="font-display font-bold text-sm text-foreground"
          >
            Full Name
          </Label>
          <div className="relative">
            <User
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="clay-input pl-11 h-12 text-[15px]"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="register-email"
            className="font-display font-bold text-sm text-foreground"
          >
            Email
          </Label>
          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="clay-input pl-11 h-12 text-[15px]"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="register-password"
            className="font-display font-bold text-sm text-foreground"
          >
            Password
          </Label>
          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="clay-input pl-11 pr-11 h-12 text-[15px]"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="register-confirm"
            className="font-display font-bold text-sm text-foreground"
          >
            Confirm Password
          </Label>
          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              id="register-confirm"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="clay-input pl-11 pr-11 h-12 text-[15px]"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="clay-btn-primary w-full text-[15px] mt-4 flex items-center justify-center gap-2 h-12 shadow-[0_8px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_12px_24px_rgba(99,102,241,0.4)]"
        >
          {isLoading && (
            <Loader2 className="animate-spin" size={18} />
          )}
          {isLoading ? "Creating Account..." : "Create Account"}
        </button>
        
        <div className="flex items-center gap-4 my-1">
          <Separator className="flex-1 bg-border" />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
            or
          </span>
          <Separator className="flex-1 bg-border" />
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => window.location.href = `${API_URL}/auth/google`}
          className="clay-btn-google h-12"
        >
          <ClayGoogleIcon size={20} />
          <span className="font-display font-bold text-[15px]">
            Google
          </span>
        </button>
      </form>
    </>
  );
}
