import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Element to render, e.g. 'section' or 'article'. Defaults to div. */
  as?: 'div' | 'section' | 'article' | 'aside';
  /** Lift the card on hover, like the reader site's story cards. */
  interactive?: boolean;
  /** Inner padding. 'none' when the content brings its own. */
  padding?: 'none' | 'sm' | 'md';
}

const PADDING = { none: '', sm: 'p-4', md: 'p-5' };

/** The white panel every admin screen is built from, styled like the reader site's story cards. */
export const Card: React.FC<CardProps> = ({ as: Tag = 'div', interactive, padding = 'md', className = '', children, ...rest }) => (
  <Tag
    {...rest}
    className={`rounded-card bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card ${PADDING[padding]} ${
      interactive ? 'transition-all duration-300 hover:shadow-card-hover hover:border-brand-500/40 hover:-translate-y-0.5' : ''
    } ${className}`}
  >
    {children}
  </Tag>
);
