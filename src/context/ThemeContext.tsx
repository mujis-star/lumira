'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'midnight';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeToDOM(t: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('theme-dark', 'theme-light', 'theme-midnight', 'dark', 'light');
  root.classList.add(`theme-${t}`);
  if (t === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }
  root.setAttribute('data-theme', t);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lumira-theme') as Theme;
      if (saved && (saved === 'dark' || saved === 'light' || saved === 'midnight')) {
        return saved;
      }
    }
    return 'dark';
  });

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumira-theme', newTheme);
    }
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : theme === 'light' ? 'midnight' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <div className="lumira-app-root transition-colors duration-300 min-h-screen">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
