/**
 * Digital magazine issues (the reader's flipbook at /magazine).
 *
 * Issues and their pages live in magazine_issues and magazine_pages
 * (migration 009) when MySQL is reachable, or in memory otherwise, the same
 * way the media library is kept. Saving an issue replaces all its pages.
 */

import { pool, databaseReady } from '../../config/database.js';

export const MAX_PAGES = 40;
export const STATUSES = ['draft', 'published'];

const memoryIssues = [];
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
    if (!warnedNoTable) console.warn('[Magazine] magazine tables not found; keeping issues in memory. Run "npm run db:migrate".');
    warnedNoTable = true;
  } else {
    console.warn(`[Magazine] Database error (${err.message}); using the in-memory issues.`);
  }
}

/** A problem with what the editor sent. The controller turns it into a 400 or 409. */
export class MagazineInputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const text = (value, max) => String(value ?? '').trim().slice(0, max);

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/** Pages may show images from the media library (/uploads/...) or any https address. */
function safeImageUrl(value) {
  const url = text(value, 700);
  if (/^\/uploads\/[A-Za-z0-9/_.-]+$/.test(url)) return url;
  if (/^https:\/\/[^\s"'<>]+$/i.test(url)) return url;
  return null;
}

/** Checks and tidies the pages sent by the builder. */
export function normalizePages(pages) {
  if (!Array.isArray(pages)) throw new MagazineInputError('Pages must be a list.');
  if (pages.length > MAX_PAGES) throw new MagazineInputError(`An issue can have at most ${MAX_PAGES} pages.`);
  return pages.map((page, index) => {
    const kind = page && page.kind === 'text' ? 'text' : 'image';
    if (kind === 'image') {
      const imageUrl = safeImageUrl(page && page.image_url);
      if (!imageUrl) throw new MagazineInputError(`Page ${index + 1} needs an image from the media library.`);
      return { position: index + 1, kind, image_url: imageUrl, alt_text: text(page.alt_text, 300), heading: '', body: '' };
    }
    const heading = text(page.heading, 200);
    const body = String(page.body ?? '').replace(/\r\n?/g, '\n').trim().slice(0, 6000);
    if (!heading && !body) throw new MagazineInputError(`Page ${index + 1} is an empty text page. Add a heading or some text, or remove it.`);
    return { position: index + 1, kind, image_url: null, alt_text: '', heading, body };
  });
}

function toIssue(row, pages) {
  const cover = pages ? pages.find((p) => p.kind === 'image') : null;
  return {
    id: Number(row.id),
    title: row.title,
    slug: row.slug,
    issue_label: row.issue_label || '',
    description: row.description || '',
    status: row.status,
    published_at: row.published_at ? new Date(row.published_at).toISOString() : null,
    updated_by_name: row.updated_by_name || null,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
    page_count: pages ? pages.length : Number(row.page_count || 0),
    cover_url: cover ? cover.image_url : row.cover_url || null,
    ...(pages ? { pages: pages.map(toPage) } : {})
  };
}

function toPage(p) {
  return {
    position: Number(p.position),
    kind: p.kind,
    image_url: p.image_url || null,
    alt_text: p.alt_text || '',
    heading: p.heading || '',
    body: p.body || ''
  };
}

function memoryView(issue) {
  return toIssue(issue, issue.pages);
}

/* --------------------------------------------------------------------------
   Reads
   -------------------------------------------------------------------------- */

// The cover is the first image page; a subquery keeps the list to one query.
const LIST_SQL = `
  SELECT i.*,
    (SELECT COUNT(*) FROM magazine_pages p WHERE p.issue_id = i.id) AS page_count,
    (SELECT p.image_url FROM magazine_pages p WHERE p.issue_id = i.id AND p.kind = 'image' ORDER BY p.position LIMIT 1) AS cover_url
  FROM magazine_issues i`;

/** All issues for the CMS, or only published ones for readers. Newest first. */
export async function listIssues({ publishedOnly = false } = {}) {
  if (await useDatabase()) {
    try {
      const [rows] = await pool.query(
        `${LIST_SQL} ${publishedOnly ? "WHERE i.status = 'published'" : ''}
         ORDER BY ${publishedOnly ? 'i.published_at DESC,' : ''} i.updated_at DESC, i.id DESC`
      );
      return rows.map((r) => toIssue(r));
    } catch (err) {
      warnOnce(err);
    }
  }
  const items = memoryIssues.filter((i) => !publishedOnly || i.status === 'published');
  const sortKey = (i) => new Date((publishedOnly && i.published_at) || i.updated_at).getTime();
  return items
    .slice()
    .sort((a, b) => sortKey(b) - sortKey(a) || b.id - a.id)
    .map((i) => {
      const { pages, ...rest } = memoryView(i);
      return rest;
    });
}

async function findIssue(where, value) {
  if (await useDatabase()) {
    try {
      const [rows] = await pool.query(`SELECT * FROM magazine_issues WHERE ${where} = ?`, [value]);
      if (!rows[0]) return null;
      const [pages] = await pool.query('SELECT * FROM magazine_pages WHERE issue_id = ? ORDER BY position', [rows[0].id]);
      return toIssue(rows[0], pages);
    } catch (err) {
      warnOnce(err);
    }
  }
  const issue = memoryIssues.find((i) => (where === 'id' ? i.id === Number(value) : i.slug === value));
  return issue ? memoryView(issue) : null;
}

export const getIssue = (id) => findIssue('id', Number(id));

/** A published issue with its pages, for the reader. */
export async function getPublishedIssue(slug) {
  const issue = await findIssue('slug', String(slug));
  return issue && issue.status === 'published' ? issue : null;
}

/* --------------------------------------------------------------------------
   Writes
   -------------------------------------------------------------------------- */

function issueFields(input, existing) {
  const title = text(input.title ?? existing?.title, 200);
  if (!title) throw new MagazineInputError('Give the issue a title.');
  const slug = slugify(input.slug !== undefined && input.slug !== '' ? input.slug : existing?.slug || title);
  if (!slug) throw new MagazineInputError('The web address can only use letters and numbers.');
  return {
    title,
    slug,
    issue_label: text(input.issue_label ?? existing?.issue_label, 80),
    description: text(input.description ?? existing?.description, 600)
  };
}

async function slugTaken(slug, exceptId) {
  const list = await listIssues();
  return list.some((i) => i.slug === slug && i.id !== Number(exceptId));
}

async function writePages(cx, issueId, pages) {
  await cx.execute('DELETE FROM magazine_pages WHERE issue_id = ?', [issueId]);
  for (const p of pages) {
    await cx.execute(
      `INSERT INTO magazine_pages (issue_id, position, kind, image_url, alt_text, heading, body)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [issueId, p.position, p.kind, p.image_url, p.alt_text || null, p.heading || null, p.body || null]
    );
  }
}

/** Creates a draft issue. */
export async function createIssue(input, user) {
  const fields = issueFields(input || {});
  const pages = normalizePages(input?.pages || []);
  if (await slugTaken(fields.slug)) throw new MagazineInputError('Another issue already uses this web address.', 409);
  const userId = user && user.source === 'database' && /^\d+$/.test(String(user.id)) ? Number(user.id) : null;
  const userName = user ? String(user.name || user.email || '').slice(0, 150) : null;

  if (await useDatabase()) {
    let cx;
    try {
      cx = await pool.getConnection();
      await cx.beginTransaction();
      const [result] = await cx.execute(
        `INSERT INTO magazine_issues (title, slug, issue_label, description, status, created_by, updated_by_name)
         VALUES (?, ?, ?, ?, 'draft', ?, ?)`,
        [fields.title, fields.slug, fields.issue_label || null, fields.description || null, userId, userName]
      );
      await writePages(cx, result.insertId, pages);
      await cx.commit();
      return getIssue(result.insertId);
    } catch (err) {
      if (cx) await cx.rollback().catch(() => {});
      if (!isMissingTable(err)) throw err;
      warnOnce(err);
    } finally {
      if (cx) cx.release();
    }
  }

  const now = new Date().toISOString();
  const issue = { id: nextMemoryId++, ...fields, status: 'draft', published_at: null, updated_by_name: userName, created_at: now, updated_at: now, pages };
  memoryIssues.push(issue);
  return memoryView(issue);
}

/**
 * Saves the title, details and pages. A published issue must keep at least
 * two pages. Returns null when the issue does not exist.
 */
export async function updateIssue(id, input, user) {
  const existing = await getIssue(id);
  if (!existing) return null;
  const fields = issueFields(input || {}, existing);
  const pages = input && input.pages !== undefined ? normalizePages(input.pages) : null;
  if (existing.status === 'published' && pages && pages.length < 2) {
    throw new MagazineInputError('A published issue needs at least 2 pages. Unpublish it first to empty it.');
  }
  if (await slugTaken(fields.slug, id)) throw new MagazineInputError('Another issue already uses this web address.', 409);
  const userName = user ? String(user.name || user.email || '').slice(0, 150) : null;

  if (await useDatabase()) {
    let cx;
    try {
      cx = await pool.getConnection();
      await cx.beginTransaction();
      await cx.execute(
        'UPDATE magazine_issues SET title = ?, slug = ?, issue_label = ?, description = ?, updated_by_name = ? WHERE id = ?',
        [fields.title, fields.slug, fields.issue_label || null, fields.description || null, userName, id]
      );
      if (pages) await writePages(cx, id, pages);
      await cx.commit();
      return getIssue(id);
    } catch (err) {
      if (cx) await cx.rollback().catch(() => {});
      if (!isMissingTable(err)) throw err;
      warnOnce(err);
    } finally {
      if (cx) cx.release();
    }
  }

  const issue = memoryIssues.find((i) => i.id === Number(id));
  if (!issue) return null;
  Object.assign(issue, fields, { updated_by_name: userName, updated_at: new Date().toISOString() });
  if (pages) issue.pages = pages;
  return memoryView(issue);
}

/** Publishes or unpublishes. Publishing needs at least two pages. */
export async function setIssueStatus(id, status, user) {
  if (!STATUSES.includes(status)) throw new MagazineInputError('Status must be draft or published.');
  const existing = await getIssue(id);
  if (!existing) return null;
  if (status === 'published' && existing.page_count < 2) {
    throw new MagazineInputError('Add at least 2 pages before publishing the issue.');
  }
  const publishedAt = status === 'published' ? existing.published_at || new Date().toISOString() : existing.published_at;
  const userName = user ? String(user.name || user.email || '').slice(0, 150) : null;

  if (await useDatabase()) {
    try {
      await pool.execute('UPDATE magazine_issues SET status = ?, published_at = ?, updated_by_name = ? WHERE id = ?', [
        status,
        publishedAt ? publishedAt.slice(0, 19).replace('T', ' ') : null,
        userName,
        id
      ]);
      return getIssue(id);
    } catch (err) {
      if (!isMissingTable(err)) throw err;
      warnOnce(err);
    }
  }
  const issue = memoryIssues.find((i) => i.id === Number(id));
  if (!issue) return null;
  Object.assign(issue, { status, published_at: publishedAt, updated_by_name: userName, updated_at: new Date().toISOString() });
  return memoryView(issue);
}

/** Deletes the issue and its pages (the images stay in the media library). */
export async function deleteIssue(id) {
  if (await useDatabase()) {
    try {
      const [result] = await pool.execute('DELETE FROM magazine_issues WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (err) {
      if (!isMissingTable(err)) throw err;
      warnOnce(err);
    }
  }
  const index = memoryIssues.findIndex((i) => i.id === Number(id));
  if (index === -1) return false;
  memoryIssues.splice(index, 1);
  return true;
}
