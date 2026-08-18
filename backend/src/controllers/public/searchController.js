/**
 * Public Search Controller
 * Provides full-text and fuzzy search across article titles, content, categories, and Infobox keys
 */

import { memoryStore } from '../../config/database.js';
import { stripHtmlToPlainText } from '../../utils/sanitizer.js';

export async function searchArticles(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    const categorySlug = req.query.category || null;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const offset = (page - 1) * limit;

    if (!q && !categorySlug) {
      return res.status(200).json({
        success: true,
        query: '',
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      });
    }

    const searchWords = q.toLowerCase().split(/\s+/).filter(w => w.length > 0);

    const results = memoryStore.articles
      .filter(article => article.status === 'published')
      .map(article => {
        let score = 0;
        const titleLower = article.title.toLowerCase();
        const excerptLower = (article.excerpt || '').toLowerCase();
        const contentPlain = stripHtmlToPlainText(article.content, 1000).toLowerCase();
        const categoryMatch = categorySlug ? (article.category_slug === categorySlug) : true;

        if (!categoryMatch) return null;

        if (q) {
          // Exact title match gets huge boost
          if (titleLower.includes(q.toLowerCase())) {
            score += 100;
          }

          // Search words scoring
          searchWords.forEach(word => {
            if (titleLower.includes(word)) score += 30;
            if (excerptLower.includes(word)) score += 15;
            if (contentPlain.includes(word)) score += 5;
            if (article.category_name.toLowerCase().includes(word)) score += 20;

            // Search within infobox key-values
            if (Array.isArray(article.infobox)) {
              article.infobox.forEach(item => {
                if (item.field_key.toLowerCase().includes(word) || item.field_value.toLowerCase().includes(word)) {
                  score += 25;
                }
              });
            }
          });
        } else {
          // Just category filter
          score = 10;
        }

        return score > 0 ? { ...article, searchScore: score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.searchScore - a.searchScore);

    const total = results.length;
    const paginated = results.slice(offset, offset + limit);

    return res.status(200).json({
      success: true,
      query: q,
      categoryFilter: categorySlug,
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

export default {
  searchArticles
};
