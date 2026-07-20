import { createContext, useContext } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

export type ThemeColor = 'indigo' | 'emerald' | 'rose' | 'brand';

export interface ThemeProviderContext {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
}

export const ThemeContext = createContext<ThemeProviderContext | undefined>(undefined);

// Hook that combines next-themes (mode) with our custom theme color
export function useTheme() {
  const context = useContext(ThemeContext);
  const nextTheme = useNextTheme();

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return {
    ...context,
    themeMode: nextTheme.theme, // 'light', 'dark', 'system'
    resolvedTheme: nextTheme.resolvedTheme, // 'light' or 'dark' (if system)
    setThemeMode: nextTheme.setTheme,
  };
}
