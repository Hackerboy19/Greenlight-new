/**
 * Public Article Controller
 * Provides high-performance homepage aggregates, slug-based article retrieval with Wikipedia Infoboxes,
 * and category-mapped feeds.
 */

import { memoryStore } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';

/**
 * Get aggregated homepage data
 * Returns:
 * - featured: Top highlighted editorial stories
 * - trending: Chronological / high-engagement story feed
 * - categoryRows: Active categories in display_order, populated with their latest articles
 */
export async function getHomepageData(req, res, next) {
  try {
    const publishedArticles = memoryStore.articles.filter(a => a.status === 'published');

    // 1. Featured articles
    const featured = publishedArticles.filter(a => a.is_featured === 1);
    const heroArticles = featured.length > 0 ? featured : publishedArticles.slice(0, 3);

    // 2. Chronological trending feed
    const trending = [...publishedArticles]
      .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
      .slice(0, 6);

    // 3. Category-mapped rows ordered by display_order
    const activeCategories = [...memoryStore.categories]
      .filter(c => c.is_active === 1)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    const categoryRows = activeCategories.map(cat => {
      const catArticles = publishedArticles
        .filter(a => a.category_id === cat.id || a.category_slug === cat.slug)
        .slice(0, 4);
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        display_order: cat.display_order,
        articleCount: catArticles.length,
        articles: catArticles
      };
    }).filter(row => row.articles.length > 0);

    return res.status(200).json({
      success: true,
      data: {
        featured: heroArticles,
        trending,
        categoryRows,
        meta: {
          totalArticles: publishedArticles.length,
          totalCategories: activeCategories.length,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get article by slug with Wikipedia Infobox and related category articles
 */
export async function getArticleBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const article = memoryStore.articles.find(a => a.slug === slug);

    if (!article) {
      throw new AppError(`Article "${slug}" was not found.`, 404);
    }

    // Increment views count
    article.views_count = (article.views_count || 0) + 1;

    // Fetch related articles from same category
    const related = memoryStore.articles
      .filter(a => a.id !== article.id && a.category_id === article.category_id && a.status === 'published')
      .slice(0, 3);

    return res.status(200).json({
      success: true,
      data: {
        ...article,
        related
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get articles by category slug with pagination
 */
export async function getArticlesByCategory(req, res, next) {
  try {
    const { categorySlug } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '12', 10);
    const offset = (page - 1) * limit;

    const category = memoryStore.categories.find(c => c.slug === categorySlug);
    if (!category) {
      throw new AppError(`Category "${categorySlug}" not found.`, 404);
    }

    const articles = memoryStore.articles
      .filter(a => a.category_id === category.id && a.status === 'published')
      .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));

    const total = articles.length;
    const paginated = articles.slice(offset, offset + limit);

    return res.status(200).json({
      success: true,
      category,
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

export default {
  getHomepageData,
  getArticleBySlug,
  getArticlesByCategory
};
