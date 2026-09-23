import React from 'react';
import { Moon, Sun } from 'lucide-react';

export interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
}

/** Switches the admin between light and dark. */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle, className = '' }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    title={isDark ? 'Light mode' : 'Dark mode'}
    className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/60 transition-colors ${className}`}
  >
    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
  </button>
);
