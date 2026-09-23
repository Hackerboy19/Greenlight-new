import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { GreenLightLogo } from '../GreenLightLogo';
import { buttonClass } from './ui';
import { AdminSession, signIn } from '../../utils/adminAuth';

interface AdminLoginScreenProps {
  onSignedIn: (session: AdminSession) => void;
  onCancel: () => void;
  /** Shown above the form, e.g. after a session expires. */
  notice?: string | null;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onSignedIn, onCancel, notice }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const session = await signIn(email.trim(), password);
      setPassword('');
      onSignedIn(session);
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-hero border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
        <div className="p-6 sm:p-8">
        <div className="flex justify-center mb-6">
          <GreenLightLogo variant="horizontal" size="md" subtitle="Admin CMS" />
        </div>
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-ink dark:text-slate-100">Welcome back</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to write, review and publish Greenlight stories.</p>
        </div>

        {notice && !error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email</span>
            <span className="relative block">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                autoComplete="username"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                placeholder="you@greenlight.fsia.in"
              />
            </span>
          </label>

          <label className="block">
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</span>
            <span className="relative block">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
              />
            </span>
          </label>

          <button type="submit" disabled={isSubmitting} className={buttonClass('primary', 'md', 'w-full h-11')}>
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
          </button>
        </form>

        <button
          type="button"
          onClick={onCancel}
          className="mt-5 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to reader view</span>
        </button>
        </div>

        {/* Echoes the reader site's dark "Live archive" ticker. */}
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-[11px] font-mono font-bold text-brand-400 border-t border-slate-800">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" aria-hidden="true" />
          SECURE SIGN-IN · ROLE-BASED ACCESS
        </div>
      </div>
    </div>
  );
};
