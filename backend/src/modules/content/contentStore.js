/**
 * Keeps the CMS content (articles, categories, authors) in MySQL.
 *
 * The controllers read and change memoryStore as before; it now acts as a
 * cache in front of MySQL. Every change is written to MySQL first, so a failed
 * write rejects the request and leaves the cache as it was, and at startup the
 * cache is filled from MySQL. Without MySQL (or before migration 008 has run)
 * nothing is persisted and the app behaves as it always did.
 */

import { pool, databaseReady, memoryStore } from '../../config/database.js';

let persistent = false;

/** Whether content is being saved to MySQL. */
export function isPersistent() {
  return persistent;
}

// Fields that have their own column. Anything else on an article is kept in
// extra_json, including category_name and author_name, which are rebuilt from
// the category and author rows on load but serve as a fallback if those are gone.
const ARTICLE_COLUMNS = new Set([
  'id', 'title', 'slug', 'excerpt', 'content', 'featured_image', 'og_image', 'meta_title',
  'meta_description', 'meta_keywords', 'status', 'is_featured', 'category_id', 'author_id',
  'views_count', 'reading_time', 'published_at', 'created_at', 'updated_at', 'infobox'
]);
const STATUSES = new Set(['draft', 'review', 'scheduled', 'published', 'archived']);

const cut = (value, max) => (value == null ? null : String(value).slice(0, max));

/** ISO string or Date -> 'YYYY-MM-DD HH:MM:SS' in UTC (the pool uses timezone +00:00). */
function toSqlDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 19).replace('T', ' ');
}

const toIso = (value) => (value ? new Date(value).toISOString() : null);

