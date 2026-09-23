/**
 * Admin API Routes
 * Every endpoint needs a signed-in user; each route then names the permission
 * it needs (see backend/src/modules/auth/permissions.js).
 */

import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../modules/auth/permissions.js';
import { authLimiter } from '../config/security.js';
import * as articleController from '../controllers/admin/articleController.js';
import * as categoryController from '../controllers/admin/categoryController.js';
import * as authorController from '../controllers/admin/authorController.js';
import * as gscController from '../controllers/admin/gscDashboardController.js';

const router = Router();

// Apply auth limiter to admin endpoint group
router.use(authLimiter);

// Protect all admin endpoints with authentication
router.use(authenticateToken);

// Any CMS role: reading articles, categories and authors, and SEO suggestions.
const staff = requirePermission('article.create', 'article.edit.any');

/* ==========================================================================
   Article Management (who may edit or publish what: modules/auth/articlePolicy.js)
   ========================================================================== */
router.get('/articles', staff, articleController.getAllArticles);
router.get('/articles/:id', staff, articleController.getArticleById);
router.post('/articles', requirePermission('article.create'), articleController.createArticle);
router.put('/articles/:id', requirePermission('article.edit.own', 'article.edit.any'), articleController.updateArticle);
router.delete('/articles/:id', requirePermission('article.delete'), articleController.deleteArticle);
router.post('/articles/:id/quick-fix-seo', staff, articleController.quickFixSeo);
router.post('/seo/quick-fix', staff, articleController.quickFixSeo);

/* ==========================================================================
   Category Management & Homepage Reordering (Editor, Admin)
   ========================================================================== */
router.get('/categories', staff, categoryController.getAllCategories);
router.post('/categories', requirePermission('category.manage'), categoryController.createCategory);
router.put('/categories/reorder', requirePermission('category.manage'), categoryController.reorderCategories);
router.put('/categories/:id', requirePermission('category.manage'), categoryController.updateCategory);
router.delete('/categories/:id', requirePermission('category.delete'), categoryController.deleteCategory);

/* ==========================================================================
   Author Management (Admin only)
   ========================================================================== */
router.get('/authors', staff, authorController.getAllAuthors);
router.get('/authors/:id', staff, authorController.getAuthorById);
router.post('/authors', requirePermission('author.manage'), authorController.createAuthor);
router.put('/authors/:id', requirePermission('author.manage'), authorController.updateAuthor);
router.delete('/authors/:id', requirePermission('author.manage'), authorController.deleteAuthor);

/* ==========================================================================
   Google Search Console (GSC) Analytics & Rank Drops (Editor, Admin)
   ========================================================================== */
router.get('/gsc/performance', requirePermission('analytics.view'), gscController.getPerformanceOverview);
router.get('/gsc/rank-drops', requirePermission('analytics.view'), gscController.getRankDrops);
router.get('/gsc/status', requirePermission('settings.manage'), gscController.getSchedulerStatus);
router.post('/gsc/sync', requirePermission('settings.manage'), gscController.triggerSync);
router.post('/gsc/content-audit', requirePermission('analytics.view'), gscController.runContentAudit);

/* ==========================================================================
   Live Greenlight.fsia.in Data Synchronizer
   ========================================================================== */
router.post('/greenlight/sync', requirePermission('settings.manage'), async (req, res) => {
  try {
    const { syncGreenlightLive } = await import('../services/greenlightSyncService.js');
    const result = await syncGreenlightLive();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
