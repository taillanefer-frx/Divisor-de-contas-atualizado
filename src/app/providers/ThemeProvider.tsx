import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = 'divisor-theme-mode';

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const savedMode = window.localStorage.getItem(storageKey);
  if (savedMode === 'light' || savedMode === 'dark') return savedMode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    window.localStorage.setItem(storageKey, mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, toggleMode: () => setMode((currentMode) => (currentMode === 'dark' ? 'light' : 'dark')) }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
