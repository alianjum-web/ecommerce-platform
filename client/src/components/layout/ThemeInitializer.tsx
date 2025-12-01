// components/providers/ThemeInitializer.tsx
"use client";

import { useEffect } from "react";

export default function ThemeInitializer() {
  useEffect(() => {
    const initializeTheme = () => {
      try {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'system' || !savedTheme) {
          // Use system preference
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const themeToSet = systemPrefersDark ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', themeToSet);
          localStorage.setItem('theme', 'system');
        } else {
          // Use saved preference
          document.documentElement.setAttribute('data-theme', savedTheme);
        }
      } catch (error) {
        // Fallback to light theme
        console.error('Theme initialization error:', error);
        document.documentElement.setAttribute('data-theme', 'light');
      }
    };

    // Initialize immediately to prevent flash
    initializeTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'system') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  return null; // This component doesn't render anything
}