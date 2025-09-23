import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-lg border border-border/40 bg-background/80 backdrop-blur-sm hover:bg-accent/50 transition-all duration-200"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <Sun className={`h-4 w-4 transition-all duration-300 ${
        theme === 'light' 
          ? 'rotate-0 scale-100 opacity-100' 
          : 'rotate-90 scale-0 opacity-0'
      }`} />
      <Moon className={`absolute h-4 w-4 transition-all duration-300 ${
        theme === 'dark' 
          ? 'rotate-0 scale-100 opacity-100' 
          : '-rotate-90 scale-0 opacity-0'
      }`} />
    </Button>
  );
};

export default ThemeToggle;
