/**
 * Master API Router
 * Dispatches to /api/public, /api/admin, and /api/auth
 */

import { Router } from 'express';
import publicRoutes from './publicRoutes.js';
import adminRoutes from './adminRoutes.js';
import * as articleController from '../controllers/admin/articleController.js';
import * as categoryController from '../controllers/admin/categoryController.js';
import * as authorController from '../controllers/admin/authorController.js';
import * as gscController from '../controllers/admin/gscDashboardController.js';
import authRoutes from './authRoutes.js';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddleware.js';
import { authLimiter } from '../config/security.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Greenlight News Core API',
    version: '1.0.0'
  });
});

// CMS sign-in (POST /api/auth/login) and session check (GET /api/auth/me)
router.use('/auth', authRoutes);

// Direct root resource aliases (supporting both /api/articles and /api/admin/articles).
// They carry the same sign-in and role checks as their /api/admin counterparts.
const signedIn = [authLimiter, authenticateToken];
router.get('/articles', signedIn, authorizeRole('author'), articleController.getAllArticles);
router.post('/articles', signedIn, authorizeRole('author'), articleController.createArticle);
router.get('/articles/:id', signedIn, authorizeRole('author'), articleController.getArticleById);
router.put('/articles/:id', signedIn, authorizeRole('editor'), articleController.updateArticle);
router.delete('/articles/:id', signedIn, authorizeRole('admin'), articleController.deleteArticle);
router.post('/articles/:id/quick-fix-seo', signedIn, authorizeRole('author'), articleController.quickFixSeo);
router.post('/seo/quick-fix', signedIn, authorizeRole('author'), articleController.quickFixSeo);
router.post('/gsc/content-audit', signedIn, authorizeRole('editor'), gscController.runContentAudit);
router.get('/gsc/performance', signedIn, authorizeRole('editor'), gscController.getPerformanceOverview);
router.get('/gsc/rank-drops', signedIn, authorizeRole('editor'), gscController.getRankDrops);

router.get('/categories', signedIn, authorizeRole('author'), categoryController.getAllCategories);
router.get('/authors', signedIn, authorizeRole('author'), authorController.getAllAuthors);

// Route groups
router.use('/public', publicRoutes);
router.use('/admin', adminRoutes);

export default router;
