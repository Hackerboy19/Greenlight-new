import React from 'react';
import { Globe, Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export interface AdminTopbarProps {
  title: string;
  subtitle?: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenMenu: () => void;
  onReaderView: () => void;
  /** Page actions shown on the right, before the theme toggle. */
  actions?: React.ReactNode;
}

/** Top header of the Admin CMS: page title, page actions and the theme toggle. */
export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  title,
  subtitle,
  isDark,
  onToggleTheme,
  onOpenMenu,
  onReaderView,
  actions
}) => (
  <header className="sticky top-0 z-30 h-16 flex items-center gap-3 px-4 sm:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
    <button
      type="button"
      onClick={onOpenMenu}
      className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </button>

    <div className="flex-1 min-w-0">
      <h1 className="font-serif text-lg sm:text-xl font-black tracking-tight text-ink dark:text-slate-100 truncate">{title}</h1>
      {subtitle && <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>}
    </div>

    <div className="flex items-center gap-2">
      {actions}
      <button
        type="button"
        onClick={onReaderView}
        title="Open the reader site"
        aria-label="Open the reader site"
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-500/60 transition-colors"
      >
        <Globe className="w-4 h-4" />
      </button>
      <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
    </div>
  </header>
);
