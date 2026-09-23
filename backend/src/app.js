/**
 * Express Application Setup
 * Integrates Security Headers, Rate Limiting, JSON parsers, Routes, and Error Handling
 */

import express from 'express';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from './modules/media/mediaStore.js';
import { helmetMiddleware, corsMiddleware } from './config/security.js';
import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Security middlewares
app.use(helmetMiddleware);
app.use(corsMiddleware);

// Standard request body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate client IP identification in cloud environments
app.set('trust proxy', 1);

// Media library files. Uploads are checked to be images when saved; nosniff
// stops a browser from treating one as anything else.
app.use(
  UPLOAD_URL_PREFIX,
  express.static(UPLOAD_DIR, {
    index: false,
    dotfiles: 'deny',
    maxAge: '30d',
    immutable: true,
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff')
  })
);
// A missing upload is a 404, not the app's HTML page.
app.use(UPLOAD_URL_PREFIX, (req, res) => res.status(404).end());

// Mount API router
app.use('/api', apiRouter);

// 404 handler for unmatched API routes
app.use('/api/*', notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
