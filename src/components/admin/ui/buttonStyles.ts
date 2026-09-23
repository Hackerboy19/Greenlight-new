/**
 * Button looks shared by the admin screens, taken from the reader site:
 *   primary    the green "Apply" / active-pill button
 *   secondary  the white outlined "My Reading List" button
 *   cta        the amber "Nominate online" call to action
 *   ghost      text-only, for toolbars
 *   danger     destructive actions
 */
export type ButtonVariant = 'primary' | 'secondary' | 'cta' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-card',
  secondary:
    'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-500/60 hover:text-brand-700 dark:hover:text-brand-400 shadow-card',
  cta: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black uppercase tracking-wider shadow-md hover:shadow-amber-500/20',
  ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  danger: 'bg-red-600 hover:bg-red-700 text-white'
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-10 px-4 text-sm'
};

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = '') {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`.trim();
}
