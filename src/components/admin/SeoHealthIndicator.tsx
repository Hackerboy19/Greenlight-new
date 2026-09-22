import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Sparkles, 
  ChevronRight,
  Loader2,
  Check,
  RefreshCw
} from 'lucide-react';
import { Article } from '../../types';
import { calculateSeoHealth, SEO_STATUS_CONFIG, SeoHealthScore } from '../../utils/seoHealth';

interface SeoHealthIndicatorProps {
  article: Partial<Article>;
  variant?: 'table' | 'card' | 'pill' | 'detailed';
  onEditSeo?: (article: Partial<Article>) => void;
  onQuickFix?: (updatedArticle: Partial<Article>) => void | Promise<void>;
  showTooltip?: boolean;
  showInlineQuickFixButton?: boolean;
}

export const SeoHealthIndicator: React.FC<SeoHealthIndicatorProps> = ({
  article,
  variant = 'table',
  onEditSeo,
  onQuickFix,
  showTooltip = true,
  showInlineQuickFixButton = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixSuccess, setFixSuccess] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);
  const [localArticle, setLocalArticle] = useState<Partial<Article>>(article);

  // Sync if prop updates
  React.useEffect(() => {
    setLocalArticle(article);
  }, [article]);

  const activeArticle = localArticle;
  const health: SeoHealthScore = calculateSeoHealth(activeArticle);
  const config = SEO_STATUS_CONFIG[health.status];

  const StatusIcon = 
    health.status === 'green' ? CheckCircle2 :
    health.status === 'yellow' ? AlertTriangle : AlertCircle;

  // Automated Quick Fix with Gemini API
  const handleQuickFix = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (isFixing) return;

    setIsFixing(true);
    setFixError(null);
    setFixSuccess(false);

    try {
      const response = await fetch('/api/seo/quick-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-role': 'admin'
        },
        body: JSON.stringify({
          article: {
            id: activeArticle.id,
            title: activeArticle.title,
            content: activeArticle.content,
            excerpt: activeArticle.excerpt,
            category_name: activeArticle.category_name,
            featured_image: activeArticle.featured_image,
            meta_title: activeArticle.meta_title,
            meta_description: activeArticle.meta_description,
            og_image: activeArticle.og_image
          },
          saveImmediately: Boolean(activeArticle.id)
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to generate SEO metadata with Gemini');
      }

      const resData = await response.json();
      const updated: Partial<Article> = resData.data || {
        ...activeArticle,
        meta_title: resData.generated?.meta_title,
        meta_description: resData.generated?.meta_description,
        og_image: resData.generated?.og_image || activeArticle.og_image
      };

      setLocalArticle(updated);
      setFixSuccess(true);
      setTimeout(() => setFixSuccess(false), 3500);

      if (onQuickFix) {
        await onQuickFix(updated);
      }

      // Notify any listening components
      window.dispatchEvent(new CustomEvent('article-seo-fixed', { detail: updated }));
    } catch (err: any) {
      console.error('[SeoHealthIndicator Quick Fix Error]:', err);
      setFixError(err.message || 'Generation failed');
      setTimeout(() => setFixError(null), 4000);
    } finally {
      setIsFixing(false);
    }
  };

  // Tooltip content component
  const renderTooltip = () => (
    <div 
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-76 p-3.5 bg-slate-900 text-white text-xs rounded-2xl shadow-2xl z-50 pointer-events-auto border border-slate-700 animate-in fade-in zoom-in-95"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-bold">
          <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
          <span className="capitalize">{health.status} SEO Health</span>
          <span className="text-[10px] text-slate-400 font-mono">({health.score}%)</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {health.passedCount}/{health.totalCount} Populated
        </span>
      </div>

      <div className="py-2.5 space-y-1.5">
        {health.checks.map((c) => (
          <div key={c.id} className="flex items-start justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={c.isPopulated ? 'text-emerald-400' : 'text-rose-400'}>
                {c.isPopulated ? '✓' : '✗'}
              </span>
              <span className={`truncate font-medium ${c.isPopulated ? 'text-slate-200' : 'text-slate-400'}`}>
                {c.label}
              </span>
            </div>
            <span className={`text-[10px] font-mono shrink-0 ${c.isPopulated ? 'text-emerald-300' : 'text-rose-300'}`}>
              {c.isPopulated ? 'Populated' : 'Missing'}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Fix Button Section inside Tooltip */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        {health.missingKeys.length > 0 && !fixSuccess && (
          <div className="text-[10px] text-amber-300 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Missing: {health.missingKeys.join(', ')}</span>
          </div>
        )}

        {fixError && (
          <div className="text-[10px] text-rose-300 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{fixError}</span>
          </div>
        )}

        {fixSuccess ? (
          <div className="w-full py-1.5 px-2.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fixed with Gemini! (100% Score)</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleQuickFix}
            disabled={isFixing}
            className="w-full py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            title="Automatically generate missing meta_title and meta_description using Gemini 3.8 Flash based on article content"
          >
            {isFixing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Quick Fix with Gemini AI</span>
              </>
            )}
          </button>
        )}

        {onEditSeo && (
          <button
            type="button"
            onClick={() => onEditSeo(activeArticle)}
            className="w-full py-1 px-2 text-slate-400 hover:text-white rounded-lg font-medium text-[10px] flex items-center justify-center gap-1 transition-colors"
          >
            <span>Open SEO Editor</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* Tooltip caret arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
    </div>
  );

  // Variant 1: Table View
  if (variant === 'table') {
    return (
      <div 
        className="relative inline-flex items-center gap-1.5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          onClick={() => onEditSeo && onEditSeo(activeArticle)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all hover:scale-102 cursor-pointer ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
          title={`${health.statusLabel}: ${health.passedCount}/3 checks passed`}
        >
          <span className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`} />
          <StatusIcon className="w-3 h-3 shrink-0" />
          <span className="font-bold">{health.score}%</span>
          <span className="hidden sm:inline text-[10px] opacity-80">{health.statusLabel}</span>
          <span className="text-[10px] font-mono opacity-70">({health.passedCount}/3)</span>
        </button>

        {/* Inline Quick Fix button for missing metadata */}
        {showInlineQuickFixButton && health.status !== 'green' && (
          <button
            type="button"
            onClick={handleQuickFix}
            disabled={isFixing}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer shadow-2xs ${
              isFixing
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                : fixSuccess
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-95'
            }`}
            title="Quick Fix: Auto-generate missing meta title & description with Gemini AI"
          >
            {isFixing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                <span className="hidden md:inline">Fixing...</span>
              </>
            ) : fixSuccess ? (
              <>
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="hidden md:inline">Fixed!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Quick Fix</span>
              </>
            )}
          </button>
        )}

        {showTooltip && isHovered && renderTooltip()}
      </div>
    );
  }

  // Variant 2: Card View (Badge on Article Cards)
  if (variant === 'card') {
    return (
      <div 
        className="relative inline-flex items-center gap-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onEditSeo) onEditSeo(activeArticle);
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-xs border transition-transform hover:scale-105 cursor-pointer ${
            health.status === 'green'
              ? 'bg-emerald-600/90 text-white border-emerald-400/40'
              : health.status === 'yellow'
              ? 'bg-amber-500/90 text-white border-amber-300/40'
              : 'bg-rose-600/90 text-white border-rose-400/40'
          }`}
          title={`SEO Score: ${health.score}% (${health.statusLabel}) - Click to edit`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>SEO {health.score}%</span>
          <span className="font-mono text-[9px] opacity-90">({health.passedCount}/3)</span>
        </button>

        {/* Quick Fix sparkle button on cards when incomplete */}
        {showInlineQuickFixButton && health.status !== 'green' && (
          <button
            type="button"
            onClick={handleQuickFix}
            disabled={isFixing}
            className={`p-1 rounded-full text-white backdrop-blur-md shadow-xs border transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
              isFixing
                ? 'bg-amber-600/90 border-amber-400/50'
                : fixSuccess
                ? 'bg-emerald-600/90 border-emerald-400/50'
                : 'bg-slate-900/80 hover:bg-emerald-600/90 border-white/20'
            }`}
            title="Quick Fix with Gemini AI"
          >
            {isFixing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : fixSuccess ? (
              <Check className="w-3 h-3 text-emerald-300" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-300" />
            )}
          </button>
        )}

        {showTooltip && isHovered && renderTooltip()}
      </div>
    );
  }

  // Variant 3: Detailed bar (Used in dashboards or modals)
  return (
    <div className={`p-3.5 rounded-2xl border ${config.badgeBg} ${config.badgeBorder}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-4 h-4 ${config.badgeText}`} />
          <span className={`text-xs font-bold ${config.badgeText}`}>
            SEO Health: {health.statusLabel} ({health.score}%)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {health.passedCount} of 3 fields configured
          </span>

          {health.status !== 'green' && (
            <button
              type="button"
              onClick={handleQuickFix}
              disabled={isFixing}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all active:scale-95 disabled:opacity-70 cursor-pointer"
              title="Automatically generate missing meta tags with Gemini AI"
            >
              {isFixing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Fixing...</span>
                </>
              ) : fixSuccess ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Fixed!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Quick Fix</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${config.progressBg} transition-all duration-300`} 
          style={{ width: `${health.score}%` }} 
        />
      </div>

      {fixSuccess && (
        <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
          <Check className="w-3 h-3" />
          <span>Meta title and description updated using Gemini 3.8 Flash!</span>
        </p>
      )}
    </div>
  );
};
