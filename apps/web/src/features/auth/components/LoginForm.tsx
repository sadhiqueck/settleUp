import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { apiClient } from "@/shared/lib/apiClient";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { ClayGoogleIcon } from "@/shared/components/ui/clay-icons";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post(`/auth/login`, {
        email,
        password,
      });

      const { user } = response.data;
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Invalid credentials. Please try again.",
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
        <div className="mb-6 p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2 shadow-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="login-email"
            className="font-display font-bold text-sm text-slate-700"
          >
            Email
          </Label>
          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              id="login-email"
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
          <div className="flex items-center justify-between">
            <Label
              htmlFor="login-password"
              className="font-display font-bold text-sm text-slate-700"
            >
              Password
            </Label>
            <button
              type="button"
              className="text-xs text-indigo-600 font-bold hover:text-indigo-700 transition-colors hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              id="login-password"
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
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? (
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
          {isLoading ? "Signing in..." : "Sign In"}
        </button>

        <div className="flex items-center gap-4 my-2">
          <Separator className="flex-1 bg-slate-200" />
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
            or continue with
          </span>
          <Separator className="flex-1 bg-slate-200" />
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
