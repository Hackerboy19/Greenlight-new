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
import { generateToken } from '../middlewares/authMiddleware.js';
import { memoryStore } from '../config/database.js';

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

router.get('/categories', categoryController.getAllCategories);
router.get('/authors', authorController.getAllAuthors);

// Route groups
router.use('/public', publicRoutes);
router.use('/admin', adminRoutes);

export default router;
