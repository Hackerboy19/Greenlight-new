/**
 * Light / dark theme for the Admin CMS.
 *
 * 'system' follows the operating system. 'light' and 'dark' put a class on
 * <html> that the dark: variant in index.css obeys, and the choice is kept in
 * localStorage so it survives reloads.
 */
import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'greenlight_theme';

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage blocked: fall back to the system theme.
  }
  return 'system';
}

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

function applyPreference(preference: ThemePreference) {
  const root = document.documentElement;
  root.classList.toggle('dark', preference === 'dark');
  root.classList.toggle('light', preference === 'light');
}

// Apply the saved choice before React renders, so the page doesn't flash.
if (typeof document !== 'undefined') applyPreference(readPreference());

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    applyPreference(preference);
    try {
      if (preference === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Not saved; the choice still applies until reload.
    }
  }, [preference]);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return;
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const isDark = preference === 'dark' || (preference === 'system' && systemDark);
  const toggle = useCallback(() => setPreference(isDark ? 'light' : 'dark'), [isDark]);

  return { preference, isDark, setPreference, toggle };
}
