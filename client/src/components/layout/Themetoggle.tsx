"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Zap, Sparkles, Monitor } from "lucide-react";

// Modular Components
const ThemeIcon = ({ theme }: { theme: 'light' | 'dark' | 'system' }) => {
  const icons = {
    light: <Sun className="w-4 h-4" />,
    dark: <Moon className="w-4 h-4" />,
    system: <Monitor className="w-4 h-4" />,
  };
  
  return (
    <div className="relative">
      {icons[theme]}
      <div className={`absolute -inset-1 rounded-full ${
        theme === 'light' ? 'bg-primary/20' : 
        theme === 'dark' ? 'bg-secondary/20' : 'bg-accent/20'
      } blur-sm`} />
    </div>
  );
};

const ThemeIndicator = ({ theme }: { theme: 'light' | 'dark' | 'system' }) => (
  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
    <div className={`w-1 h-1 rounded-full ${
      theme === 'light' ? 'bg-primary animate-pulse' : 
      theme === 'dark' ? 'bg-secondary animate-pulse' : 'bg-accent animate-pulse'
    }`} />
  </div>
);

const ThemeGlowEffect = ({ isHovered, theme }: { isHovered: boolean; theme: 'light' | 'dark' | 'system' }) => {
  if (!isHovered) return null;
  
  const gradientColors = {
    light: 'from-primary via-secondary to-accent',
    dark: 'from-secondary via-primary to-accent',
    system: 'from-accent via-primary to-secondary',
  };
  
  return (
    <div className="absolute inset-0 rounded-full">
      <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${gradientColors[theme]} opacity-20 blur-md animate-pulse`} />
      <div className="absolute inset-0 rounded-full border border-glass-border animate-ping opacity-30" />
    </div>
  );
};

// Main ThemeToggle Component
export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    setTheme(savedTheme);
    setMounted(true);
    
    const applyTheme = (themeToApply: 'light' | 'dark') => {
      document.documentElement.setAttribute('data-theme', themeToApply);
    };

    if (savedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      applyTheme(systemTheme);
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    // Add a subtle animation effect
    document.documentElement.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
      setTheme(nextTheme);
      localStorage.setItem('theme', nextTheme);
      
      if (nextTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
      } else {
        document.documentElement.setAttribute('data-theme', nextTheme);
      }
      
      setIsAnimating(false);
      document.documentElement.style.transition = '';
    }, 150);
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light Mode';
      case 'dark': return 'Dark Mode';
      case 'system': return 'Auto Mode';
    }
  };


  if (!mounted) {
    return (
      <div className="w-12 h-12 rounded-full glass-effect border-glass-border animate-pulse" />
    );
  }

  return (
    <div className="relative">
      {/* Tooltip */}
      <div className={`absolute -top-14 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-lg glass-effect border-glass-border transition-all duration-300 ${
        isHovered ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
      }`}>
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-glass border-l-glass-border border-t-glass-border rotate-45" />
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={toggleTheme}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative w-12 h-12 rounded-full glass-effect border-glass-border hover:neon-border transition-all duration-300 ${
          isAnimating ? 'scale-95 rotate-90' : 'hover:scale-110'
        } group`}
        aria-label={`Switch theme (Current: ${getThemeLabel()})`}
        disabled={isAnimating}
      >
        {/* Background Effects */}
        <ThemeGlowEffect isHovered={isHovered} theme={theme} />
        
        {/* Pulse ring */}
        <div className={`absolute -inset-2 rounded-full border ${
          theme === 'light' ? 'border-primary/30' : 
          theme === 'dark' ? 'border-secondary/30' : 'border-accent/30'
        } animate-ping opacity-0 group-hover:opacity-100 transition-opacity`} />
        
        {/* Icon Container */}
        <div className="relative z-10 flex items-center justify-center">
          <ThemeIcon theme={theme} />
          
          {/* Animated sparkles during transition */}
          {isAnimating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent animate-spin-slow" />
            </div>
          )}
        </div>
        
        {/* Active indicator */}
        <ThemeIndicator theme={theme} />
        
        {/* Hover effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-glass/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>

      {/* Theme Cycle Indicator */}
      <div className="flex justify-center mt-2">
        <div className="flex items-center gap-1">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <div
              key={t}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                theme === t 
                  ? t === 'light' ? 'bg-primary' : 
                    t === 'dark' ? 'bg-secondary' : 'bg-accent'
                  : 'bg-muted'
              } ${theme === t ? 'w-4' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}