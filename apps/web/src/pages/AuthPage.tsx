import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { apiClient } from "@/lib/apiClient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ClayWalletIcon,
  ClayGroupIcon,
  ClayReceiptIcon,
  ClayShieldIcon,
  ClayGoogleIcon,
  ClayCheckIcon,
  ClayMoneyIcon,
} from "@/components/clay-icons";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Users,
  Sparkles,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AuthPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Form Field States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // API Request States
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
    <div className="min-h-screen bg-background flex">
      {/* ── Left Hero Panel (Immersive Gradient) ── */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden items-center justify-center p-12 bg-black">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-80 mix-blend-screen"
            style={{
              background: 'linear-gradient(45deg, #1E1B4B, #4C1D95, #312E81)',
              backgroundSize: '400% 400%',
              animation: 'gradient-flow 15s ease infinite',
            }}
          />
          {/* Animated Orbs */}
          <div
            className="absolute top-[20%] left-[10%] w-96 h-96 rounded-full opacity-60 mix-blend-screen animate-clay-float-slow"
            style={{
              background: "radial-gradient(circle, #6366F1 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full opacity-40 mix-blend-screen animate-clay-float"
            style={{
              background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
              filter: "blur(80px)",
              animationDelay: '1s'
            }}
          />
          <div
            className="absolute top-[40%] left-[60%] w-[400px] h-[400px] rounded-full opacity-30 mix-blend-screen animate-clay-float-delayed"
            style={{
              background: "radial-gradient(circle, #F59E0B 0%, transparent 70%)",
              filter: "blur(90px)",
            }}
          />
          {/* Subtle Grid Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{
              backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-xl w-full">
          {/* Brand */}
          <div className="animate-clay-fade-up">
            <h1 className="font-display text-6xl font-extrabold text-white tracking-tight leading-tight">
              Settle<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818cf8] to-[#c084fc]">Up</span>
            </h1>
            <p className="mt-6 text-2xl text-indigo-100/80 font-display font-medium leading-relaxed max-w-lg">
              Split expenses with friends, track debts, and settle up with ease.
            </p>
          </div>

          {/* Floating Glassmorphic Cards */}
          <div className="mt-16 relative h-[320px]">
            <div className="absolute top-0 left-0 animate-clay-float z-20">
              <div className="p-4 rounded-3xl flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <div className="bg-white/20 p-2 rounded-2xl">
                  <ClayWalletIcon size={36} />
                </div>
                <div>
                  <p className="text-xs text-indigo-200 font-medium tracking-wide uppercase">
                    You are owed
                  </p>
                  <p className="text-xl font-bold text-emerald-400 font-sans tracking-tight">
                    ₹2,450
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute top-8 right-8 animate-clay-float-delayed z-10">
              <div className="p-4 rounded-3xl flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <div className="bg-white/20 p-2 rounded-2xl">
                  <ClayGroupIcon size={36} />
                </div>
                <div>
                  <p className="text-xs text-indigo-200 font-medium tracking-wide uppercase">
                    Active groups
                  </p>
                  <p className="text-xl font-bold text-white font-sans tracking-tight">
                    5
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-16 animate-clay-float-slow z-30">
              <div className="p-4 rounded-3xl flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <div className="bg-white/20 p-2 rounded-2xl">
                  <ClayReceiptIcon size={36} />
                </div>
                <div>
                  <p className="text-xs text-indigo-200 font-medium tracking-wide uppercase">
                    This month
                  </p>
                  <p className="text-xl font-bold text-white font-sans tracking-tight">
                    ₹8,320
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-12 right-4 animate-clay-float z-10">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <ClayCheckIcon size={32} />
              </div>
            </div>

            <div className="absolute top-32 left-[45%] animate-clay-float-delayed z-0">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <ClayMoneyIcon size={32} />
              </div>
            </div>
          </div>

          {/* Feature pills */}
          <div
            className="mt-12 flex flex-wrap gap-3 animate-clay-fade-up stagger-4"
            style={{ animationDelay: "0.4s", opacity: 0 }}
          >
            {[
              "Track Expenses",
              "Smart Splitting",
              "Instant Settle",
              "Group Analytics",
            ].map((feature) => (
              <span
                key={feature}
                className="rounded-full px-4 py-1.5 text-sm font-bold inline-flex items-center gap-1 bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
        
        {/* Custom style for the gradient animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes gradient-flow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}} />
      </div>

      {/* ── Right Auth Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        <div
          className="w-full max-w-md animate-clay-scale-in flex-1 flex flex-col justify-center"
          style={{ opacity: 0, animationDelay: "0.15s" }}
        >
          {/* Mobile brand (hidden on desktop) */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="font-display text-4xl font-extrabold text-foreground tracking-tight">
              Settle<span className="text-primary">Up</span>
            </h1>
            <p className="mt-2 text-muted-foreground font-display">
              Expense splitting, simplified.
            </p>
          </div>

          <Card className="clay-card border-0 ring-0 p-0">
            <CardHeader className="pb-2 pt-8 px-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="clay-card p-2 bg-indigo-50/50">
                  <ClayShieldIcon size={28} />
                </div>
                <div>
                  <CardTitle className="font-display text-2xl font-extrabold text-slate-800">
                    {activeTab === "login" ? "Welcome back" : "Create account"}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-slate-500">
                    {activeTab === "login"
                      ? "Sign in to manage your expenses"
                      : "Get started with SettleUp today"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full p-1 bg-slate-100/80 rounded-2xl mb-8 border border-slate-200/50 shadow-inner">
                  <TabsTrigger
                    value="login"
                    className="flex-1 rounded-xl data-[state=active]:clay-card data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-display font-bold transition-all py-2"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="flex-1 rounded-xl data-[state=active]:clay-card data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-display font-bold transition-all py-2"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>

                {/* ── Error Banner ── */}
                {error && (
                  <div className="mb-6 p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2 shadow-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-medium leading-relaxed">{error}</p>
                  </div>
                )}

                {/* ── Login Tab ── */}
                <TabsContent value="login" className="mt-0">
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
                </TabsContent>

                {/* ── Register Tab ── */}
                <TabsContent value="register" className="mt-0">
                  <form
                    onSubmit={handleRegister}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="register-name"
                        className="font-display font-bold text-sm text-slate-700"
                      >
                        Full Name
                      </Label>
                      <div className="relative">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                        className="font-display font-bold text-sm text-slate-700"
                      >
                        Password
                      </Label>
                      <div className="relative">
                        <Lock
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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

                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="register-confirm"
                        className="font-display font-bold text-sm text-slate-700"
                      >
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                      <Separator className="flex-1 bg-slate-200" />
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                        or
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-slate-500 mt-6 font-display font-medium">
            {activeTab === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-colors"
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Trust Indicators */}
        <div 
          className="mt-12 flex items-center gap-8 text-xs font-semibold text-slate-400 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span>256-bit encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-indigo-400" />
            <span>10K+ users</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <span>Free forever</span>
          </div>
        </div>
      </div>
    </div>
  );
}
