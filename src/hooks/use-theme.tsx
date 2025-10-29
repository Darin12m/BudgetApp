"use client";

import { useState, useEffect, useLayoutEffect, useCallback } from 'react';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // useLayoutEffect to set initial theme to dark mode immediately on load
  useLayoutEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark'); // Ensure localStorage reflects dark mode
    setIsDarkMode(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newMode;
    });
  }, []);

  return { isDarkMode, toggleTheme };
}