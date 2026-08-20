/**
 * Admin API Routes
 * Protected endpoints with authenticateToken and RBAC authorizeRole middlewares
 */

import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddleware.js';
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

/* ==========================================================================
   Article Management (Admin, Editor, Author)
   ========================================================================== */
router.get('/articles', authorizeRole('author'), articleController.getAllArticles);
router.get('/articles/:id', authorizeRole('author'), articleController.getArticleById);
router.post('/articles', authorizeRole('author'), articleController.createArticle);
router.put('/articles/:id', authorizeRole('editor'), articleController.updateArticle);
router.delete('/articles/:id', authorizeRole('admin'), articleController.deleteArticle);

/* ==========================================================================
   Category Management & Homepage Reordering (Editor, Admin)
   ========================================================================== */
router.get('/categories', authorizeRole('author'), categoryController.getAllCategories);
router.post('/categories', authorizeRole('editor'), categoryController.createCategory);
router.put('/categories/reorder', authorizeRole('editor'), categoryController.reorderCategories);
router.put('/categories/:id', authorizeRole('editor'), categoryController.updateCategory);
router.delete('/categories/:id', authorizeRole('admin'), categoryController.deleteCategory);

/* ==========================================================================
   Author Management (Admin only)
   ========================================================================== */
router.get('/authors', authorizeRole('author'), authorController.getAllAuthors);
router.get('/authors/:id', authorizeRole('author'), authorController.getAuthorById);
router.post('/authors', authorizeRole('admin'), authorController.createAuthor);
router.put('/authors/:id', authorizeRole('admin'), authorController.updateAuthor);
router.delete('/authors/:id', authorizeRole('admin'), authorController.deleteAuthor);

/* ==========================================================================
   Google Search Console (GSC) Analytics & Rank Drops (Editor, Admin)
   ========================================================================== */
router.get('/gsc/performance', authorizeRole('editor'), gscController.getPerformanceOverview);
router.get('/gsc/rank-drops', authorizeRole('editor'), gscController.getRankDrops);
router.get('/gsc/status', authorizeRole('admin'), gscController.getSchedulerStatus);
router.post('/gsc/sync', authorizeRole('admin'), gscController.triggerSync);

/* ==========================================================================
   Live Greenlight.fsia.in Data Synchronizer
   ========================================================================== */
router.post('/greenlight/sync', authorizeRole('author'), async (req, res) => {
  try {
    const { syncGreenlightLive } = await import('../services/greenlightSyncService.js');
    const result = await syncGreenlightLive();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
