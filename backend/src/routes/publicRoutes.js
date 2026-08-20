/**
 * Public API Routes
 * Endpoints for reader experience, search, homepage Google News feeds, and articles
 */

import { Router } from 'express';
import { apiLimiter } from '../config/security.js';
import * as articleController from '../controllers/public/articleController.js';
import * as searchController from '../controllers/public/searchController.js';
import { memoryStore } from '../config/database.js';

const router = Router();

// Apply public rate limiting
router.use(apiLimiter);

/* Homepage Aggregation (Featured, Trending, Category-mapped rows) */
router.get('/homepage', articleController.getHomepageData);

/* Single Article by slug with Infobox */
router.get('/articles/:slug', articleController.getArticleBySlug);

/* Category Archive Feed */
router.get('/categories/:categorySlug', articleController.getArticlesByCategory);

/* All Public Categories */
router.get('/categories', (req, res) => {
  const active = memoryStore.categories
    .filter(c => c.is_active === 1)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  return res.status(200).json({ success: true, data: active });
});

/* Full-text & Voice Search Endpoint */
router.get('/search', searchController.searchArticles);

/* Live Crawler on-demand sync from greenlight.fsia.in */
router.post('/sync-live', async (req, res) => {
  try {
    const { syncGreenlightLive } = await import('../services/greenlightSyncService.js');
    const result = await syncGreenlightLive();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* Live articles direct fetch */
router.get('/greenlight/status', (req, res) => {
  return res.status(200).json({
    status: 'connected',
    target: 'https://greenlight.fsia.in/',
    articles_count: memoryStore.articles.length,
    categories_count: memoryStore.categories.length,
    timestamp: new Date().toISOString()
  });
});

export default router;
