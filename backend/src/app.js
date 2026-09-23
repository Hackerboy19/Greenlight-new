/**
 * Express Application Setup
 * Integrates Security Headers, Rate Limiting, JSON parsers, Routes, and Error Handling
 */

import express from 'express';
import { helmetMiddleware, corsMiddleware } from './config/security.js';
import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';
import { getDatabaseStatus } from './config/database.js';

const app = express();

// Security middlewares
app.use(helmetMiddleware);
app.use(corsMiddleware);

// Standard request body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate client IP identification in cloud environments
app.set('trust proxy', 1);

// Flag every API response while MySQL is unreachable so the outage is visible
// to clients and in network logs, not only in the server console.
app.use('/api', (req, res, next) => {
  const { status } = getDatabaseStatus();
  if (status === 'unavailable') res.set('X-Database-Status', status);
  next();
});

// Mount API router
app.use('/api', apiRouter);

// 404 handler for unmatched API routes
app.use('/api/*', notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
