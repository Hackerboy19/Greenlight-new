/**
 * Standalone Production Backend Server Entrypoint
 * Listens on PORT 3000 (or custom port) and schedules the GSC daily archiver cron job
 */

import dotenv from 'dotenv';
import app from './app.js';
import { initGscCronJob } from './cron/gscArchiverJob.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`===========================================================`);
  console.log(`  GREENLIGHT NEWS CORE ENGINE (https://greenlight.fsia.in/)`);
  console.log(`  Express Server running on http://${HOST}:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===========================================================`);

  // Initialize Search Console Archiving Cron Engine (02:00 UTC)
  initGscCronJob();
});

// Graceful shutdown handlers
const shutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    console.log('[Server] HTTP server closed gracefully.');
    process.exit(0);
  });

  // Force shutdown if taking too long
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
