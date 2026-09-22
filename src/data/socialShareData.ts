/**
 * Social Media Share & Click-Through Rate (CTR) Tracking Service
 * Tracks user shares across platforms (WhatsApp, X/Twitter, LinkedIn, Facebook, Telegram, Copy Link)
 * and calculates referral clicks and engagement CTR.
 */

import { Article } from '../types';

export type SocialPlatform = 'whatsapp' | 'twitter' | 'linkedin' | 'facebook' | 'telegram' | 'direct';

export interface PlatformConfig {
  id: SocialPlatform;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  iconName: string;
  shareUrlTemplate: (url: string, title: string) => string;
}

export const SOCIAL_PLATFORMS: Record<SocialPlatform, PlatformConfig> = {
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    color: '#25D366',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    iconName: 'MessageSquare',
    shareUrlTemplate: (url, title) => `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' - ' + url)}`
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    color: '#000000',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-800 dark:text-slate-200',
    iconName: 'Twitter',
    shareUrlTemplate: (url, title) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    textColor: 'text-blue-700 dark:text-blue-400',
    iconName: 'Linkedin',
    shareUrlTemplate: (url, title) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
    textColor: 'text-indigo-700 dark:text-indigo-400',
    iconName: 'Facebook',
    shareUrlTemplate: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    color: '#229ED9',
    bgColor: 'bg-sky-50 dark:bg-sky-950/40',
    textColor: 'text-sky-700 dark:text-sky-400',
    iconName: 'Send',
    shareUrlTemplate: (url, title) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  },
  direct: {
    id: 'direct',
    name: 'Copy Link',
    color: '#64748B',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-700 dark:text-slate-300',
    iconName: 'Link2',
    shareUrlTemplate: (url) => url
  }
};

export interface ArticleSocialMetrics {
  articleId: number;
  articleTitle: string;
  articleSlug: string;
  categoryName: string;
  viewsCount: number;
  shares: Record<SocialPlatform, number>;
  totalShares: number;
  clicks: Record<SocialPlatform, number>;
  totalClicks: number;
  ctr: number; // In percentage (e.g. 18.5)
  viralVelocity: number; // Scale of 1 - 100
  lastSharedAt: string;
}

export interface SocialTimeSeriesPoint {
  date: string;
  totalShares: number;
  totalClicks: number;
  ctr: number;
  whatsappClicks: number;
  linkedinClicks: number;
  twitterClicks: number;
  facebookClicks: number;
  telegramClicks: number;
  directClicks: number;
}

export interface PlatformSummary {
  platform: SocialPlatform;
  name: string;
  shares: number;
  clicks: number;
  ctr: number;
  sharePercentage: number;
  clickPercentage: number;
}

const STORAGE_KEY = 'greenlight_social_metrics_v2';

// Baseline seed data generator based on articles list
export function generateSeedMetrics(articles: Article[]): Record<number, ArticleSocialMetrics> {
  const seed: Record<number, ArticleSocialMetrics> = {};

  const baseMultipliers = [
    { wa: 384, tw: 192, li: 245, fb: 110, tg: 78, dir: 145, clickMult: 1.85 },
    { wa: 512, tw: 280, li: 340, fb: 195, tg: 120, dir: 210, clickMult: 2.15 },
    { wa: 290, tw: 140, li: 185, fb: 92, tg: 65, dir: 115, clickMult: 1.62 },
    { wa: 420, tw: 215, li: 290, fb: 145, tg: 95, dir: 180, clickMult: 1.94 },
    { wa: 180, tw: 85, li: 120, fb: 60, tg: 42, dir: 75, clickMult: 1.48 },
    { wa: 340, tw: 165, li: 210, fb: 125, tg: 80, dir: 130, clickMult: 1.76 },
    { wa: 260, tw: 110, li: 175, fb: 85, tg: 55, dir: 95, clickMult: 1.55 },
    { wa: 310, tw: 150, li: 200, fb: 105, tg: 70, dir: 120, clickMult: 1.71 },
    { wa: 220, tw: 95, li: 145, fb: 75, tg: 50, dir: 85, clickMult: 1.52 },
    { wa: 460, tw: 240, li: 310, fb: 170, tg: 110, dir: 190, clickMult: 2.05 }
  ];

  articles.forEach((art, idx) => {
    const mult = baseMultipliers[idx % baseMultipliers.length];
    const shares: Record<SocialPlatform, number> = {
      whatsapp: mult.wa,
      twitter: mult.tw,
      linkedin: mult.li,
      facebook: mult.fb,
      telegram: mult.tg,
      direct: mult.dir
    };

    const totalShares = Object.values(shares).reduce((a, b) => a + b, 0);

    // Realistic click-throughs driven by platform virality (WhatsApp & LinkedIn tend to have higher CTRs in India)
    const clicks: Record<SocialPlatform, number> = {
      whatsapp: Math.round(shares.whatsapp * (0.28 + (idx * 0.01))),
      linkedin: Math.round(shares.linkedin * (0.22 + (idx * 0.008))),
      twitter: Math.round(shares.twitter * (0.14 + (idx * 0.005))),
      facebook: Math.round(shares.facebook * (0.11 + (idx * 0.004))),
      telegram: Math.round(shares.telegram * (0.19 + (idx * 0.006))),
      direct: Math.round(shares.direct * (0.35 + (idx * 0.01)))
    };

    const totalClicks = Object.values(clicks).reduce((a, b) => a + b, 0);
    const ctr = totalShares > 0 ? Number(((totalClicks / totalShares) * 100).toFixed(1)) : 0;
    const viralVelocity = Math.min(99, Math.round(35 + (totalShares / 30) + (ctr * 1.5)));

    seed[art.id] = {
      articleId: art.id,
      articleTitle: art.title,
      articleSlug: art.slug,
      categoryName: art.category_name,
      viewsCount: art.views_count || 1200,
      shares,
      totalShares,
      clicks,
      totalClicks,
      ctr,
      viralVelocity,
      lastSharedAt: new Date(Date.now() - (idx * 3600000 * 5)).toISOString()
    };
  });

  return seed;
}

