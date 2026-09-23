/**
 * Admin Article Controller
 * Full CRUD for articles with transaction-based Wikipedia Infobox key-value persistence
 */

import { memoryStore } from '../../config/database.js';
import * as contentStore from '../../modules/content/contentStore.js';
import { sanitizeArticleHtml, stripHtmlToPlainText } from '../../utils/sanitizer.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { generateArticleSeo } from '../../services/geminiSeoService.js';
import { authorizeCreate, authorizeUpdate, authorizeDelete, articleActionsFor } from '../../modules/auth/articlePolicy.js';
import { recordActivity, actionForStatusChange } from '../../modules/activity/activityLog.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Words / 200, at least one minute. Counts words in the text, not the HTML. */
function estimateReadingTime(html) {
  const words = String(html || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Checks a slug typed in the editor. Returns it cleaned, or throws 400 for a
 * bad format and 409 when another article already uses it.
 */
function checkSlug(raw, ownId = null) {
  const slug = String(raw).trim().toLowerCase();
  if (!SLUG_PATTERN.test(slug) || slug.length > 200) {
    throw new AppError('The URL slug may only use lowercase letters, numbers and single hyphens.', 400);
  }
  if (memoryStore.articles.some((a) => a.slug === slug && a.id !== ownId)) {
    throw new AppError(`Another article already uses the URL "${slug}". Choose a different slug.`, 409);
  }
  return slug;
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Columns the admin table can sort by. Text sorts ignore case.
const SORTABLE = {
  title: (a) => String(a.title || '').toLowerCase(),
  status: (a) => String(a.status || ''),
  category: (a) => String(a.category_name || '').toLowerCase(),
  author: (a) => String(a.author_name || '').toLowerCase(),
  views: (a) => Number(a.views_count) || 0,
  reading_time: (a) => Number(a.reading_time) || 0,
  created_at: (a) => Date.parse(a.created_at) || 0,
  updated_at: (a) => Date.parse(a.updated_at || a.created_at) || 0,
  published_at: (a) => Date.parse(a.published_at) || 0
};

const STATUSES = ['draft', 'review', 'published', 'scheduled', 'archived'];

/** "a,b" or ["a","b"] -> ["a","b"], dropping blanks. */
function listParam(value) {
  const parts = Array.isArray(value) ? value : String(value ?? '').split(',');
  return parts.map((v) => String(v).trim()).filter(Boolean);
}

function idListParam(value) {
  return listParam(value).map((v) => parseInt(v, 10)).filter((n) => !Number.isNaN(n));
}

/**
 * List articles for the admin table: paging, sorting and multi-select filters.
 *
 *   page, limit          1-based page, 1-100 rows (default 20)
 *   sort, order          a SORTABLE key, asc or desc (default updated_at desc)
 *   status               one or more statuses, comma separated
 *   category_id          one or more category ids
 *   author_id            one or more author ids
 *   search               matches title, excerpt, slug or author name
 *
 * meta.statusCounts counts every status for the other filters, so the filter
 * menu can show how many rows each choice would give.
 */
export async function getAllArticles(req, res, next) {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10) || 20, 1), 100);
    const sortKey = SORTABLE[req.query.sort] ? req.query.sort : 'updated_at';
    const order = String(req.query.order || '').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const statuses = listParam(req.query.status).filter((st) => STATUSES.includes(st));
    const categoryIds = idListParam(req.query.category_id);
    const authorIds = idListParam(req.query.author_id);
    const search = String(req.query.search || '').trim().toLowerCase();

    let articles = memoryStore.articles.filter((a) => {
      if (categoryIds.length && !categoryIds.includes(Number(a.category_id))) return false;
      if (authorIds.length && !authorIds.includes(Number(a.author_id))) return false;
      if (search) {
        const haystack = [a.title, a.excerpt, a.slug, a.author_name].join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    const statusCounts = Object.fromEntries(STATUSES.map((st) => [st, 0]));
    for (const a of articles) {
      if (a.status in statusCounts) statusCounts[a.status]++;
    }
    if (statuses.length) {
      articles = articles.filter((a) => statuses.includes(a.status));
    }

    const valueOf = SORTABLE[sortKey];
    const direction = order === 'asc' ? 1 : -1;
    articles.sort((x, y) => {
      const a = valueOf(x);
      const b = valueOf(y);
      if (a < b) return -direction;
      if (a > b) return direction;
      return (Number(y.id) - Number(x.id)) * direction;
    });

    const total = articles.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(Math.max(parseInt(req.query.page || '1', 10) || 1, 1), totalPages);
    const offset = (page - 1) * limit;
    // The table needs no article bodies; the editor loads one with GET /articles/:id.
    const rows = articles
      .slice(offset, offset + limit)
      .map(({ content, infobox, ...row }) => ({ ...row, actions: articleActionsFor(req.user, row) }));

    return res.status(200).json({
      success: true,
      data: rows,
      meta: { page, limit, total, totalPages, sort: sortKey, order, statusCounts }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single article with full infobox metadata
 */
export async function getArticleById(req, res, next) {
  try {
    const { id } = req.params;
    const article = memoryStore.articles.find(a => a.id === parseInt(id, 10));

    if (!article) {
      throw new AppError(`Article with ID ${id} not found`, 404);
    }

    return res.status(200).json({
      success: true,
      data: { ...article, actions: articleActionsFor(req.user, article) }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create article with transaction-based infobox persistence
 */
export async function createArticle(req, res, next) {
  try {
    const {
      title,
      content,
      excerpt,
      featured_image,
      meta_title,
      meta_description,
      meta_keywords,
      og_image,
      category_id,
      infobox = []
    } = req.body;

    if (!title || !content) {
      throw new AppError('Title and article content are required.', 400);
    }

    // Authors always write as themselves and can only save drafts or submit for review.
    const { status, authorId: author_id, isFeatured: is_featured } = authorizeCreate(req.user, req.body);

    const cleanContent = sanitizeArticleHtml(content);
    const cleanExcerpt = excerpt || stripHtmlToPlainText(content, 180);
    const readingTime = estimateReadingTime(cleanContent);

    // Use the slug from the editor, or make a unique one from the title.
    let slug;
    if (req.body.slug) {
      slug = checkSlug(req.body.slug);
    } else {
      const baseSlug = generateSlug(title) || 'article';
      slug = baseSlug;
      let counter = 1;
      while (memoryStore.articles.some(a => a.slug === slug)) {
        slug = `${baseSlug}-${counter++}`;
      }
    }

    const parsedCatId = parseInt(category_id, 10);
    const parsedAuthId = parseInt(author_id, 10);
    
    const category = (!isNaN(parsedCatId) ? memoryStore.categories.find(c => c.id === parsedCatId) : null) 
      || memoryStore.categories[0] 
      || { id: 1, name: 'General', slug: 'general' };

    const author = (!isNaN(parsedAuthId) ? memoryStore.authors.find(au => au.id === parsedAuthId) : null) 
      || memoryStore.authors[0] 
      || { id: 1, name: 'Greenlight Editorial Desk', role: 'editor', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' };

    const newArticle = {
      id: Date.now(),
      title,
      slug,
      excerpt: cleanExcerpt,
      content: cleanContent,
      featured_image: featured_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80',
      meta_title: meta_title || title,
      meta_description: meta_description || cleanExcerpt,
      meta_keywords: meta_keywords || '',
      og_image: og_image || featured_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80',
      category_id: category.id,
      category_name: category.name,
      category_slug: category.slug,
      author_id: author.id,
      author_name: author.name,
      author_avatar: author.avatar_url,
      status,
      is_featured: is_featured ? 1 : 0,
      views_count: 0,
      reading_time: readingTime,
      published_at: status === 'published' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      infobox: Array.isArray(infobox) ? infobox : []
    };

    // Execute atomic transaction for article and infobox rows
    // MySQL first (article and infobox rows in one transaction), then the cache.
    await contentStore.saveArticle(newArticle);
    memoryStore.articles.unshift(newArticle);
    await recordActivity(req.user, status === 'published' ? 'published' : status === 'review' ? 'submitted' : 'created', newArticle);

    return res.status(201).json({
      success: true,
      message: 'Article and Wikipedia Infobox metadata successfully published.',
      data: newArticle
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update article and atomic Infobox key-values
 */
export async function updateArticle(req, res, next) {
  try {
    const { id } = req.params;
    const articleIndex = memoryStore.articles.findIndex(a => a.id === parseInt(id, 10));

    if (articleIndex === -1) {
      throw new AppError(`Article with ID ${id} not found`, 404);
    }

    const existing = memoryStore.articles[articleIndex];
    const {
      title,
      content,
      excerpt,
      featured_image,
      meta_title,
      meta_description,
      meta_keywords,
      og_image,
      category_id,
      infobox
    } = req.body;

    // Authors may only edit their own drafts; publishing and bylines are for editors.
    const { status, authorId: author_id, isFeatured: is_featured } = authorizeUpdate(req.user, existing, req.body);

    const cleanContent = content ? sanitizeArticleHtml(content) : existing.content;
    const cleanExcerpt = excerpt !== undefined ? excerpt : (content ? stripHtmlToPlainText(cleanContent, 180) : existing.excerpt);
    const readingTime = estimateReadingTime(cleanContent);
    const slug = req.body.slug && req.body.slug !== existing.slug ? checkSlug(req.body.slug, existing.id) : existing.slug;

    let category = existing.category_id;
    let categoryName = existing.category_name;
    let categorySlug = existing.category_slug;

    if (category_id !== undefined && category_id !== null && category_id !== '') {
      const parsedCatId = parseInt(category_id, 10);
      if (!isNaN(parsedCatId)) {
        const foundCat = memoryStore.categories.find(c => c.id === parsedCatId);
        if (foundCat) {
          category = foundCat.id;
          categoryName = foundCat.name;
          categorySlug = foundCat.slug;
        }
      }
    }

    let authorId = existing.author_id;
    let authorName = existing.author_name;
    let authorAvatar = existing.author_avatar;

    if (author_id !== undefined && author_id !== null && author_id !== '') {
      const parsedAuthId = parseInt(author_id, 10);
      if (!isNaN(parsedAuthId)) {
        const foundAuth = memoryStore.authors.find(au => au.id === parsedAuthId);
        if (foundAuth) {
          authorId = foundAuth.id;
          authorName = foundAuth.name;
          authorAvatar = foundAuth.avatar_url;
        }
      }
    }

    const updatedArticle = {
      ...existing,
      title: title || existing.title,
      slug,
      excerpt: cleanExcerpt,
      content: cleanContent,
      featured_image: featured_image !== undefined ? featured_image : existing.featured_image,
      meta_title: meta_title !== undefined ? meta_title : existing.meta_title,
      meta_description: meta_description !== undefined ? meta_description : existing.meta_description,
      meta_keywords: meta_keywords !== undefined ? meta_keywords : (existing.meta_keywords || ''),
      og_image: og_image !== undefined ? og_image : (existing.og_image || existing.featured_image),
      category_id: category,
      category_name: categoryName,
      category_slug: categorySlug,
      author_id: authorId,
      author_name: authorName,
      author_avatar: authorAvatar,
      status,
      published_at: status === 'published' && !existing.published_at ? new Date().toISOString() : existing.published_at,
      is_featured: is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
      reading_time: readingTime,
      infobox: Array.isArray(infobox) ? infobox : existing.infobox,
      updated_at: new Date().toISOString()
    };

    await contentStore.saveArticle(updatedArticle);
    memoryStore.articles[articleIndex] = updatedArticle;
    await recordActivity(req.user, actionForStatusChange(existing.status, updatedArticle.status), updatedArticle);

    return res.status(200).json({
      success: true,
      message: 'Article updated successfully.',
      data: updatedArticle
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete article
 */
export async function deleteArticle(req, res, next) {
  try {
    authorizeDelete(req.user);
    const { id } = req.params;
    const articleIndex = memoryStore.articles.findIndex(a => a.id === parseInt(id, 10));

    if (articleIndex === -1) {
      throw new AppError(`Article with ID ${id} not found`, 404);
    }

    const removed = memoryStore.articles[articleIndex];
    await contentStore.deleteArticle(removed.id);
    memoryStore.articles.splice(articleIndex, 1);
    await recordActivity(req.user, 'deleted', removed);

    return res.status(200).json({
      success: true,
      message: `Article #${id} removed successfully.`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Quick Fix SEO with Gemini 3.8 Flash
 * Automatically analyzes article content to generate missing meta_title,
 * meta_description, and social open graph attributes.
 */
export async function quickFixSeo(req, res, next) {
  try {
    const articlePayload = req.body.article || req.body || {};
    const articleId = req.params.id ? parseInt(req.params.id, 10) : (articlePayload.id ? parseInt(articlePayload.id, 10) : null);
    const saveImmediately = req.body.saveImmediately !== false;

    let targetArticle = { ...articlePayload };
    let articleIndex = -1;

    if (articleId) {
      articleIndex = memoryStore.articles.findIndex(a => a.id === articleId);
      if (articleIndex !== -1) {
        targetArticle = { ...memoryStore.articles[articleIndex], ...articlePayload };
      }
    }

    if (!targetArticle.title && !targetArticle.content && !targetArticle.excerpt) {
      throw new AppError('Article content or title is required to generate SEO metadata', 400);
    }

    // Saving the result is an edit, so it follows the same rules as updateArticle.
    if (saveImmediately && articleIndex !== -1) {
      authorizeUpdate(req.user, memoryStore.articles[articleIndex], {});
    }

    // Call Gemini 3.8 Flash SEO generator
    const generated = await generateArticleSeo(targetArticle);

    // Save directly to memoryStore if the article exists in the database
    if (saveImmediately && articleIndex !== -1) {
      const updatedArticle = {
        ...memoryStore.articles[articleIndex],
        meta_title: generated.meta_title,
        meta_description: generated.meta_description,
        meta_keywords: generated.meta_keywords || memoryStore.articles[articleIndex].meta_keywords || '',
        og_image: generated.og_image || memoryStore.articles[articleIndex].og_image || memoryStore.articles[articleIndex].featured_image,
        updated_at: new Date().toISOString()
      };
      await contentStore.saveArticle(updatedArticle);
      memoryStore.articles[articleIndex] = updatedArticle;

      return res.status(200).json({
        success: true,
        message: 'SEO metadata generated with Gemini and saved successfully.',
        data: updatedArticle,
        generated
      });
    }

    return res.status(200).json({
      success: true,
      message: 'SEO metadata generated with Gemini.',
      data: {
        ...targetArticle,
        meta_title: generated.meta_title,
        meta_description: generated.meta_description,
        meta_keywords: generated.meta_keywords || targetArticle.meta_keywords || '',
        og_image: generated.og_image
      },
      generated
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  quickFixSeo
};
