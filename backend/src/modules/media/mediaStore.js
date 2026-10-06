/**
 * Media library storage.
 *
 * Files are written under UPLOAD_DIR (default ./uploads) as
 * YYYY/MM/<random>-<name>.<ext> and served at /uploads/... by the app.
 * Their details go in the media table (migration 002) when MySQL is
 * reachable, or in memory otherwise, the same way articles are kept.
 *
 * On Vercel the file system is temporary, so uploads there disappear when the
 * function is recycled. Point UPLOAD_DIR at a persistent folder on the real
 * server (Plesk).
 */

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pool, databaseReady } from '../../config/database.js';

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
export const UPLOAD_URL_PREFIX = '/uploads';
export const MAX_UPLOAD_BYTES = Math.max(1, Number(process.env.MEDIA_MAX_MB) || 5) * 1024 * 1024;

const memoryMedia = [];
let nextMemoryId = 1;
let warnedNoTable = false;

async function useDatabase() {
  return (await databaseReady) === true;
}

function isMissingTable(err) {
  return err && (err.code === 'ER_NO_SUCH_TABLE' || err.errno === 1146);
}

function warnOnce(err) {
  if (isMissingTable(err)) {
    if (!warnedNoTable) console.warn('[Media] media table not found; keeping the library in memory. Run "npm run db:migrate".');
    warnedNoTable = true;
  } else {
    console.warn(`[Media] Database error (${err.message}); using the in-memory library.`);
  }
}

/** A safe, readable file name part from what the user uploaded. */
function baseName(original) {
  const stem = path.basename(String(original || 'image')).replace(/\.[^.]+$/, '');
  return (
    stem
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'image'
  );
}

function toItem(row) {
  return {
    id: Number(row.id),
    url: row.file_url,
    file_name: path.basename(row.file_path),
    mime_type: row.mime_type,
    file_size: Number(row.file_size),
    width: row.width === null || row.width === undefined ? null : Number(row.width),
    height: row.height === null || row.height === undefined ? null : Number(row.height),
    alt_text: row.alt_text || '',
    caption: row.caption || '',
    credit: row.credit || '',
    uploaded_by: row.uploaded_by === null || row.uploaded_by === undefined ? null : Number(row.uploaded_by),
    uploader_name: row.uploader_name || null,
    created_at: new Date(row.created_at).toISOString()
  };
}

/**
 * Saves the file and records it.
 * @param {Buffer} buffer  the image bytes
 * @param {{ mime: string, ext: string, width: number|null, height: number|null }} info  from readImageInfo
 */
export async function saveMedia(buffer, info, { originalName, altText, user }) {
  const now = new Date();
  const folder = path.join(String(now.getUTCFullYear()), String(now.getUTCMonth() + 1).padStart(2, '0'));
  const fileName = `${crypto.randomBytes(6).toString('hex')}-${baseName(originalName)}.${info.ext}`;
  const relPath = path.join(folder, fileName);
  const absPath = path.join(UPLOAD_DIR, relPath);
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, buffer, { flag: 'wx' });

  const row = {
    uploaded_by: user && user.source === 'database' && /^\d+$/.test(String(user.id)) ? Number(user.id) : null,
    file_path: relPath.split(path.sep).join('/'),
    file_url: `${UPLOAD_URL_PREFIX}/${relPath.split(path.sep).join('/')}`,
    mime_type: info.mime,
    file_size: buffer.length,
    width: info.width,
    height: info.height,
    alt_text: String(altText || '').slice(0, 300),
    uploader_name: user ? user.name : null
  };

  if (await useDatabase()) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO media (uploaded_by, file_path, file_url, mime_type, file_size, width, height, alt_text)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.uploaded_by, row.file_path, row.file_url, row.mime_type, row.file_size, row.width, row.height, row.alt_text]
      );
      return toItem({ ...row, id: result.insertId, created_at: now });
    } catch (err) {
      warnOnce(err);
    }
  }
  const item = { ...row, id: nextMemoryId++, created_at: now };
  memoryMedia.unshift(item);
  return toItem(item);
}

/** Newest first. Search matches the file name, alt text and caption. */
export async function listMedia({ page = 1, limit = 24, search = '' } = {}) {
  const size = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const q = String(search || '').trim().toLowerCase();

  if (await useDatabase()) {
    try {
      const where = q ? 'WHERE LOWER(m.file_path) LIKE ? OR LOWER(m.alt_text) LIKE ? OR LOWER(m.caption) LIKE ?' : '';
      const like = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
      const params = q ? [like, like, like] : [];
      const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM media m ${where}`, params);
      const totalPages = Math.max(1, Math.ceil(Number(total) / size));
      const current = Math.min(Math.max(Number(page) || 1, 1), totalPages);
      const [rows] = await pool.query(
        `SELECT m.*, u.full_name AS uploader_name FROM media m LEFT JOIN users u ON u.id = m.uploaded_by
         ${where} ORDER BY m.created_at DESC, m.id DESC LIMIT ${size} OFFSET ${(current - 1) * size}`,
        params
      );
      return { items: rows.map(toItem), meta: { page: current, limit: size, total: Number(total), totalPages } };
    } catch (err) {
      warnOnce(err);
    }
  }

  const matches = q
    ? memoryMedia.filter((m) => [m.file_path, m.alt_text, m.caption].join(' ').toLowerCase().includes(q))
    : memoryMedia;
  const totalPages = Math.max(1, Math.ceil(matches.length / size));
  const current = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  return {
    items: matches.slice((current - 1) * size, current * size).map(toItem),
    meta: { page: current, limit: size, total: matches.length, totalPages }
  };
}

async function findMedia(id) {
  if (await useDatabase()) {
    try {
      const [rows] = await pool.query('SELECT * FROM media WHERE id = ?', [id]);
      return rows[0] ? { row: rows[0], db: true } : null;
    } catch (err) {
      warnOnce(err);
    }
  }
  const row = memoryMedia.find((m) => m.id === Number(id));
  return row ? { row, db: false } : null;
}

/** Updates alt text, caption and credit. Returns the item, or null when missing. */
export async function updateMedia(id, fields) {
  const found = await findMedia(id);
  if (!found) return null;
  const next = {
    alt_text: fields.alt_text !== undefined ? String(fields.alt_text).slice(0, 300) : found.row.alt_text,
    caption: fields.caption !== undefined ? String(fields.caption).slice(0, 500) : found.row.caption,
    credit: fields.credit !== undefined ? String(fields.credit).slice(0, 200) : found.row.credit
  };
  if (found.db) {
    await pool.execute('UPDATE media SET alt_text = ?, caption = ?, credit = ? WHERE id = ?', [next.alt_text, next.caption, next.credit, id]);
  } else {
    Object.assign(found.row, next);
  }
  return toItem({ ...found.row, ...next });
}

/** Deletes the record and the file. Returns false when missing. */
export async function deleteMedia(id) {
  const found = await findMedia(id);
  if (!found) return false;
  if (found.db) {
    await pool.execute('DELETE FROM media WHERE id = ?', [id]);
  } else {
    memoryMedia.splice(memoryMedia.indexOf(found.row), 1);
  }
  const absPath = path.resolve(UPLOAD_DIR, found.row.file_path);
  // Never delete outside the upload folder, whatever the row says.
  if (absPath.startsWith(UPLOAD_DIR + path.sep)) {
    await fs.unlink(absPath).catch(() => {});
  }
  return true;
}
