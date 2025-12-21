
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'quantum';
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode; userId?: string }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('theme-mode') as ThemeMode) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
    
    const root = window.document.documentElement;
    // Always enforce Quantum
    if (!root.classList.contains('quantum')) {
        root.classList.add('quantum');
    }

    const applyTheme = () => {
      const isDark = 
        mode === 'dark' || 
        (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ theme: 'quantum', mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
