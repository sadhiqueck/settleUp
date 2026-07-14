import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { apiClient } from "@/shared/lib/apiClient";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { ClayGoogleIcon } from "@/shared/components/ui/clay-icons";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

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
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 text-red-600 dark:bg-red-950/20 dark:border-red-800/40 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm leading-snug">{error}</p>
        </div>
      )}

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="register-name"
            className="text-sm font-semibold text-[#111827] dark:text-[#dbdee1]"
          >
            Full Name
          </Label>
          <Input
            id="register-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            disabled={isLoading}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="register-email"
            className="text-sm font-semibold text-[#111827] dark:text-[#dbdee1]"
          >
            Email
          </Label>
          <Input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
            disabled={isLoading}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="register-password"
            className="text-sm font-semibold text-[#111827] dark:text-[#dbdee1]"
          >
            Password
          </Label>
          <div className="relative">
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••••••••"
              className="pr-10"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#dbdee1] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="register-confirm"
            className="text-sm font-semibold text-[#111827] dark:text-[#dbdee1]"
          >
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="register-confirm"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="•••••••••••••"
              className="pr-10"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#dbdee1] transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="clay-btn-primary w-full h-10 mt-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(17,24,39,0.2)]"
        >
          {isLoading && <Loader2 className="animate-spin" size={16} />}
          {isLoading ? "Creating account..." : "Create account"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <Separator className="flex-1 bg-[#e5e7eb] dark:bg-[rgba(255,255,255,0.08)]" />
          <span className="text-xs uppercase tracking-wider text-[#9ca3af] font-medium">
            or
          </span>
          <Separator className="flex-1 bg-[#e5e7eb] dark:bg-[rgba(255,255,255,0.08)]" />
        </div>

        {/* Google */}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => (window.location.href = `${API_URL}/auth/google`)}
          className="clay-btn-google"
        >
          <ClayGoogleIcon size={18} />
          <span className="font-semibold text-sm">Continue with Google</span>
        </button>
      </form>
    </>
  );
}
