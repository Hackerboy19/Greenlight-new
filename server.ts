/**
 * Full-Stack Application Server (Express + Vite Middleware)
 * Production-ready server binding on port 3000
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import app from './backend/src/app.js';
import { initGscCronJob } from './backend/src/cron/gscArchiverJob.js';
import { syncGreenlightLive } from './backend/src/services/greenlightSyncService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = 3000;

  // Initialize Search Console Archiving Cron (02:00 UTC)
  initGscCronJob();

  // Run live sync from https://greenlight.fsia.in/ in the background on boot
  syncGreenlightLive().then((res) => {
    console.log(`[Greenlight Boot] Initial sync completed: ${res.articlesCount || 0} articles loaded.`);
  }).catch((err) => {
    console.warn('[Greenlight Boot] Initial live sync fallback to default dataset:', err.message);
  });

  // In development, hook up Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static assets from dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===========================================================`);
    console.log(`  GREENLIGHT NEWS PLATFORM (https://greenlight.fsia.in/)`);
    console.log(`  Server running at http://localhost:${PORT}`);
    console.log(`===========================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Server Start Error]:', err);
});
