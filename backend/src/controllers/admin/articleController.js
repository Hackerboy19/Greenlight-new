/**
 * Admin Article Controller
 * Full CRUD for articles with transaction-based Wikipedia Infobox key-value persistence
 */

import { query, transaction, memoryStore } from '../../config/database.js';
import { sanitizeArticleHtml, stripHtmlToPlainText } from '../../utils/sanitizer.js';
import { AppError } from '../../middlewares/errorHandler.js';

function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * List all articles with pagination, filters, and status
 */
export async function getAllArticles(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const offset = (page - 1) * limit;
    const categoryId = req.query.category_id ? parseInt(req.query.category_id, 10) : null;
    const status = req.query.status || null;
    const search = req.query.search || null;

    let articles = [...memoryStore.articles];

    if (categoryId) {
      articles = articles.filter(a => a.category_id === categoryId);
    }
    if (status) {
      articles = articles.filter(a => a.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      articles = articles.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.excerpt.toLowerCase().includes(q)
      );
    }

    const total = articles.length;
    const paginated = articles.slice(offset, offset + limit);

    return res.status(200).json({
      success: true,
      data: paginated,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
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
      data: article
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
      category_id,
      author_id,
      status = 'published',
      is_featured = false,
      infobox = []
    } = req.body;

    if (!title || !content) {
      throw new AppError('Title and article content are required.', 400);
    }

    const cleanContent = sanitizeArticleHtml(content);
    const cleanExcerpt = excerpt || stripHtmlToPlainText(content, 180);
    const readingTime = Math.max(1, Math.ceil(cleanContent.split(/\s+/).length / 200));
    
    // Generate unique slug
    let baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;
    while (memoryStore.articles.some(a => a.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
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
      category_id: category.id,
      category_name: category.name,
      category_slug: category.slug,
      author_id: author.id,
      author_name: author.name,
      author_avatar: author.avatar_url,
      status: status || 'published',
      is_featured: is_featured ? 1 : 0,
      views_count: 0,
      reading_time: readingTime,
      published_at: status === 'published' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      infobox: Array.isArray(infobox) ? infobox : []
    };

    // Execute atomic transaction for article and infobox rows
    await transaction(async (connection) => {
      // In production SQL environment:
      // INSERT INTO articles (title, slug, content, excerpt, ...) VALUES (...)
      // INSERT INTO article_infobox (article_id, section_name, field_key, field_value) VALUES (?, ?, ?, ?)
      memoryStore.articles.unshift(newArticle);
    });

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
      category_id,
      author_id,
      status,
      is_featured,
      infobox
    } = req.body;

    const cleanContent = content ? sanitizeArticleHtml(content) : existing.content;
    const cleanExcerpt = excerpt !== undefined ? excerpt : (content ? stripHtmlToPlainText(cleanContent, 180) : existing.excerpt);
    const readingTime = Math.max(1, Math.ceil(cleanContent.split(/\s+/).length / 200));

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
      excerpt: cleanExcerpt,
      content: cleanContent,
      featured_image: featured_image !== undefined ? featured_image : existing.featured_image,
      meta_title: meta_title !== undefined ? meta_title : existing.meta_title,
      meta_description: meta_description !== undefined ? meta_description : existing.meta_description,
      category_id: category,
      category_name: categoryName,
      category_slug: categorySlug,
      author_id: authorId,
      author_name: authorName,
      author_avatar: authorAvatar,
      status: status || existing.status,
      is_featured: is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
      reading_time: readingTime,
      infobox: Array.isArray(infobox) ? infobox : existing.infobox,
      updated_at: new Date().toISOString()
    };

    await transaction(async (connection) => {
      // Production SQL:
      // UPDATE articles SET ... WHERE id = ?
      // DELETE FROM article_infobox WHERE article_id = ?
      // INSERT INTO article_infobox (...) VALUES ...
      memoryStore.articles[articleIndex] = updatedArticle;
    });

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
    const { id } = req.params;
    const articleIndex = memoryStore.articles.findIndex(a => a.id === parseInt(id, 10));

    if (articleIndex === -1) {
      throw new AppError(`Article with ID ${id} not found`, 404);
    }

    await transaction(async () => {
      memoryStore.articles.splice(articleIndex, 1);
    });

    return res.status(200).json({
      success: true,
      message: `Article #${id} removed successfully.`
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
  deleteArticle
};
