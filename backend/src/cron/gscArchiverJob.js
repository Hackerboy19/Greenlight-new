/**
 * GSC Cron Archiving Job Scheduler
 * Runs daily at 02:00 UTC (0 2 * * *) to ingest Search Console performance data
 */

import cron from 'node-cron';
import { fetchGscData } from './workers/fetchGscData.js';

let scheduledTask = null;
let lastExecutionStatus = {
  lastRun: null,
  status: 'idle',
  recordsSynced: 0,
  error: null
};

/**
 * Initializes and starts the daily GSC archiving cron job
 */
export function initGscCronJob() {
  if (scheduledTask) {
    console.log('[GSC Cron] Scheduler is already active.');
    return scheduledTask;
  }

  // Schedule pattern: 02:00 UTC every day
  // '0 2 * * *'
  const CRON_EXPRESSION = '0 2 * * *';

  scheduledTask = cron.schedule(
    CRON_EXPRESSION,
    async () => {
      console.log('[GSC Cron] Triggering scheduled daily GSC archival job at 02:00 UTC...');
      lastExecutionStatus.lastRun = new Date().toISOString();
      lastExecutionStatus.status = 'running';

      try {
        const result = await fetchGscData();
        lastExecutionStatus.status = 'success';
        lastExecutionStatus.recordsSynced = result.recordsSynced;
        lastExecutionStatus.error = null;
        console.log(`[GSC Cron] Daily archival complete. ${result.recordsSynced} records written.`);
      } catch (err) {
        lastExecutionStatus.status = 'failed';
        lastExecutionStatus.error = err.message;
        console.error('[GSC Cron] Archival job error:', err.message);
      }
    },
    {
      scheduled: true,
      timezone: 'UTC'
    }
  );

  console.log('[GSC Cron] Initialized daily cron job (02:00 UTC) for Search Console archival.');
  return scheduledTask;
}

/**
 * Manually trigger GSC archive sync
 */
export async function triggerManualSync(targetDate, siteUrl) {
  lastExecutionStatus.lastRun = new Date().toISOString();
  lastExecutionStatus.status = 'running_manual';
  try {
    const result = await fetchGscData(targetDate, siteUrl);
    lastExecutionStatus.status = 'success';
    lastExecutionStatus.recordsSynced = result.recordsSynced;
    lastExecutionStatus.error = null;
    return result;
  } catch (err) {
    lastExecutionStatus.status = 'failed';
    lastExecutionStatus.error = err.message;
    throw err;
  }
}

/**
 * Returns current cron status and telemetry
 */
export function getCronStatus() {
  return {
    isActive: scheduledTask !== null,
    schedule: '0 2 * * * (Daily at 02:00 UTC)',
    timezone: 'UTC',
    ...lastExecutionStatus
  };
}

export default {
  initGscCronJob,
  triggerManualSync,
  getCronStatus
};
