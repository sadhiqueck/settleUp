import { Check, Moon, Sun, Monitor } from "lucide-react";
import { useTheme, type ThemeColor } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";

const COLORS: { name: string; value: ThemeColor; className: string }[] = [
  { name: "Indigo", value: "indigo", className: "bg-indigo-500" },
  { name: "Emerald", value: "emerald", className: "bg-emerald-500" },
  { name: "Rose", value: "rose", className: "bg-rose-500" },
  { name: "Amber", value: "amber", className: "bg-amber-500" },
];

export function ThemeToggle() {
  const { themeMode, setThemeMode, themeColor, setThemeColor } = useTheme();

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Appearance</label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={themeMode === "light" ? "default" : "outline"}
            className={`w-full justify-start ${
              themeMode === "light" ? "border-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setThemeMode("light")}
          >
            <Sun className="mr-2 h-4 w-4" />
            Light
          </Button>
          <Button
            variant={themeMode === "dark" ? "default" : "outline"}
            className={`w-full justify-start ${
              themeMode === "dark" ? "border-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setThemeMode("dark")}
          >
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </Button>
          <Button
            variant={themeMode === "system" ? "default" : "outline"}
            className={`w-full justify-start ${
              themeMode === "system" ? "border-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setThemeMode("system")}
          >
            <Monitor className="mr-2 h-4 w-4" />
            System
          </Button>
        </div>
      </div>

      {/* Color Theme Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Color Theme</label>
        <div className="flex flex-wrap gap-3">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => setThemeColor(color.value)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
                themeColor === color.value
                  ? "border-primary shadow-sm"
                  : "border-transparent"
              } ${color.className}`}
              title={color.name}
            >
              {themeColor === color.value && (
                <Check className="h-5 w-5 text-white" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
