
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { CustomTheme, ThemeColors } from '../types';

// Extend Theme type to include custom IDs
export type Theme = 
  | 'light' | 'dark' | 'professional' | 'neumorphism' 
  | 'glassmorphism' | 'brutalism' | 'minimalist' | '3d' 
  | 'animated' | 'gradients' | 'micro' | 'asymmetric' 
  | 'vivid' | 'lumen' | 'neo' | 'aura' | 'quantum'
  | string; // For custom UUIDs

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  customThemes: CustomTheme[];
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  refreshCustomThemes: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode; userId?: string }> = ({ children, userId }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme_preset') as Theme) || 'light';
    }
    return 'light';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('theme_mode');
      if (savedMode) return savedMode === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);

  const refreshCustomThemes = async () => {
      try {
          const themes = await DataService.getCustomThemes();
          setCustomThemes(themes);
      } catch (e) {
          console.error("Failed to load custom themes", e);
      }
  };

  // Helper to convert Hex to RGBA
  const hexToRgba = (hex: string, alpha: number) => {
    if (!hex) return 'rgba(255,255,255,1)';
    // Remove hash
    hex = hex.replace('#', '');
    
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Initial Data Load
  useEffect(() => {
    if (userId) {
        refreshCustomThemes();
        DataService.getThemePreference(userId).then(prefs => {
            if (prefs) {
                setThemeState(prefs.theme as Theme);
                setIsDarkMode(prefs.darkMode);
            }
        });
    }
  }, [userId]);

  // Apply Theme & CSS Variables
  useEffect(() => {
    const root = window.document.documentElement;
    // 1. Clear existing standard classes
    root.classList.remove(
      'dark', 'professional', 'neumorphism', 'glassmorphism', 'brutalism', 
      'minimalist', '3d', 'animated', 'gradients', 'micro', 'asymmetric', 
      'vivid', 'lumen', 'neo', 'aura', 'quantum', 'custom-theme'
    );
    
    // 2. Remove any injected style tag for custom variables
    const existingStyle = document.getElementById('custom-theme-styles');
    if (existingStyle) existingStyle.remove();

    // 3. Apply Dark Mode
    if (isDarkMode) root.classList.add('dark');

    // 4. Resolve Colors for Custom Theme
    const activeThemeObj = customThemes.find(t => t.id === theme);
    let activeColors: ThemeColors | undefined;

    if (activeThemeObj) {
        // Check if it has the new structure { light, dark }
        // We use type assertion since we know the structure in DB might vary during migration
        const colorsAny = activeThemeObj.colors as any;
        if (colorsAny.light && colorsAny.dark) {
            activeColors = isDarkMode ? colorsAny.dark : colorsAny.light;
        } else {
            // Backward compatibility for old flat structure
            activeColors = colorsAny; 
        }
    }

    // Fallback: Check local storage (Unauthenticated/Login state) for cached custom theme
    if (!activeColors) {
        const presets = ['light', 'dark', 'professional', 'neumorphism', 'glassmorphism', 'brutalism', 'minimalist', '3d', 'animated', 'gradients', 'micro', 'asymmetric', 'vivid', 'lumen', 'neo', 'aura', 'quantum'];
        // If the current theme ID is NOT a system preset, assume it's custom and try to load cached colors
        if (!presets.includes(theme)) {
             const cached = localStorage.getItem('custom_theme_colors');
             if (cached) {
                 try { 
                     const parsed = JSON.parse(cached);
                     if (parsed.light && parsed.dark) {
                         activeColors = isDarkMode ? parsed.dark : parsed.light;
                     } else {
                         activeColors = parsed;
                     }
                 } catch(e) {}
             }
        }
    }

    if (activeColors) {
        root.classList.add('custom-theme');
        
        // Calculate surface color with opacity
        const opacity = activeColors.surfaceOpacity !== undefined ? activeColors.surfaceOpacity : 1;
        const surfaceColor = hexToRgba(activeColors.surface, opacity);
        // Add blur if opacity is less than 1 (glass effect)
        const blurAmount = opacity < 0.95 ? '12px' : '0px';
        
        // Determine button background
        const btnBg = activeColors.buttonBackground || activeColors.primary;

        // Inject CSS Variables
        const style = document.createElement('style');
        style.id = 'custom-theme-styles';
        style.innerHTML = `
            :root {
                --color-primary: ${activeColors.primary};
                --color-secondary: ${activeColors.secondary};
                --bg-background: ${activeColors.background};
                --bg-surface: ${surfaceColor};
                --surface-blur: ${blurAmount};
                --text-main: ${activeColors.textMain};
                --text-secondary: ${activeColors.textSecondary};
                --border-color: ${activeColors.border};
                --bg-button: ${btnBg};
                --text-button: ${activeColors.buttonText || '#ffffff'};
            }
        `;
        document.head.appendChild(style);
        
        // Cache full theme structure for use when logged out
        if (activeThemeObj) {
            localStorage.setItem('custom_theme_colors', JSON.stringify(activeThemeObj.colors));
        }
    } else {
        // Standard Preset
        if (theme !== 'light' && theme !== 'dark') {
            root.classList.add(theme);
        }
    }

    localStorage.setItem('theme_preset', theme);
    localStorage.setItem('theme_mode', isDarkMode ? 'dark' : 'light');
  }, [theme, isDarkMode, customThemes]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    // Legacy auto-switch logic for standard presets
    if (newTheme === 'dark') setIsDarkMode(true);
    if (newTheme === 'light') setIsDarkMode(false);
    
    if (userId) {
        DataService.saveThemePreference(userId, newTheme, isDarkMode);
    }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (userId) {
        DataService.saveThemePreference(userId, theme, newMode);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setTheme, toggleTheme, customThemes, refreshCustomThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};
