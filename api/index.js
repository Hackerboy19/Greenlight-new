/**
 * Vercel Serverless Function API Entry Point
 * Routes all /api/* serverless calls directly into the Express backend
 */

import app from '../backend/src/app.js';

export default app;
