/**
 * Admin Category Controller
 * CRUD and reorder logic for homepage category rows
 */

import { query, transaction, memoryStore } from '../../config/database.js';
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
 * Get all categories sorted by display_order
 */
export async function getAllCategories(req, res, next) {
  try {
    const categories = [...memoryStore.categories].sort((a, b) => a.display_order - b.display_order);
    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new category
 */
export async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) {
      throw new AppError('Category name is required.', 400);
    }

    const slug = generateSlug(name);
    const existing = memoryStore.categories.find(c => c.slug === slug);
    if (existing) {
      throw new AppError(`Category slug "${slug}" already exists.`, 409);
    }

    const maxOrder = memoryStore.categories.reduce((max, c) => Math.max(max, c.display_order || 0), 0);
    const newCategory = {
      id: Date.now(),
      name,
      slug,
      description: description || '',
      display_order: maxOrder + 1,
      is_active: 1
    };

    memoryStore.categories.push(newCategory);

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: newCategory
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update category details
 */
export async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    const categoryIndex = memoryStore.categories.findIndex(c => c.id === parseInt(id, 10));
    if (categoryIndex === -1) {
      throw new AppError(`Category #${id} not found`, 404);
    }

    const existing = memoryStore.categories[categoryIndex];
    const updated = {
      ...existing,
      name: name || existing.name,
      slug: name ? generateSlug(name) : existing.slug,
      description: description !== undefined ? description : existing.description,
      is_active: is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active
    };

    memoryStore.categories[categoryIndex] = updated;

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reorder homepage category rows
 * Accepts array: [{ id: 1, display_order: 1 }, { id: 3, display_order: 2 }, ...]
 */
export async function reorderCategories(req, res, next) {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      throw new AppError('Invalid payload: "orders" array containing category ID and order required.', 400);
    }

    await transaction(async () => {
      orders.forEach(({ id, display_order }) => {
        const cat = memoryStore.categories.find(c => c.id === parseInt(id, 10));
        if (cat) {
          cat.display_order = parseInt(display_order, 10);
        }
      });
      // Sort in-place
      memoryStore.categories.sort((a, b) => a.display_order - b.display_order);
    });

    return res.status(200).json({
      success: true,
      message: 'Homepage category display order updated successfully.',
      data: memoryStore.categories
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete category
 */
export async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const catIndex = memoryStore.categories.findIndex(c => c.id === parseInt(id, 10));
    if (catIndex === -1) {
      throw new AppError(`Category #${id} not found`, 404);
    }

    // Check if articles are assigned
    const hasArticles = memoryStore.articles.some(a => a.category_id === parseInt(id, 10));
    if (hasArticles) {
      throw new AppError('Cannot delete category with associated articles. Reassign them first.', 400);
    }

    memoryStore.categories.splice(catIndex, 1);

    return res.status(200).json({
      success: true,
      message: `Category #${id} removed successfully.`
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getAllCategories,
  createCategory,
  updateCategory,
  reorderCategories,
  deleteCategory
};
