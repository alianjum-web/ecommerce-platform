// components/ThemeToggle.tsx - CORRECTED
"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Sparkles, Monitor } from "lucide-react";

// Modular Components
const ThemeIcon = ({ theme }: { theme: 'light' | 'dark' | 'system' }) => {
  const icons = {
    light: <Sun className="w-4 h-4 text-primary" />,
    dark: <Moon className="w-4 h-4 text-secondary" />,
    system: <Monitor className="w-4 h-4 text-accent" />,
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

const ThemeGlowEffect = ({ isHovered, theme }: { isHovered: boolean; theme: 'light' | 'dark' | 'system' }) => {
  if (!isHovered) return null;
  
  const gradientColors = {
    light: 'from-primary/20 via-secondary/10 to-accent/10',
    dark: 'from-secondary/20 via-primary/10 to-accent/10',
    system: 'from-accent/20 via-primary/10 to-secondary/10',
  };
  
  return (
    <div className="absolute inset-0 rounded-full overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-r ${gradientColors[theme]} animate-pulse`} />
    </div>
  );
};

// Main ThemeToggle Component
export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sync with current theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    setTheme(savedTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    // Smooth transition
    document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
    setTimeout(() => {
      setTheme(nextTheme);
      localStorage.setItem('theme', nextTheme);
      
      // Apply theme based on selection
      if (nextTheme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', nextTheme);
      }
      
      setIsAnimating(false);
      document.documentElement.style.transition = '';
    }, 200);
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light Mode';
      case 'dark': return 'Dark Mode';
      case 'system': return 'Auto Mode';
      default: return 'Theme';
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
      <div className={`absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-lg glass-effect border-glass-border transition-all duration-300 z-50 ${
        isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}>
        <p className="text-xs font-medium whitespace-nowrap">{getThemeLabel()}</p>
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-glass border-l-glass-border border-t-glass-border rotate-45" />
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={toggleTheme}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative w-12 h-12 rounded-full glass-effect border-glass-border hover:border-primary/50 transition-all duration-300 ${
          isAnimating ? 'scale-95 rotate-90' : 'hover:scale-110'
        } group`}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} mode`}
        disabled={isAnimating}
      >
        {/* Background Effects */}
        <ThemeGlowEffect isHovered={isHovered} theme={theme} />
        
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
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <div className={`w-1.5 h-1.5 rounded-full ${
            theme === 'light' ? 'bg-primary animate-pulse' : 
            theme === 'dark' ? 'bg-secondary animate-pulse' : 'bg-accent animate-pulse'
          }`} />
        </div>
      </button>

      {/* Theme Cycle Indicator */}
      <div className="flex justify-center mt-3">
        <div className="flex items-center gap-1.5">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <div
              key={t}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                theme === t 
                  ? t === 'light' ? 'bg-primary ring-1 ring-primary/30' : 
                    t === 'dark' ? 'bg-secondary ring-1 ring-secondary/30' : 
                    'bg-accent ring-1 ring-accent/30'
                  : 'bg-muted'
              } ${theme === t ? 'w-4 scale-125' : ''}`}
              title={t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'Auto'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}