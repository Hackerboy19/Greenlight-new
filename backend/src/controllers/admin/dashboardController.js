/**
 * Admin Dashboard Controller
 * Headline numbers, the 30-day traffic series and the Recent Activity feed
 * for the CMS home screen.
 */

import { memoryStore } from '../../config/database.js';
import { listActivity } from '../../modules/activity/activityLog.js';

const TRAFFIC_DAYS = 30;

/**
 * Deterministic 0..1 noise for a day, so the mock chart looks the same on
 * every reload instead of jumping around.
 */
function noise(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Mock daily traffic for the last TRAFFIC_DAYS days, ending today (UTC).
 * Weekends dip and the series trends gently upward. Replace with real
 * analytics once a tracking source is connected.
 */
export function mockTraffic(today = new Date()) {
  const series = [];
  for (let i = TRAFFIC_DAYS - 1; i >= 0; i--) {
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const date = day.toISOString().slice(0, 10);
    const weekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;
    const trend = 1 + (TRAFFIC_DAYS - i) * 0.012;
    const views = Math.round((4200 + noise(date) * 1800) * trend * (weekend ? 0.72 : 1));
    const visitors = Math.round(views * (0.58 + noise(`${date}:v`) * 0.08));
    series.push({ date, views, visitors });
  }
  return series;
}

export async function getDashboard(req, res, next) {
  try {
    const articles = memoryStore.articles;
    const countStatus = (status) => articles.filter((a) => a.status === status).length;

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          published: countStatus('published'),
          pendingReview: countStatus('review'),
          drafts: countStatus('draft'),
          scheduled: countStatus('scheduled'),
          totalViews: articles.reduce((sum, a) => sum + (Number(a.views_count) || 0), 0)
        },
        traffic: { source: 'mock', days: mockTraffic() },
        activity: await listActivity(req.query.activity_limit || 8)
      }
    });
  } catch (error) {
    next(error);
  }
}

export default { getDashboard };
