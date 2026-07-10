import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  ClayWalletIcon,
  ClayGroupIcon,
  ClayReceiptIcon,
  ClayCheckIcon,
  ClayMoneyIcon,
} from "@/shared/components/ui/clay-icons";
import {
  ShieldCheck,
  Users,
  Sparkles,
} from "lucide-react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { ClayShieldIcon } from "@/shared/components/ui/clay-icons";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Left Hero Panel (Immersive Gradient) ── */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden items-center justify-center p-12 bg-black">
        {/* Simple Gradient Background (Performance Optimized) */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-violet-900 to-indigo-900 overflow-hidden">
          {/* Orbs using generic radial gradients (No blur filters) */}
          <div className="absolute top-[10%] left-[10%] w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.25)_0%,transparent_70%)] animate-clay-float-slow" />
          <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.2)_0%,transparent_70%)] animate-clay-float delay-1000" />
          <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,transparent_70%)] animate-clay-float-delayed" />
          
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[length:40px_40px] bg-[linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)]" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-xl w-full">
          {/* Brand */}
          <div className="animate-clay-fade-up">
            <h1 className="font-display text-6xl font-extrabold text-white tracking-tight leading-tight">
              Settle<span className="text-amber-400">Up</span>
            </h1>
            <p className="mt-6 text-2xl text-slate-300 font-display font-medium leading-relaxed max-w-lg">
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
          <div className="mt-12 flex flex-wrap gap-3 animate-clay-fade-up delay-[400ms] opacity-0 fill-mode-forwards">
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
      </div>

      {/* ── Right Auth Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md animate-clay-scale-in delay-[150ms] opacity-0 fill-mode-forwards flex-1 flex flex-col justify-center">
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

                <TabsContent value="login" className="mt-0">
                  <LoginForm />
                </TabsContent>

                <TabsContent value="register" className="mt-0">
                  <RegisterForm />
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
