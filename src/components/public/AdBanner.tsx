/**
 * AdBanner Component
 * Renders authentic Greenlight & FSIA advertisement banners (Leaderboard, Mid-Article, Sidebar, and Native Sponsored Cards)
 */

import React, { useState } from 'react';
import { ExternalLink, Sparkles, X, Award, ShieldCheck, Star } from 'lucide-react';
import { GreenLightLogo } from '../GreenLightLogo';

export type AdVariant = 'leaderboard' | 'mid-article' | 'sidebar' | 'bottom-sticky' | 'in-feed';

export interface AdBannerProps {
  variant?: AdVariant;
  customTitle?: string;
  customSubtitle?: string;
  customCta?: string;
  targetUrl?: string;
  imageUrl?: string;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  variant = 'leaderboard',
  customTitle,
  customSubtitle,
  customCta,
  targetUrl = 'https://greenlight.fsia.in/',
  imageUrl,
  className = ''
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  // 1. TOP / FOOTER LEADERBOARD BANNER
  if (variant === 'leaderboard') {
    return (
      <div className={`w-full max-w-7xl mx-auto px-3 sm:px-6 my-3 sm:my-4 ${className}`}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 p-3.5 sm:p-5 text-white shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          {/* Decorative background glow */}
          <div className="absolute top-0 right-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left Brand Badge */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/70 border border-emerald-500/30 shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 mb-0.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">FSIA</span>
            </div>

            <div className="text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  Official Sponsor
                </span>
                <span className="text-[10px] text-slate-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Verified Conclave</span>
                </span>
              </div>
              <h3 className="text-xs sm:text-base md:text-lg font-bold tracking-tight text-white line-clamp-2">
                {customTitle || 'Forever Star India Awards Season 6 — Grand Conclave Jaipur'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 max-w-2xl mt-0.5 line-clamp-2 sm:line-clamp-none">
                {customSubtitle || 'National nominations now open for Entrepreneurs, Healthcare Pioneers, Innovators & Super Women. Claim your recognition.'}
              </p>
            </div>
          </div>

          {/* Right CTA Button */}
          <div className="flex items-center justify-end shrink-0 pt-1 md:pt-0">
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group active:scale-95"
            >
              <span>{customCta || 'Nominate Online'}</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. MID-ARTICLE HIGH-IMPACT SPONSORED BANNER
  if (variant === 'mid-article') {
    return (
      <div className={`my-6 sm:my-8 p-4 sm:p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl overflow-hidden relative ${className}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="w-full sm:w-44 aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
            <img
              src={imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80'}
              alt="FSIA Advertisement"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 text-left space-y-2 w-full">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Sponsored Feature
              </span>
              <span className="text-[11px] text-slate-400">FSIA Awards</span>
            </div>

            <h4 className="text-sm sm:text-lg font-bold text-white leading-snug">
              {customTitle || 'The Real Super Woman Awards 2026: Honoring Women Leaders'}
            </h4>

            <p className="text-xs text-slate-300 line-clamp-2">
              {customSubtitle || 'Recognizing female trailblazers in medicine, business, philanthropy, and artistic excellence across 28 Indian states.'}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2.5">
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
              >
                <span>{customCta || 'Register Free'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-[11px] text-slate-400 text-center sm:text-left">Limited entries for Season 6</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. SIDEBAR BANNER (300x250 or Vertical Sticky Card)
  if (variant === 'sidebar') {
    return (
      <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white border border-slate-800 shadow-md ${className}`}>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-3 border-b border-slate-800 pb-2">
          <span className="uppercase tracking-widest font-mono">Advertisement</span>
          <span className="text-emerald-400 font-bold">FSIA Hub</span>
        </div>

        <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-800 mb-3.5 relative">
          <img
            src={imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80'}
            alt="Sidebar Ad"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2 text-white">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950">
              Grand Conclave
            </span>
          </div>
        </div>

        <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">
          {customTitle || 'Forever Miss & Mrs India 2026'}
        </h4>

        <p className="text-xs text-slate-400 mb-4 line-clamp-2">
          {customSubtitle || 'National talent auditions open for models and professionals. Win crowns and international opportunities.'}
        </p>

        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[44px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors active:scale-95"
        >
          <span>{customCta || 'Apply for Auditions'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // 4. BOTTOM FLOATING STICKY BANNER
  if (variant === 'bottom-sticky') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-2.5 sm:p-3 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 text-white shadow-2xl animate-slideUp">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                <span className="truncate">{customTitle || 'FSIA Season 6 Conclave Jaipur — Nominations Open'}</span>
                <span className="hidden md:inline px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 font-mono shrink-0">
                  FSIA Official
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block truncate">
                Nominate your brand, enterprise, or creative talent for India's verified excellence awards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95"
            >
              <span>Apply</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg transition-colors active:scale-95"
              title="Close advertisement"
              aria-label="Close sponsor ticker"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
