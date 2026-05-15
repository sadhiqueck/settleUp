import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
// import { Button } from "@/components/ui/button";
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
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { user } = response.data;
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Invalid credentials. Please try again.",
      );
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
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        name,
        password,
      });

      const { user } = response.data;
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (err: any) {
      setError(
        // Handles cases from nestjs like ConflictException('User with this email already exists') or validation errors
        Array.isArray(err.response?.data?.message)
          ? err.response.data.message[0]
          : err.response?.data?.message ||
              "Failed to create account. Please try again later.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Left Hero Panel ── */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden items-center justify-center p-12">
        {/* Background blobs */}
        <div className="absolute inset-0">
          <div
            className="absolute top-[10%] left-[10%] w-72 h-72 rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, #00C700 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute bottom-[15%] right-[15%] w-96 h-96 rounded-full opacity-15"
            style={{
              background:
                "radial-gradient(circle, #6CE71D 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute top-[50%] left-[50%] w-64 h-64 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #FF4B4B 0%, transparent 70%)",
              filter: "blur(50px)",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg">
          {/* Brand */}
          <div className="animate-clay-fade-up">
            <h1 className="font-display text-5xl font-extrabold text-foreground tracking-tight leading-tight">
              Settle<span className="text-primary">Up</span>
            </h1>
            <p className="mt-4 text-xl text-muted-foreground font-display font-medium leading-relaxed">
              Split expenses with friends, track debts, and settle up — all in
              one place.
            </p>
          </div>

          {/* Floating Clay Icons */}
          <div className="mt-12 relative h-64">
            <div className="absolute top-0 left-0 animate-clay-float">
              <div className="clay-card-elevated p-4 flex items-center gap-3">
                <ClayWalletIcon size={40} />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    You are owed
                  </p>
                  <p className="text-lg font-bold clay-stat-green font-sans">
                    ₹2,450
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute top-4 right-4 animate-clay-float-delayed">
              <div className="clay-card-elevated p-4 flex items-center gap-3">
                <ClayGroupIcon size={40} />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Active groups
                  </p>
                  <p className="text-lg font-bold text-foreground font-sans">
                    5
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-16 animate-clay-float-slow">
              <div className="clay-card-elevated p-4 flex items-center gap-3">
                <ClayReceiptIcon size={40} />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    This month
                  </p>
                  <p className="text-lg font-bold text-foreground font-sans">
                    ₹8,320
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 right-0 animate-clay-float">
              <div className="clay-card p-3">
                <ClayCheckIcon size={32} />
              </div>
            </div>

            <div className="absolute top-24 left-[45%] animate-clay-float-delayed">
              <div className="clay-card p-3">
                <ClayMoneyIcon size={32} />
              </div>
            </div>
          </div>

          {/* Feature pills */}
          <div
            className="mt-8 flex flex-wrap gap-3 animate-clay-fade-up stagger-4"
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
                className="clay-badge clay-badge-green text-sm"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Auth Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div
          className="w-full max-w-md animate-clay-scale-in"
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
                <div className="clay-card p-2">
                  <ClayShieldIcon size={28} />
                </div>
                <div>
                  <CardTitle className="font-display text-xl font-bold">
                    {activeTab === "login" ? "Welcome back" : "Create account"}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {activeTab === "login"
                      ? "Sign in to manage your expenses"
                      : "Get started with SettleUp today"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full p-1 bg-muted rounded-2xl mb-6">
                  <TabsTrigger
                    value="login"
                    className="flex-1 rounded-xl data-[state=active]:clay-card data-[state=active]:bg-background data-[state=active]:shadow-none font-display font-semibold transition-all"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="flex-1 rounded-xl data-[state=active]:clay-card data-[state=active]:bg-background data-[state=active]:shadow-none font-display font-semibold transition-all"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>

                {/* ── Error Banner ── */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={18} />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                {/* ── Login Tab ── */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="login-email"
                        className="font-display font-semibold text-sm"
                      >
                        Email
                      </Label>
                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={18}
                        />
                        <Input
                          id="login-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="clay-input pl-11"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="login-password"
                          className="font-display font-semibold text-sm"
                        >
                          Password
                        </Label>
                        <button
                          type="button"
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={18}
                        />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="clay-input pl-11 pr-11"
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

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="clay-btn-primary w-full text-base mt-2 flex items-center justify-center gap-2"
                    >
                      {isLoading && (
                        <Loader2 className="animate-spin" size={18} />
                      )}
                      {isLoading ? "Signing in..." : "Sign In"}
                    </button>

                    <div className="flex items-center gap-4 my-1">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground font-medium">
                        or
                      </span>
                      <Separator className="flex-1" />
                    </div>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => window.location.href = `${API_URL}/auth/google`}
                      className="clay-card border-0 font-semibold px-6 py-3 w-full flex items-center justify-center gap-3 text-[#3c4043] hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <ClayGoogleIcon size={20} />
                      <span className="font-display font-semibold">
                        Continue with Google
                      </span>
                    </button>
                  </form>
                </TabsContent>

                {/* ── Register Tab ── */}
                <TabsContent value="register">
                  <form
                    onSubmit={handleRegister}
                    className="flex flex-col gap-5"
                  >
                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="register-name"
                        className="font-display font-semibold text-sm"
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
                          className="clay-input pl-11"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="register-email"
                        className="font-display font-semibold text-sm"
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
                          className="clay-input pl-11"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="register-password"
                        className="font-display font-semibold text-sm"
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
                          className="clay-input pl-11 pr-11"
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
                        className="font-display font-semibold text-sm"
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
                          className="clay-input pl-11 pr-11"
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
                      className="clay-btn-primary w-full text-base mt-2 flex items-center justify-center gap-2"
                    >
                      {isLoading && (
                        <Loader2 className="animate-spin" size={18} />
                      )}
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </button>

                    <div className="flex items-center gap-4 my-1">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground font-medium">
                        or
                      </span>
                      <Separator className="flex-1" />
                    </div>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => window.location.href = `${API_URL}/auth/google`}
                      className="clay-card border-0 font-semibold px-6 py-3 w-full flex items-center justify-center gap-3 text-[#3c4043] hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <ClayGoogleIcon size={20} />
                      <span className="font-display font-semibold">
                        Sign up with Google
                      </span>
                    </button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6 font-display">
            {activeTab === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className="text-primary font-semibold hover:underline"
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
                  className="text-primary font-semibold hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
