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
import { generateToken } from '../middlewares/authMiddleware.js';
import { memoryStore, checkDatabaseConnection } from '../config/database.js';

const router = Router();

// Health Check (liveness): always 200 while the process is up, but reports
// "degraded" with database details when MySQL is unreachable.
router.get('/health', async (req, res) => {
  const database = await checkDatabaseConnection({ timeoutMs: 2000 });
  res.set('Cache-Control', 'no-store');
  res.status(200).json({
    status: database.connected ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Greenlight News Core API',
    version: '1.0.0',
    database
  });
});

// Readiness Check: 503 when MySQL is unreachable, so load balancers and
// uptime monitors can alert on (or route around) a missing database.
router.get('/health/ready', async (req, res) => {
  const database = await checkDatabaseConnection({ timeoutMs: 2000 });
  res.set('Cache-Control', 'no-store');
  if (!database.connected) res.set('Retry-After', '30');
  res.status(database.connected ? 200 : 503).json({
    status: database.connected ? 'ready' : 'unavailable',
    timestamp: new Date().toISOString(),
    database
  });
});

// Demo/Authentication Token Issuer for CMS Users
router.post('/auth/login', (req, res) => {
  const { email, role = 'admin' } = req.body;
  const author = memoryStore.authors.find(a => a.email.toLowerCase() === (email || '').toLowerCase()) || {
    id: 1,
    name: 'Super Admin',
    email: email || 'admin@greenlight.fsia.in',
    role: role || 'admin'
  };

  const token = generateToken({
    id: author.id,
    name: author.name,
    email: author.email,
    role: role || author.role
  });

  return res.status(200).json({
    success: true,
    message: 'Authentication successful',
    token,
    user: {
      id: author.id,
      name: author.name,
      email: author.email,
      role: role || author.role,
      avatar_url: author.avatar_url
    }
  });
});

// Direct root resource aliases (supporting both /api/articles and /api/admin/articles)
router.get('/articles', articleController.getAllArticles);
router.post('/articles', articleController.createArticle);
router.get('/articles/:id', articleController.getArticleById);
router.put('/articles/:id', articleController.updateArticle);
router.delete('/articles/:id', articleController.deleteArticle);
router.post('/articles/:id/quick-fix-seo', articleController.quickFixSeo);
router.post('/seo/quick-fix', articleController.quickFixSeo);
router.post('/gsc/content-audit', gscController.runContentAudit);
router.get('/gsc/performance', gscController.getPerformanceOverview);
router.get('/gsc/rank-drops', gscController.getRankDrops);

router.get('/categories', categoryController.getAllCategories);
router.get('/authors', authorController.getAllAuthors);

// Route groups
router.use('/public', publicRoutes);
router.use('/admin', adminRoutes);

export default router;
