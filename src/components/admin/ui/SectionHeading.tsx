import React from 'react';

export interface SectionHeadingProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right-hand side: a link, a badge or a button. */
  action?: React.ReactNode;
  /** 'h2' on pages, 'h3' inside a card. */
  level?: 'h2' | 'h3';
  className?: string;
}

/**
 * A section title with the reader site's green accent bar, as used above
 * each category row on the homepage.
 */
export const SectionHeading: React.FC<SectionHeadingProps> = ({ title, subtitle, action, level = 'h2', className = '' }) => {
  const Title = level;
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div className="flex items-start gap-3 min-w-0">
        <span className="w-2 h-6 mt-px rounded-full bg-brand-600 dark:bg-brand-500 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <Title className={`${level === 'h2' ? 'text-lg' : 'text-base'} font-bold text-ink dark:text-slate-100 leading-6`}>{title}</Title>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export interface EyebrowProps {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  /** Muted text on the right of the rule, like "Updated daily". */
  aside?: React.ReactNode;
  className?: string;
}

/** Small green capitals over a hairline, like "Flagship lead & top stories" on the homepage. */
export const Eyebrow: React.FC<EyebrowProps> = ({ icon: Icon, children, aside, className = '' }) => (
  <div className={`flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 ${className}`}>
    <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-semibold text-xs tracking-wider uppercase">
      {Icon && <Icon className="w-4 h-4" />}
      <span>{children}</span>
    </div>
    {aside && <div className="text-xs text-slate-500 font-medium">{aside}</div>}
  </div>
);
