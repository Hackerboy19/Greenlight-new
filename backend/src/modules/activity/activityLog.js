/**
 * Editorial activity log behind the dashboard's Recent Activity feed.
 *
 * Entries go to the activity_log table (migration 007) when MySQL is
 * reachable. Without MySQL, or before the migration has run, they are kept in
 * memory (the newest MEMORY_LIMIT entries), the same way articles are.
 */

import { pool, databaseReady } from '../../config/database.js';

export const ACTIONS = ['created', 'edited', 'submitted', 'published', 'unpublished', 'deleted'];

const MEMORY_LIMIT = 200;
const memoryLog = [];
let nextMemoryId = 1;
let tableMissingWarned = false;

async function useDatabase() {
  return (await databaseReady) === true;
}

function isMissingTable(err) {
  return err && (err.code === 'ER_NO_SUCH_TABLE' || err.errno === 1146);
}

function warnMissingTable() {
  if (tableMissingWarned) return;
  tableMissingWarned = true;
  console.warn('[Activity] activity_log table not found; keeping activity in memory. Run "npm run db:migrate".');
}

/**
 * Names the change an article update made, from its status before and after.
 */
export function actionForStatusChange(previousStatus, nextStatus) {
  if (previousStatus === nextStatus) return 'edited';
  if (nextStatus === 'published') return 'published';
  if (nextStatus === 'review') return 'submitted';
  if (previousStatus === 'published') return 'unpublished';
  return 'edited';
}

/**
 * Records one change. Never throws: a failed write is logged and the request
 * that made the change still succeeds.
 */
export async function recordActivity(user, action, article) {
  const entry = {
    actor_user_id: /^\d+$/.test(String(user && user.id)) ? Number(user.id) : null,
    actor_name: String((user && (user.name || user.email)) || 'Unknown user').slice(0, 150),
    actor_role: String((user && user.role) || '').slice(0, 32),
    action,
    article_id: article && /^\d+$/.test(String(article.id)) ? Number(article.id) : null,
    article_title: String((article && article.title) || '').slice(0, 255)
  };

  if (await useDatabase()) {
    try {
      await pool.execute(
        `INSERT INTO activity_log (actor_user_id, actor_name, actor_role, action, article_id, article_title)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [entry.actor_user_id, entry.actor_name, entry.actor_role, entry.action, entry.article_id, entry.article_title]
      );
      return;
    } catch (err) {
      if (isMissingTable(err)) warnMissingTable();
      else console.warn(`[Activity] Could not save activity (${err.message}); keeping it in memory.`);
    }
  }

  memoryLog.unshift({ id: nextMemoryId++, ...entry, created_at: new Date().toISOString() });
  if (memoryLog.length > MEMORY_LIMIT) memoryLog.length = MEMORY_LIMIT;
}

/** The newest entries, newest first. */
export async function listActivity(limit = 10) {
  const size = Math.min(Math.max(Number(limit) || 10, 1), 50);

  if (await useDatabase()) {
    try {
      // LIMIT is inlined: prepared statements reject a bound LIMIT on some MySQL versions.
      const [rows] = await pool.query(
        `SELECT id, actor_user_id, actor_name, actor_role, action, article_id, article_title, created_at
           FROM activity_log ORDER BY created_at DESC, id DESC LIMIT ${size}`
      );
      return rows.map((row) => ({
        ...row,
        id: Number(row.id),
        article_id: row.article_id === null ? null : Number(row.article_id),
        actor_user_id: row.actor_user_id === null ? null : Number(row.actor_user_id),
        created_at: new Date(row.created_at).toISOString()
      }));
    } catch (err) {
      if (isMissingTable(err)) warnMissingTable();
      else console.warn(`[Activity] Could not read activity (${err.message}); showing in-memory entries.`);
    }
  }

  return memoryLog.slice(0, size);
}
