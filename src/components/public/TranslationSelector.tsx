/**
 * TranslationSelector Component
 * Multilingual language switcher for Greenlight Magazine articles and user interface.
 */

import React, { useState } from 'react';
import { Globe, Check, Loader2, Languages, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../utils/translationService';

export interface TranslationSelectorProps {
  currentLanguage: string;
  onLanguageChange: (langCode: string) => void;
  isTranslating?: boolean;
  className?: string;
  variant?: 'compact' | 'full' | 'pills';
}

export const TranslationSelector: React.FC<TranslationSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  isTranslating = false,
  className = '',
  variant = 'compact'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeLang = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  if (variant === 'pills') {
    return (
      <div className={`w-full flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth ${className}`}>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 shrink-0 pr-1">
          <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs">Language:</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLanguage;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => onLanguageChange(lang.code)}
                disabled={isTranslating}
                className={`min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs scale-105 ring-2 ring-emerald-400/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className="text-sm">{lang.flag}</span>
                <span>{lang.nativeName}</span>
                {isSelected && isTranslating && (
                  <Loader2 className="w-3 h-3 animate-spin ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTranslating}
        aria-label="Select language"
        className="min-h-[40px] flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-xs transition-colors active:scale-95"
      >
        {isTranslating ? (
          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
        ) : (
          <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        )}
        <span className="flex items-center gap-1.5">
          <span className="text-sm">{activeLang.flag}</span>
          <span className="font-semibold">{activeLang.nativeName}</span>
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 max-w-[85vw] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 py-2">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Read in Your Language</span>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === currentLanguage;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{lang.flag}</span>
                      <div className="text-left">
                        <div className="font-semibold">{lang.nativeName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{lang.name}</div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
