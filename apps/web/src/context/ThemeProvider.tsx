import React, { useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeContext, type ThemeColor } from "./ThemeContext";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeColor, setThemeColorState] = useState<ThemeColor>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme-color") as ThemeColor;
      return stored || "brand";
    }
    return "brand";
  });

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme-color", color);
      document.documentElement.setAttribute("data-theme", color);
    }
  };

  useEffect(() => {
    // Initial setup on mount
    document.documentElement.setAttribute("data-theme", themeColor);
  }, [themeColor]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeContext.Provider value={{ themeColor, setThemeColor }}>
        {children}
      </ThemeContext.Provider>
    </NextThemesProvider>
  );
}
