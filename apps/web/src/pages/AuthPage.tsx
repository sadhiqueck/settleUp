import { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { useTheme } from "@/context/ThemeContext";
import logoDark from "@/assets/logo-dark.webp";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  // Customize background colors specifically for this Auth page
  // Dark mode: Pure Black (#000000)
  // Light mode: Beautiful soft grayish blue-gray that matches and blends with the light image (#f1f3f7)
  const bgColor = isDark ? "#000000" : "#f1f3f7";
  const bgRgba = isDark ? "0,0,0" : "241,243,247";

  return (
    <div 
      className="relative min-h-svh overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: bgColor }}
    >
      {/* ── Centered Container for Ultra-Wide Screens ── */}
      <div className="max-w-[1440px] mx-auto relative min-h-svh w-full flex flex-col justify-center">
        
        {/* ── Full-page background image (centered, scaled down, feathered) ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={isDark ? "/auth-bg-dark.webp" : "/auth-bg-light.webp"}
            alt=""
            className="w-[90%] md:w-[85%] max-w-[1100px] h-auto object-contain select-none opacity-90"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        {/* Feathered edge gradients — placed inside the max-w container so they don't stretch indefinitely on ultra-wide screens */}
        {/* Left edge (strongest — form sits here) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to right, ${bgColor} 0%, rgba(${bgRgba},0.98) 15%, rgba(${bgRgba},0.85) 30%, rgba(${bgRgba},0.4) 45%, transparent 60%)`,
          }}
        />
        {/* Right edge */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to left, ${bgColor} 0%, rgba(${bgRgba},0.9) 5%, rgba(${bgRgba},0.4) 15%, transparent 30%)`,
          }}
        />
        {/* Top edge */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, ${bgColor} 0%, rgba(${bgRgba},0.9) 5%, rgba(${bgRgba},0.3) 15%, transparent 30%)`,
          }}
        />
        {/* Bottom edge */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${bgColor} 0%, rgba(${bgRgba},0.9) 5%, rgba(${bgRgba},0.3) 15%, transparent 30%)`,
          }}
        />

        {/* ── Form panel (floats on top, left-aligned) ── */}
        <div className="relative z-10 flex w-full items-center justify-center lg:justify-start p-6 md:p-10 lg:pl-16 xl:pl-24">
        <div className="w-full max-w-sm">
          {/* Brand Logo */}
          <div className="mb-8 flex justify-start md:justify-center">
            <img 
              src={logoDark} 
              className={`h-11 w-auto object-contain transition-all ${
                isDark ? "invert brightness-200" : ""
              }`} 
              alt="Fettl" 
            />
          </div>

          <Card className="border-0 shadow-none bg-background/80 backdrop-blur-xl ring-1 ring-border/50">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold font-display">
                {activeTab === "login" ? "Welcome back" : "Create account"}
              </CardTitle>
              <CardDescription>
                {activeTab === "login"
                  ? "Sign in to manage your expenses"
                  : "Get started with Fettl today"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="login" className="flex-1">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="register" className="flex-1">
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

          <p className="text-center text-sm text-muted-foreground mt-4">
            {activeTab === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className="text-primary font-semibold underline-offset-4 hover:underline transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="text-primary font-semibold underline-offset-4 hover:underline transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          {/* Terms footer */}
          <div className="text-center text-xs text-muted-foreground text-balance mt-6">
            By continuing, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
            .
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
