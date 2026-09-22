import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Tag,
  ImageIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

export interface SeoCheckItem {
  id: string;
  label: string;
  category: 'meta' | 'keyword' | 'image';
  status: 'passed' | 'warning' | 'failed';
  currentValue: string;
  recommended: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface SeoChecklistProps {
  title: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  featuredImage: string;
  ogImage: string;
  contentHtml: string;
  excerpt: string;
  onQuickFix?: () => void;
  onFocusMetaTitle?: () => void;
  onFocusMetaDescription?: () => void;
  onFocusKeywords?: () => void;
  onFocusFeaturedImage?: () => void;
  onFocusOgImage?: () => void;
  isAiGenerating?: boolean;
}

export const SeoChecklist: React.FC<SeoChecklistProps> = ({
  title,
  metaTitle,
  metaDescription,
  metaKeywords,
  featuredImage,
  ogImage,
  contentHtml,
  excerpt,
  onQuickFix,
  onFocusMetaTitle,
  onFocusMetaDescription,
  onFocusKeywords,
  onFocusFeaturedImage,
  onFocusOgImage,
  isAiGenerating = false
}) => {
  // Parse keywords
  const keywordsList = metaKeywords
    ? metaKeywords.split(',').map(k => k.trim()).filter(Boolean)
    : [];

  const plainContent = (contentHtml || '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const titleLower = (title || '').toLowerCase();
  const metaTitleLower = (metaTitle || '').toLowerCase();
  const metaDescLower = (metaDescription || '').toLowerCase();

  // Inspect HTML images and Alt text
  const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
  let totalImagesCount = 0;
  let imagesWithAltCount = 0;
  let missingAltImagesList: string[] = [];

  // Check featured image alt-context (considered having alt text if featured image is present)
  const hasFeaturedImage = Boolean(featuredImage && featuredImage.trim());
  const hasOgImage = Boolean(ogImage && ogImage.trim());

  if (parser && contentHtml) {
    try {
      const doc = parser.parseFromString(contentHtml, 'text/html');
      const imgElements = Array.from(doc.querySelectorAll('img'));
      totalImagesCount = imgElements.length;
      imgElements.forEach((img, idx) => {
        const alt = img.getAttribute('alt');
        if (alt && alt.trim() && alt.trim() !== 'image' && alt.trim() !== 'photo') {
          imagesWithAltCount++;
        } else {
          missingAltImagesList.push(img.getAttribute('src') || `Inline Image #${idx + 1}`);
        }
      });
    } catch {
      // Fallback regex if parser fails
      const imgMatches = contentHtml.match(/<img[^>]+>/gi) || [];
      totalImagesCount = imgMatches.length;
      imgMatches.forEach(tag => {
        const altMatch = tag.match(/alt=["']([^"']+)["']/i);
        if (altMatch && altMatch[1]?.trim() && altMatch[1].trim() !== 'image') {
          imagesWithAltCount++;
        }
      });
    }
  }

  // KEYWORD METRICS
  // Check if primary keyword exists in title, meta description, and article content
  const primaryKeyword = keywordsList[0] || '';
  const primaryKeywordLower = primaryKeyword.toLowerCase();

  const inHeadline = primaryKeywordLower ? titleLower.includes(primaryKeywordLower) : false;
  const inMetaTitle = primaryKeywordLower ? metaTitleLower.includes(primaryKeywordLower) : false;
  const inMetaDesc = primaryKeywordLower ? metaDescLower.includes(primaryKeywordLower) : false;
  const inContent = primaryKeywordLower ? plainContent.includes(primaryKeywordLower) : false;

  // Compute occurrences
  let keywordDensityCount = 0;
  if (primaryKeywordLower && plainContent) {
    const regex = new RegExp(`\\b${primaryKeywordLower.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = plainContent.match(regex);
    keywordDensityCount = matches ? matches.length : 0;
  }

  // BUILD CHECKLIST ITEMS
  const checklist: SeoCheckItem[] = [
    // 1. Meta Title Length
    {
      id: 'meta_title_presence',
      label: 'Meta Title Length & Optimization',
      category: 'meta',
      status: (() => {
        const len = (metaTitle || '').trim().length;
        if (len === 0) return 'failed';
        if (len >= 45 && len <= 65) return 'passed';
        return 'warning';
      })(),
      currentValue: metaTitle.trim() ? `${metaTitle.trim().length} characters` : 'Missing (0 chars)',
      recommended: '50–60 characters (Max 65)',
      message: (() => {
        const len = (metaTitle || '').trim().length;
        if (len === 0) return 'Missing custom meta_title. Search engines will fallback to headline or truncate.';
        if (len < 45) return 'Title is slightly short. Adding relevant context helps improve search CTR.';
        if (len > 65) return 'Title exceeds 65 characters and will likely be truncated on Google desktop SERP.';
        return 'Ideal title length for Google search snippets and browser tab titles.';
      })(),
      actionLabel: !metaTitle.trim() ? 'Add Meta Title' : undefined,
      onAction: onFocusMetaTitle
    },

    // 2. Meta Description Length
    {
      id: 'meta_description_presence',
      label: 'Meta Description Length & CTA',
      category: 'meta',
      status: (() => {
        const len = (metaDescription || '').trim().length;
        if (len === 0) return 'failed';
        if (len >= 120 && len <= 165) return 'passed';
        return 'warning';
      })(),
      currentValue: metaDescription.trim() ? `${metaDescription.trim().length} characters` : 'Missing (0 chars)',
      recommended: '130–160 characters (Max 165)',
      message: (() => {
        const len = (metaDescription || '').trim().length;
        if (len === 0) return 'Missing custom meta_description. Search results may pull arbitrary text snippets.';
        if (len < 120) return 'Description is under 120 chars. Elaborate with a call-to-action to capture clicks.';
        if (len > 165) return 'Description exceeds 165 chars and will be clipped with an ellipsis on search.';
        return 'Perfect summary length tailored for Google and social previews.';
      })(),
      actionLabel: !metaDescription.trim() ? 'Add Meta Description' : undefined,
      onAction: onFocusMetaDescription
    },

    // 3. Keyword Count & Specification
    {
      id: 'keywords_presence',
      label: 'Target Keywords Defined',
      category: 'keyword',
      status: (() => {
        if (keywordsList.length === 0) return 'failed';
        if (keywordsList.length >= 3 && keywordsList.length <= 10) return 'passed';
        return 'warning';
      })(),
      currentValue: keywordsList.length > 0 ? `${keywordsList.length} keywords defined` : 'No keywords entered',
      recommended: '3 to 8 targeted keywords',
      message: (() => {
        if (keywordsList.length === 0) return 'No target keywords specified. Add relevant search phrases for indexing.';
        if (keywordsList.length < 3) return 'Only 1-2 keywords added. Consider adding 3-5 variants for better coverage.';
        if (keywordsList.length > 10) return 'Over 10 keywords entered. Focus on primary search intent to avoid dilution.';
        return 'Comprehensive set of target search terms specified.';
      })(),
      actionLabel: keywordsList.length === 0 ? 'Input Keywords' : undefined,
      onAction: onFocusKeywords
    },

    // 4. Primary Keyword in Meta Title / Headline
    {
      id: 'keyword_in_title',
      label: 'Primary Keyword in Title / Meta Title',
      category: 'keyword',
      status: (() => {
        if (!primaryKeyword) return 'failed';
        if (inMetaTitle || inHeadline) return 'passed';
        return 'warning';
      })(),
      currentValue: primaryKeyword ? `"${primaryKeyword}" (${inMetaTitle ? 'in Meta Title' : inHeadline ? 'in Headline' : 'Not found in Title'})` : 'No keyword set',
      recommended: 'Primary keyword should appear near the start of the title',
      message: (() => {
        if (!primaryKeyword) return 'Add keywords first to track title optimization.';
        if (inMetaTitle || inHeadline) return `Primary target "${primaryKeyword}" is matched in the article title.`;
        return `Consider placing "${primaryKeyword}" directly in the meta title for higher Google ranking relevance.`;
      })(),
      actionLabel: !primaryKeyword ? 'Add Keyword' : (!inMetaTitle && !inHeadline ? 'Edit Title' : undefined),
      onAction: !primaryKeyword ? onFocusKeywords : onFocusMetaTitle
    },

    // 5. Primary Keyword in Meta Description
    {
      id: 'keyword_in_meta_description',
      label: 'Primary Keyword in Meta Description',
      category: 'keyword',
      status: (() => {
        if (!primaryKeyword) return 'failed';
        if (inMetaDesc) return 'passed';
        return 'warning';
      })(),
      currentValue: primaryKeyword ? `"${primaryKeyword}" (${inMetaDesc ? 'Found' : 'Missing in summary'})` : 'No keyword set',
      recommended: 'Include primary keyword naturally within the first 120 characters',
      message: (() => {
        if (!primaryKeyword) return 'Set keywords to evaluate search snippet description relevance.';
        if (inMetaDesc) return `Search query term "${primaryKeyword}" will be bolded by Google in the search snippet.`;
        return `Including "${primaryKeyword}" in the meta description boosts click-through rate when users search for it.`;
      })(),
      actionLabel: !primaryKeyword ? 'Add Keyword' : (!inMetaDesc ? 'Edit Meta Desc' : undefined),
      onAction: !primaryKeyword ? onFocusKeywords : onFocusMetaDescription
    },

    // 6. Featured & Open Graph Images
    {
      id: 'og_image_presence',
      label: 'Social Share Card Image (og:image)',
      category: 'image',
      status: (() => {
        if (!hasOgImage && !hasFeaturedImage) return 'failed';
        if (hasOgImage || hasFeaturedImage) return 'passed';
        return 'warning';
      })(),
      currentValue: hasOgImage ? 'Custom 1200x630 og:image configured' : hasFeaturedImage ? 'Inheriting Featured Image' : 'No image URL set',
      recommended: 'Valid HTTPS image at 1200 × 630 resolution',
      message: (() => {
        if (hasOgImage) return 'Dedicated high-resolution social sharing image is configured.';
        if (hasFeaturedImage) return 'Using cover image for social sharing. Setting a dedicated 1.91:1 og:image is optimal.';
        return 'Missing social sharing image. Articles without og:image receive poor engagement on WhatsApp and LinkedIn.';
      })(),
      actionLabel: !hasOgImage && !hasFeaturedImage ? 'Set Image' : undefined,
      onAction: onFocusOgImage || onFocusFeaturedImage
    },

    // 7. Inline Image Alt Text Optimization
    {
      id: 'image_alt_text',
      label: 'Image Alt Text Accessibility & SEO',
      category: 'image',
      status: (() => {
        if (totalImagesCount === 0) {
          // If no inline images, base on featured image presence
          return hasFeaturedImage ? 'passed' : 'warning';
        }
        if (imagesWithAltCount === totalImagesCount) return 'passed';
        if (imagesWithAltCount > 0) return 'warning';
        return 'failed';
      })(),
      currentValue: totalImagesCount > 0
        ? `${imagesWithAltCount}/${totalImagesCount} inline images have descriptive alt text`
        : hasFeaturedImage
          ? 'Featured cover image tagged'
          : 'No inline images found',
      recommended: '100% of images must have descriptive alt attributes',
      message: (() => {
        if (totalImagesCount === 0) {
          return 'No inline body images found. Descriptive alt text will automatically apply to the cover image on render.';
        }
        if (imagesWithAltCount === totalImagesCount) {
          return `All ${totalImagesCount} inline images have descriptive alt text for Google Image Search and screen readers.`;
        }
        const missingCount = totalImagesCount - imagesWithAltCount;
        return `${missingCount} image${missingCount > 1 ? 's' : ''} in the article body are missing descriptive alt text or captions.`;
      })()
    }
  ];

  // SCORE CALCULATIONS
  const passedCount = checklist.filter(c => c.status === 'passed').length;
  const warningCount = checklist.filter(c => c.status === 'warning').length;
  const failedCount = checklist.filter(c => c.status === 'failed').length;
  const totalCount = checklist.length;
  const progressPercent = Math.round((passedCount / totalCount) * 100);

  // Status config
  const overallTone = progressPercent >= 80 ? 'emerald' : progressPercent >= 50 ? 'amber' : 'rose';

  return (
    <div
      id="seo-checklist-card"
      className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-2xs"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            overallTone === 'emerald'
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              : overallTone === 'amber'
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
          }`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                SEO &amp; Discoverability Readiness Checklist
              </h4>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                overallTone === 'emerald'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : overallTone === 'amber'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}>
                {progressPercent}% Score
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Live automated validation of meta tags, keyword search distribution, and image alt text.
            </p>
          </div>
        </div>

        {/* Action Button: Quick Fix */}
        {onQuickFix && (
          <button
            type="button"
            id="seo-checklist-quickfix-btn"
            onClick={onQuickFix}
            disabled={isAiGenerating}
            className="self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isAiGenerating ? 'Optimizing...' : 'Quick Fix All'}</span>
          </button>
        )}
      </div>

      {/* Progress Bar & Summary Metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {passedCount} of {totalCount} checks passed
            </span>
            {warningCount > 0 && (
              <span className="text-amber-600 dark:text-amber-400 text-[11px] font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {warningCount} recommended {warningCount === 1 ? 'tweak' : 'tweaks'}
              </span>
            )}
            {failedCount > 0 && (
              <span className="text-rose-600 dark:text-rose-400 text-[11px] font-medium flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {failedCount} critical {failedCount === 1 ? 'issue' : 'issues'}
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Target: 100%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
          <div
            className={`h-full transition-all duration-400 ${
              overallTone === 'emerald'
                ? 'bg-emerald-500'
                : overallTone === 'amber'
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Category Filter Pills / Quick Breakdown */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-slate-500 truncate">Meta Tags</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {checklist.filter(c => c.category === 'meta' && c.status === 'passed').length}/2 Passed
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Tag className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-slate-500 truncate">Keywords</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {checklist.filter(c => c.category === 'keyword' && c.status === 'passed').length}/3 Passed
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <ImageIcon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-slate-500 truncate">Images &amp; Alt</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {checklist.filter(c => c.category === 'image' && c.status === 'passed').length}/2 Passed
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Rows */}
      <div className="space-y-2 pt-1">
        {checklist.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
              item.status === 'passed'
                ? 'border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/10'
                : item.status === 'warning'
                ? 'border-amber-200/80 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/10'
                : 'border-rose-200/80 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10'
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="mt-0.5 shrink-0">
                {item.status === 'passed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : item.status === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {item.label}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.2 rounded-md font-semibold ${
                    item.status === 'passed'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : item.status === 'warning'
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                  }`}>
                    {item.currentValue}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.message}
                </p>
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 pt-0.5">
                  <Info className="w-3 h-3 text-slate-400" />
                  <span>Recommendation: {item.recommended}</span>
                </div>
              </div>
            </div>

            {item.actionLabel && item.onAction && item.status !== 'passed' && (
              <button
                type="button"
                onClick={item.onAction}
                className="self-start sm:self-center shrink-0 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700/80 px-2.5 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
