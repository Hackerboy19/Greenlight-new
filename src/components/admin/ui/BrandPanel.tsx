import React from 'react';

export interface BrandPanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * The dark slate-to-emerald panel the reader site uses for its FSIA sponsor
 * banner. Used sparingly in the admin for the one thing on a screen that
 * should stand out.
 */
export const BrandPanel: React.FC<BrandPanelProps> = ({ children, className = '' }) => (
  <div
    className={`relative overflow-hidden rounded-card bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 border border-brand-500/30 text-white shadow-lg ${className}`}
  >
    <div className="absolute top-0 right-1/4 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
    <div className="relative">{children}</div>
  </div>
);
