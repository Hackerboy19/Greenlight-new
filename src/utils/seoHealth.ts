import { Article } from '../types';

export type SeoHealthStatus = 'green' | 'yellow' | 'red';

export interface SeoHealthCheckItem {
  id: 'meta_title' | 'meta_description' | 'open_graph';
  label: string;
  isPopulated: boolean;
  value: string;
  recommendation: string;
}

export interface SeoHealthScore {
  score: number; // 0, 33, 67, or 100
  passedCount: number;
  totalCount: 3;
  status: SeoHealthStatus;
  statusLabel: string;
  statusDescription: string;
  checks: SeoHealthCheckItem[];
  missingKeys: string[];
}

/**
 * Calculates the SEO Health Score for an article.
 * Checks whether:
 * 1. meta_title is populated
 * 2. meta_description is populated
 * 3. open_graph image (og_image or featured_image) is populated
 */
export function calculateSeoHealth(article: Partial<Article>): SeoHealthScore {
  const metaTitle = (article.meta_title || '').trim();
  const metaDesc = (article.meta_description || '').trim();
  // Check open_graph image: checks article.og_image or article.featured_image
  const ogImage = (article.og_image || article.featured_image || '').trim();

  const isTitlePopulated = metaTitle.length > 0;
  const isDescPopulated = metaDesc.length > 0;
  const isOgPopulated = ogImage.length > 0;

  const checks: SeoHealthCheckItem[] = [
    {
      id: 'meta_title',
      label: 'Meta Title',
      isPopulated: isTitlePopulated,
      value: metaTitle,
      recommendation: isTitlePopulated
        ? `${metaTitle.length} chars (Target: 30-65 chars)`
        : 'Missing meta_title. Search engines will generate fallback titles.'
    },
    {
      id: 'meta_description',
      label: 'Meta Description',
      isPopulated: isDescPopulated,
      value: metaDesc,
      recommendation: isDescPopulated
        ? `${metaDesc.length} chars (Target: 70-160 chars)`
        : 'Missing meta_description. Needed for search snippet click-through.'
    },
    {
      id: 'open_graph',
      label: 'Open Graph Image',
      isPopulated: isOgPopulated,
      value: ogImage,
      recommendation: isOgPopulated
        ? 'Social card image configured (1200×630px recommended).'
        : 'Missing Open Graph image. Social links will lack preview cards.'
    }
  ];

  const passedCount = checks.filter(c => c.isPopulated).length;
  const missingKeys = checks.filter(c => !c.isPopulated).map(c => c.label);

  let status: SeoHealthStatus;
  let statusLabel: string;
  let statusDescription: string;
  let score: number;

  if (passedCount === 3) {
    status = 'green';
    statusLabel = 'Healthy';
    statusDescription = 'All 3 SEO meta fields are fully populated and search-ready.';
    score = 100;
  } else if (passedCount === 2) {
    status = 'yellow';
    statusLabel = 'Needs Review';
    statusDescription = `Missing ${missingKeys.join(', ')}. Complete all fields to achieve full ranking potential.`;
    score = 67;
  } else {
    status = 'red';
    statusLabel = passedCount === 1 ? 'Action Needed' : 'Critical';
    statusDescription = `Missing ${missingKeys.join(' & ')}. Search engines cannot properly index or display social cards.`;
    score = passedCount === 1 ? 33 : 0;
  }

  return {
    score,
    passedCount,
    totalCount: 3,
    status,
    statusLabel,
    statusDescription,
    checks,
    missingKeys
  };
}

export const SEO_STATUS_CONFIG = {
  green: {
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
    glowColor: 'shadow-emerald-500/20',
    progressBg: 'bg-emerald-500',
    label: 'Healthy'
  },
  yellow: {
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    dotColor: 'bg-amber-500',
    glowColor: 'shadow-amber-500/20',
    progressBg: 'bg-amber-500',
    label: 'Needs Review'
  },
  red: {
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-800',
    dotColor: 'bg-rose-500',
    glowColor: 'shadow-rose-500/20',
    progressBg: 'bg-rose-500',
    label: 'Critical'
  }
};