function parseJson(text) {
  if (!text) return {};
  if (typeof text === 'object') return text;
  try {
    const value = JSON.parse(text);
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function slugify(text, fallback) {
  const slug = String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 110);
  return slug || fallback;
}

/* --------------------------------------------------------------------------
   Rows <-> cache objects
   -------------------------------------------------------------------------- */

function categoryParams(c) {
  const { id, name, slug, description, display_order, is_active, ...extra } = c;
  return [
    id,
    cut(slug || slugify(name, `category-${id}`), 120),
    cut(name || 'Untitled', 120),
    cut(description || null, 500),
    Number.isFinite(Number(display_order)) ? Number(display_order) : 0,
    is_active === undefined ? 1 : is_active ? 1 : 0,
    Object.keys(extra).length ? JSON.stringify(extra) : null
  ];
}

function rowToCategory(r) {
  return {
    ...parseJson(r.extra_json),
    id: Number(r.id),
    name: r.name,
    slug: r.slug,
    description: r.description || '',
    display_order: r.sort_order,
    is_active: r.is_active ? 1 : 0
  };
}

function authorParams(a) {
  const { id, name, email, bio, avatar_url, ...extra } = a;
  return [
    id,
    // Author slugs must be unique, so the id is part of them.
    cut(`${slugify(name, 'author')}-${id}`, 120),
    cut(name || 'Unnamed author', 150),
    bio || null,
    cut(avatar_url || null, 500),
    cut(email || null, 191),
    Object.keys(extra).length ? JSON.stringify(extra) : null
  ];
}

function rowToAuthor(r) {
  return {
    ...parseJson(r.extra_json),
    id: Number(r.id),
    name: r.display_name,
    email: r.email_public || '',
    bio: r.bio || '',
    avatar_url: r.avatar_url || ''
  };
}

function articleParams(a) {
  const extra = {};
  for (const [key, value] of Object.entries(a)) {
    if (!ARTICLE_COLUMNS.has(key)) extra[key] = value;
  }
  const categoryId = memoryStore.categories.some((c) => c.id === a.category_id) ? a.category_id : null;
  const authorId = memoryStore.authors.some((au) => au.id === a.author_id) ? a.author_id : null;
  // Keep the ids the article pointed at, even if that category or author row is missing.
  extra.category_id_ref = a.category_id ?? null;
  extra.author_id_ref = a.author_id ?? null;
  return [
    a.id,
    cut(a.slug, 200),
    cut(a.title || 'Untitled', 255),
    a.excerpt || null,
    a.content || null,
    authorId,
    categoryId,
    cut(a.featured_image || null, 700),
    STATUSES.has(a.status) ? a.status : 'draft',
    a.is_featured ? 1 : 0,
    cut(a.meta_title || null, 255),
    cut(a.meta_description || null, 500),
    cut(a.meta_keywords || null, 500),
    cut(a.og_image || null, 700),
    Math.max(1, Math.min(65535, parseInt(a.reading_time, 10) || 1)),
    Math.max(0, parseInt(a.views_count, 10) || 0),
    toSqlDate(a.published_at),
    toSqlDate(a.created_at) || toSqlDate(new Date()),
    JSON.stringify(extra)
  ];
}

function rowToArticle(r, infoboxByArticle, categories, authors) {
  const extra = parseJson(r.extra_json);
  const { category_id_ref, author_id_ref, ...rest } = extra;
  const categoryId = r.category_id != null ? Number(r.category_id) : category_id_ref ?? null;
  const authorId = r.author_id != null ? Number(r.author_id) : author_id_ref ?? null;
  const category = categories.get(categoryId);
  const author = authors.get(authorId);
  return {
    ...rest,
    id: Number(r.id),
    title: r.title,
    slug: r.slug,
    excerpt: r.summary || '',
    content: r.body_html || '',
    featured_image: r.cover_image_url || '',
    meta_title: r.meta_title || '',
    meta_description: r.meta_description || '',
    meta_keywords: r.meta_keywords || '',
    og_image: r.og_image_url || '',
    status: r.status,
    is_featured: r.is_featured ? 1 : 0,
    category_id: categoryId,
    category_name: category ? category.name : rest.category_name,
    category_slug: category ? category.slug : rest.category_slug,
    author_id: authorId,
    author_name: author ? author.name : rest.author_name,
    author_avatar: author ? author.avatar_url : rest.author_avatar,
    views_count: Number(r.view_count) || 0,
    reading_time: r.reading_minutes,
    published_at: toIso(r.published_at),
    created_at: toIso(r.created_at),
    updated_at: toIso(r.updated_at),
    infobox: infoboxByArticle.get(Number(r.id)) || []
  };
}

/* --------------------------------------------------------------------------
   Writes
   -------------------------------------------------------------------------- */

const CATEGORY_UPSERT = `
  INSERT INTO categories (id, slug, name, description, sort_order, is_active, extra_json)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE slug = VALUES(slug), name = VALUES(name), description = VALUES(description),
    sort_order = VALUES(sort_order), is_active = VALUES(is_active), extra_json = VALUES(extra_json)`;

const AUTHOR_UPSERT = `
  INSERT INTO authors (id, slug, display_name, bio, avatar_url, email_public, extra_json)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE slug = VALUES(slug), display_name = VALUES(display_name), bio = VALUES(bio),
    avatar_url = VALUES(avatar_url), email_public = VALUES(email_public), extra_json = VALUES(extra_json)`;

const ARTICLE_UPSERT = `
  INSERT INTO articles (id, slug, title, summary, body_html, author_id, category_id, cover_image_url,
    status, is_featured, meta_title, meta_description, meta_keywords, og_image_url,
    reading_minutes, view_count, published_at, created_at, extra_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE slug = VALUES(slug), title = VALUES(title), summary = VALUES(summary),
    body_html = VALUES(body_html), author_id = VALUES(author_id), category_id = VALUES(category_id),
    cover_image_url = VALUES(cover_image_url), status = VALUES(status), is_featured = VALUES(is_featured),
    meta_title = VALUES(meta_title), meta_description = VALUES(meta_description),
    meta_keywords = VALUES(meta_keywords), og_image_url = VALUES(og_image_url),
    reading_minutes = VALUES(reading_minutes), view_count = VALUES(view_count),
    published_at = VALUES(published_at), extra_json = VALUES(extra_json), deleted_at = NULL`;

// Adds a row only when it is missing, e.g. a byline created on an author's first article.
const AUTHOR_INSERT_MISSING = `${AUTHOR_UPSERT.split('ON DUPLICATE')[0]} ON DUPLICATE KEY UPDATE id = id`;
const CATEGORY_INSERT_MISSING = `${CATEGORY_UPSERT.split('ON DUPLICATE')[0]} ON DUPLICATE KEY UPDATE id = id`;

async function writeArticle(conn, article) {
  // The article's category and byline must exist before the article can point at them.
  const category = memoryStore.categories.find((c) => c.id === article.category_id);
  if (category) await conn.execute(CATEGORY_INSERT_MISSING, categoryParams(category));
  const author = memoryStore.authors.find((a) => a.id === article.author_id);
  if (author) await conn.execute(AUTHOR_INSERT_MISSING, authorParams(author));
  await conn.execute(ARTICLE_UPSERT, articleParams(article));
  await conn.execute('DELETE FROM article_infobox WHERE article_id = ?', [article.id]);
  const rows = Array.isArray(article.infobox) ? article.infobox : [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || {};
    const key = cut(row.field_key ?? row.label ?? '', 150);
    if (!key) continue;
    await conn.execute(
      'INSERT INTO article_infobox (article_id, section_label, field_key, field_value, display_order) VALUES (?, ?, ?, ?, ?)',
      [article.id, cut(row.section ?? row.section_label ?? null, 120), key, String(row.field_value ?? row.value ?? ''), i]
    );
  }
}

async function inTransaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await work(conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

/** Saves an article and its infobox rows. Call before changing the cache. */
export async function saveArticle(article) {
  if (!persistent) return;
  await inTransaction((conn) => writeArticle(conn, article));
}

export async function deleteArticle(id) {
  if (!persistent) return;
  await pool.execute('DELETE FROM articles WHERE id = ?', [id]);
}

export async function saveCategory(category) {
  if (!persistent) return;
  await pool.execute(CATEGORY_UPSERT, categoryParams(category));
}

export async function saveCategories(categories) {
  if (!persistent) return;
  await inTransaction(async (conn) => {
    for (const c of categories) await conn.execute(CATEGORY_UPSERT, categoryParams(c));
  });
}

export async function deleteCategory(id) {
  if (!persistent) return;
  await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
}

export async function saveAuthor(author) {
  if (!persistent) return;
  await pool.execute(AUTHOR_UPSERT, authorParams(author));
}

export async function deleteAuthor(id) {
  if (!persistent) return;
  await pool.execute('DELETE FROM authors WHERE id = ?', [id]);
}

/** Adds one page view. Best effort: a failure is logged, never shown to the reader. */
export function recordView(id) {
  if (!persistent) return;
  pool.execute('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [id]).catch((err) => {
    console.warn('[Content] Could not save a page view:', err.message);
  });
}

/** Writes the whole cache to MySQL. Used once, to fill an empty database. */
export async function saveAll() {
  if (!persistent) return;
  await inTransaction(async (conn) => {
    for (const c of memoryStore.categories) await conn.execute(CATEGORY_UPSERT, categoryParams(c));
    for (const a of memoryStore.authors) await conn.execute(AUTHOR_UPSERT, authorParams(a));
    for (const article of memoryStore.articles) await writeArticle(conn, article);
  });
}

/* --------------------------------------------------------------------------
   Startup
   -------------------------------------------------------------------------- */

/**
 * Before an empty database is filled with the built-in articles: keeps the
 * category and author rows it already has (npm run db:create-user adds a byline
 * for every CMS user) and gives the built-in ones new ids where they would
 * clash, updating the articles that point at them.
 */
function mergeSavedRows(savedCategories, savedAuthors) {
  const remapped = (saved, builtIn, sameAs) => {
    const map = new Map();
    let next = Math.max(0, ...saved.map((r) => r.id), ...builtIn.map((r) => Number(r.id) || 0)) + 1;
    const kept = [];
    for (const row of builtIn) {
      const twin = saved.find((r) => sameAs(r, row));
      if (twin) {
        map.set(row.id, twin.id);
      } else if (saved.some((r) => r.id === row.id)) {
        map.set(row.id, next);
        kept.push({ ...row, id: next++ });
      } else {
        kept.push(row);
      }
    }
    return { rows: [...saved, ...kept], map };
  };

  const categories = remapped(savedCategories, memoryStore.categories, (a, b) => a.slug === b.slug);
  const sameEmail = (a, b) => a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase();
  const authors = remapped(savedAuthors, memoryStore.authors, sameEmail);

  memoryStore.categories = categories.rows;
  memoryStore.authors = authors.rows;
  memoryStore.articles = memoryStore.articles.map((a) => ({
    ...a,
    category_id: categories.map.get(a.category_id) ?? a.category_id,
    author_id: authors.map.get(a.author_id) ?? a.author_id
  }));
}

/**
 * Connects the cache to MySQL. Returns 'loaded' when content came from the
 * database, 'empty' when the tables exist but hold no articles yet (the caller
 * should import content and then call saveAll), or 'memory' when content is
 * not persisted.
 */
export async function initContentStore() {
  const connected = await databaseReady;
  if (!connected) return 'memory';

  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM articles LIKE 'extra_json'");
    if (!cols.length) {
      console.warn('[Content] Migration 008 has not run, so articles are kept in memory only. Run npm run db:migrate.');
      return 'memory';
    }
  } catch (err) {
    console.warn(`[Content] The articles table is missing (${err.message}). Articles are kept in memory only.`);
    return 'memory';
  }

  persistent = true;

  const [articleRows] = await pool.query('SELECT * FROM articles WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC');
  const [categoryRows] = await pool.query('SELECT * FROM categories ORDER BY sort_order, id');
  const [authorRows] = await pool.query('SELECT * FROM authors ORDER BY id');

  if (!articleRows.length) {
    mergeSavedRows(categoryRows.map(rowToCategory), authorRows.map(rowToAuthor));
    console.log('[Content] The articles table is empty; it will be filled from the imported articles.');
    return 'empty';
  }
  const [infoboxRows] = await pool.query('SELECT * FROM article_infobox ORDER BY article_id, display_order, id');

  const categories = categoryRows.map(rowToCategory);
  const authors = authorRows.map(rowToAuthor);
  const infoboxByArticle = new Map();
  for (const r of infoboxRows) {
    const list = infoboxByArticle.get(Number(r.article_id)) || [];
    list.push({ section: r.section_label || '', field_key: r.field_key, field_value: r.field_value });
    infoboxByArticle.set(Number(r.article_id), list);
  }

  memoryStore.categories = categories;
  memoryStore.authors = authors;
  memoryStore.articles = articleRows.map((r) =>
    rowToArticle(r, infoboxByArticle, new Map(categories.map((c) => [c.id, c])), new Map(authors.map((a) => [a.id, a])))
  );
  console.log(`[Content] Loaded ${memoryStore.articles.length} articles, ${categories.length} categories and ${authors.length} authors from MySQL.`);
  return 'loaded';
}
