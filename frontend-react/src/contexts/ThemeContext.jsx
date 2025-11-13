import React, { createContext, useEffect, useMemo, useState } from 'react';

// Create context
export const ThemeContext = createContext('light');

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    root.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    isDark: theme === 'dark',
    toggleTheme: () => {
      // small interaction feedback
      const body = document.body;
      body.classList.add('theme-swap');
      setTimeout(() => body.classList.remove('theme-swap'), 400);
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    },
    setTheme
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}