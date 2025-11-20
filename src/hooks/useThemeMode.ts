import { useState, useEffect, useMemo } from 'react';
import { useMediaQuery, createTheme } from '@mui/material';

export type ThemeMode = 'light' | 'dark' | 'system';

export const useThemeMode = () => {
  // Determine system preference
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  // State for theme mode: 'light', 'dark', or 'system'
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as ThemeMode) || 'system';
  });

  // Determine which theme to use
  const activeMode = themeMode === 'system' 
    ? (prefersDarkMode ? 'dark' : 'light')
    : themeMode;

  // Create theme
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: activeMode,
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
        },
      }),
    [activeMode]
  );

  // Save theme choice to localStorage
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  // Update meta theme-color for browser
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', activeMode === 'dark' ? '#121212' : '#1976d2');
    }
  }, [activeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  };

  return {
    theme,
    themeMode,
    activeMode,
    toggleTheme,
  };
};