// Generate 14-day chronological time series for recharts
export function generateSocialTimeSeries(articles: Article[]): SocialTimeSeriesPoint[] {
  const points: SocialTimeSeriesPoint[] = [];
  const now = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Subtle weekend variance and growth curve
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const factor = isWeekend ? 0.85 : 1.15;
    const growth = 1 + ((14 - i) * 0.02);

    const whatsappClicks = Math.round((140 + (i * 4) + (Math.sin(i) * 15)) * factor * growth);
    const linkedinClicks = Math.round((95 + (i * 3) + (Math.cos(i) * 12)) * factor * growth);
    const twitterClicks = Math.round((65 + (i * 2) + (Math.sin(i * 2) * 8)) * factor * growth);
    const facebookClicks = Math.round((45 + (i * 1.5)) * factor * growth);
    const telegramClicks = Math.round((35 + (i * 1.2)) * factor * growth);
    const directClicks = Math.round((70 + (i * 2.5)) * factor * growth);

    const totalClicks = whatsappClicks + linkedinClicks + twitterClicks + facebookClicks + telegramClicks + directClicks;
    const totalShares = Math.round(totalClicks * (4.2 + (Math.sin(i) * 0.3)));
    const ctr = totalShares > 0 ? Number(((totalClicks / totalShares) * 100).toFixed(1)) : 0;

    points.push({
      date: dateStr,
      totalShares,
      totalClicks,
      ctr,
      whatsappClicks,
      linkedinClicks,
      twitterClicks,
      facebookClicks,
      telegramClicks,
      directClicks
    });
  }

  return points;
}

// Read persisted metrics or initialize
export function loadPersistedSocialMetrics(articles: Article[]): Record<number, ArticleSocialMetrics> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[SocialTracker] Unable to read metrics from localStorage:', e);
  }

  const initial = generateSeedMetrics(articles);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch (e) {
    // Ignore storage quota
  }
  return initial;
}

// Record a new share event from the public reader
export function recordSocialShareEvent(
  articleId: number,
  platform: SocialPlatform,
  articles: Article[]
): ArticleSocialMetrics {
  const allMetrics = loadPersistedSocialMetrics(articles);
  const target = allMetrics[articleId] || {
    articleId,
    articleTitle: articles.find(a => a.id === articleId)?.title || 'Article',
    articleSlug: articles.find(a => a.id === articleId)?.slug || '',
    categoryName: articles.find(a => a.id === articleId)?.category_name || 'News',
    viewsCount: 1,
    shares: { whatsapp: 0, twitter: 0, linkedin: 0, facebook: 0, telegram: 0, direct: 0 },
    totalShares: 0,
    clicks: { whatsapp: 0, twitter: 0, linkedin: 0, facebook: 0, telegram: 0, direct: 0 },
    totalClicks: 0,
    ctr: 0,
    viralVelocity: 40,
    lastSharedAt: new Date().toISOString()
  };

  target.shares[platform] = (target.shares[platform] || 0) + 1;
  target.totalShares = Object.values(target.shares).reduce((a, b) => a + b, 0);
  target.totalClicks = Object.values(target.clicks).reduce((a, b) => a + b, 0);
  target.ctr = target.totalShares > 0 ? Number(((target.totalClicks / target.totalShares) * 100).toFixed(1)) : 0;
  target.lastSharedAt = new Date().toISOString();
  target.viralVelocity = Math.min(99, target.viralVelocity + 1);

  allMetrics[articleId] = target;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allMetrics));
  } catch (e) {
    console.warn('[SocialTracker] Failed to save updated metrics:', e);
  }

  return target;
}

