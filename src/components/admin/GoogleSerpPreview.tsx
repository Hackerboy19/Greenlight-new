import React, { useState } from 'react';
import { 
  Globe, 
  Monitor, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink,
  MoreVertical,
  Search,
  Sparkles,
  Info
} from 'lucide-react';

interface GoogleSerpPreviewProps {
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  excerpt?: string;
  slug?: string;
  thumbnailUrl?: string;
  publishDate?: string;
  categoryName?: string;
  className?: string;
  onFocusMetaTitle?: () => void;
  onFocusMetaDescription?: () => void;
}

export const GoogleSerpPreview: React.FC<GoogleSerpPreviewProps> = ({
  title = '',
  metaTitle = '',
  metaDescription = '',
  excerpt = '',
  slug = 'article-headline-slug',
  thumbnailUrl = '',
  publishDate,
  categoryName = 'News',
  className = '',
  onFocusMetaTitle,
  onFocusMetaDescription
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Effective display values with fallbacks
  const displayTitle = (metaTitle.trim() || title.trim() || 'Headline Title | Greenlight FSIA').trim();
  const displaySnippet = (
    metaDescription.trim() || 
    excerpt.trim() || 
    'Read verified in-depth reporting, editorial factsheets, and analysis on Greenlight FSIA.'
  ).trim();

  // Character calculations
  const titleLength = (metaTitle.trim() || title.trim()).length;
  const descLength = (metaDescription.trim() || excerpt.trim()).length;

  // Google typically truncates titles around 60 characters (~580px)
  const isTitleTruncated = titleLength > 60;
  const simulatedTitle = isTitleTruncated 
    ? `${displayTitle.slice(0, 58).trim()}...` 
    : displayTitle;

  // Google typically truncates snippet around 155-160 characters
  const isDescTruncated = descLength > 160;
  const simulatedSnippet = isDescTruncated 
    ? `${displaySnippet.slice(0, 155).trim()}...` 
    : displaySnippet;

  // Formatted date prefix (like Google News / SERP results)
  const formattedDate = publishDate 
    ? new Date(publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Sep 22, 2026';

  const fullUrl = `https://greenlight.fsia.in/article/${slug || 'story'}`;
  const displayBreadcrumb = `https://greenlight.fsia.in › article › ${slug || 'story'}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div 
      id="google-serp-preview-card"
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all ${className}`}
    >
      {/* SERP Card Header */}
      <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            G
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Google SERP Preview</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Live Simulation
              </span>
            </h4>
          </div>
        </div>

        {/* Device Mode Toggle & Copy Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl border border-slate-300/60 dark:border-slate-700 text-xs">
            <button
              type="button"
              id="serp-desktop-view-btn"
              onClick={() => setDeviceMode('desktop')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-[11px] ${
                deviceMode === 'desktop'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Desktop Google SERP Snippet"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              id="serp-mobile-view-btn"
              onClick={() => setDeviceMode('mobile')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-[11px] ${
                deviceMode === 'mobile'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Mobile Google SERP Card"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            title="Copy SERP Destination URL"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main SERP Preview Stage */}
      <div className="p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-950/40">
        {deviceMode === 'desktop' ? (
          /* DESKTOP SERP VIEW */
          <div className="max-w-2xl bg-white dark:bg-[#202124] p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1.5 font-sans">
            {/* Favicon & Breadcrumb Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 flex items-center justify-center text-[8px] font-black text-white">
                    G
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] text-[#202124] dark:text-[#dadce0] font-normal leading-tight">
                    Greenlight FSIA
                  </span>
                  <cite className="text-[12px] text-[#4d5156] dark:text-[#bdc1c6] not-italic truncate max-w-sm sm:max-w-md">
                    {displayBreadcrumb}
                  </cite>
                </div>
              </div>
              <button 
                type="button" 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label="Google result options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Clickable Blue Title */}
            <div className="pt-0.5">
              <h3 
                onClick={onFocusMetaTitle}
                className="text-[19px] sm:text-[20px] font-normal text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-[1.3] tracking-normal break-words"
                title={isTitleTruncated ? `Full Title (${titleLength} chars): "${displayTitle}"` : undefined}
              >
                {simulatedTitle}
              </h3>
            </div>

            {/* Search Snippet with Date prefix */}
            <p className="text-[14px] leading-[1.58] text-[#4d5156] dark:text-[#bdc1c6] break-words pt-0.5">
              <span className="text-[#70757a] dark:text-[#9aa0a6] text-[13px] mr-1.5 font-normal">
                {formattedDate} —
              </span>
              <span 
                onClick={onFocusMetaDescription}
                className="cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
              >
                {simulatedSnippet}
              </span>
            </p>

            {/* Rich Snippet Tags preview */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[12px] text-[#70757a] dark:text-[#9aa0a6]">
              <span className="flex items-center gap-1">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Verified News Story</span>
              </span>
              <span>•</span>
              <span>Category: {categoryName}</span>
              <span>•</span>
              <span>Greenlight Editorial Board</span>
            </div>
          </div>
        ) : (
          /* MOBILE SERP VIEW */
          <div className="max-w-md mx-auto bg-white dark:bg-[#202124] rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2 font-sans">
            {/* Mobile Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  G
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-[#202124] dark:text-[#dadce0] leading-none">
                    greenlight.fsia.in
                  </span>
                  <span className="text-[11px] text-[#70757a] dark:text-[#9aa0a6] truncate max-w-[200px]">
                    {displayBreadcrumb}
                  </span>
                </div>
              </div>
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </div>

            {/* Mobile Body with Optional Thumbnail */}
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-1">
                <h3 
                  onClick={onFocusMetaTitle}
                  className="text-[16px] font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-snug line-clamp-2"
                >
                  {simulatedTitle}
                </h3>
                <p className="text-[12.5px] leading-relaxed text-[#4d5156] dark:text-[#bdc1c6] line-clamp-3">
                  <span className="text-[#70757a] dark:text-[#9aa0a6] text-[11.5px] mr-1">
                    {formattedDate} —
                  </span>
                  {simulatedSnippet}
                </p>
              </div>

              {thumbnailUrl && (
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                  <img
                    src={thumbnailUrl}
                    alt="SERP Mobile Thumbnail"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Real-time Character Length & Truncation Feedback Bar */}
      <div className="p-3.5 sm:px-5 sm:py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Meta Title Health Meter */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5">
            {isTitleTruncated ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            ) : titleLength >= 35 && titleLength <= 60 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Title Cutoff:
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className={isTitleTruncated ? 'text-rose-600 dark:text-rose-400 font-bold' : titleLength >= 35 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600'}>
              {titleLength} / 60 chars
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
              isTitleTruncated 
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' 
                : titleLength >= 35 
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
            }`}>
              {isTitleTruncated ? 'Truncated' : titleLength >= 35 ? 'Optimal' : 'Short'}
            </span>
          </div>
        </div>

        {/* Meta Description Health Meter */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5">
            {isDescTruncated ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            ) : descLength >= 120 && descLength <= 160 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Snippet Cutoff:
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className={isDescTruncated ? 'text-rose-600 dark:text-rose-400 font-bold' : descLength >= 120 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600'}>
              {descLength} / 160 chars
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
              isDescTruncated 
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' 
                : descLength >= 120 
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
            }`}>
              {isDescTruncated ? 'Truncated' : descLength >= 120 ? 'Optimal' : 'Short'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
