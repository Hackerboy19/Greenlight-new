/**
 * Full-Stack Application Server (Express + Vite Middleware)
 * Production-ready server binding on port 3000
 */

// Must stay first: other modules need these globals while they load.
import './backend/src/config/nodeCompat.js';
import express from 'express';
import fs from 'fs';
import path from 'path';
import app from './backend/src/app.js';
import { initGscCronJob } from './backend/src/cron/gscArchiverJob.js';
import { syncGreenlightLive } from './backend/src/services/greenlightSyncService.js';
import { initContentStore, saveAll } from './backend/src/modules/content/contentStore.js';
import { mountReaderPages } from './backend/src/seo/pages.js';

async function startServer() {
  // Plesk (Phusion Passenger) and most hosts pass the port in PORT.
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize Search Console Archiving Cron (02:00 UTC)
  initGscCronJob();

  // Articles, categories and authors come from MySQL when it is set up. Only
  // without saved content does the app import from https://greenlight.fsia.in/.
  const contentMode = await initContentStore().catch((err) => {
    console.error('[Greenlight Boot] Could not load saved content from MySQL:', err.message);
    throw err;
  });
  if (contentMode !== 'loaded') {
    (async () => {
      // An empty database is first filled with the built-in articles, so the
      // sync below has categories and authors to attach new articles to.
      if (contentMode === 'empty') await saveAll();
      const res = await syncGreenlightLive();
      console.log(`[Greenlight Boot] Initial sync completed: ${res.articlesCount || 0} articles loaded.`);
    })().catch((err) => {
      console.warn('[Greenlight Boot] Initial live sync fallback to default dataset:', err.message);
    });
  }

  // In development, hook up Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    // Loaded only here: production installs (e.g. Plesk) do not include Vite.
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static assets from dist. The bundle lives in
    // server-build/, so dist is its sibling whatever folder the host starts in.
    const bundledDist = typeof __dirname !== 'undefined' ? path.join(__dirname, '..', 'dist') : '';
    const distPath = bundledDist && fs.existsSync(path.join(bundledDist, 'index.html'))
      ? bundledDist
      : path.join(process.cwd(), 'dist');
    // index.html is sent by mountReaderPages with each page's own meta tags.
    app.use(express.static(distPath, { index: false }));
    mountReaderPages(app, distPath);
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
  // Exit so the host (e.g. Plesk) reports the failure instead of waiting on a
  // process that never listens.
  process.exit(1);
});