// Record a click-through referral (e.g. from UTM tag)
export function recordSocialClickEvent(
  articleId: number,
  platform: SocialPlatform,
  articles: Article[]
): ArticleSocialMetrics {
  const allMetrics = loadPersistedSocialMetrics(articles);
  const target = allMetrics[articleId] || {
    articleId,
    articleTitle: articles.find(a => a.id === articleId)?.title || 'Article',
    articleSlug: articles.find(a => a.id === articleId)?.slug || '',
    categoryName: articles.find(a => a.id === articleId)?.category_name || 'News',
    viewsCount: 1,
    shares: { whatsapp: 0, twitter: 0, linkedin: 0, facebook: 0, telegram: 0, direct: 0 },
    totalShares: 1,
    clicks: { whatsapp: 0, twitter: 0, linkedin: 0, facebook: 0, telegram: 0, direct: 0 },
    totalClicks: 0,
    ctr: 0,
    viralVelocity: 40,
    lastSharedAt: new Date().toISOString()
  };

  target.clicks[platform] = (target.clicks[platform] || 0) + 1;
  target.totalShares = Object.values(target.shares).reduce((a, b) => a + b, 0);
  target.totalClicks = Object.values(target.clicks).reduce((a, b) => a + b, 0);
  target.ctr = target.totalShares > 0 ? Number(((target.totalClicks / target.totalShares) * 100).toFixed(1)) : 0;

  allMetrics[articleId] = target;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allMetrics));
  } catch (e) {
    console.warn('[SocialTracker] Failed to save updated clicks:', e);
  }

  return target;
}

// Calculate summary per platform
export function calculatePlatformSummaries(metrics: ArticleSocialMetrics[]): PlatformSummary[] {
  const platformTotals: Record<SocialPlatform, { shares: number; clicks: number }> = {
    whatsapp: { shares: 0, clicks: 0 },
    twitter: { shares: 0, clicks: 0 },
    linkedin: { shares: 0, clicks: 0 },
    facebook: { shares: 0, clicks: 0 },
    telegram: { shares: 0, clicks: 0 },
    direct: { shares: 0, clicks: 0 }
  };

  metrics.forEach((m) => {
    (Object.keys(m.shares) as SocialPlatform[]).forEach((p) => {
      platformTotals[p].shares += m.shares[p] || 0;
      platformTotals[p].clicks += m.clicks[p] || 0;
    });
  });

  const totalAllShares = Object.values(platformTotals).reduce((a, b) => a + b.shares, 0) || 1;
  const totalAllClicks = Object.values(platformTotals).reduce((a, b) => a + b.clicks, 0) || 1;

  return (Object.keys(platformTotals) as SocialPlatform[]).map((p) => {
    const data = platformTotals[p];
    return {
      platform: p,
      name: SOCIAL_PLATFORMS[p].name,
      shares: data.shares,
      clicks: data.clicks,
      ctr: data.shares > 0 ? Number(((data.clicks / data.shares) * 100).toFixed(1)) : 0,
      sharePercentage: Number(((data.shares / totalAllShares) * 100).toFixed(1)),
      clickPercentage: Number(((data.clicks / totalAllClicks) * 100).toFixed(1))
    };
  }).sort((a, b) => b.clicks - a.clicks);
}

// Build trackable campaign UTM link
export function buildUtmLink(
  baseUrl: string,
  articleSlug: string,
  platform: SocialPlatform,
  campaignName: string = 'editorial_share'
): string {
  const base = baseUrl.replace(/\/+$/, '');
  const url = `${base}/article/${articleSlug}`;
  const params = new URLSearchParams({
    utm_source: platform,
    utm_medium: 'social',
    utm_campaign: campaignName,
    utm_content: 'article_detail'
  });
  return `${url}?${params.toString()}`;
}
