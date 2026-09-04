import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readString, writeString } from '../lib/storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'theme';

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

/**
 * Mirrors the inline script in index.html: a stored valid value wins,
 * otherwise the OS preference. Both must agree or the first paint flashes.
 */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = readString(STORAGE_KEY);
  if (isTheme(stored)) return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.style.colorScheme = theme;
    writeString(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme(prev => (prev === 'light' ? 'dark' : 'light')), []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
