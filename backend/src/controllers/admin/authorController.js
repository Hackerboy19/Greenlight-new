/**
 * Admin Author Controller
 * Author profile management and credential assignment
 */

import { memoryStore } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';

export async function getAllAuthors(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      data: memoryStore.authors
    });
  } catch (error) {
    next(error);
  }
}

export async function getAuthorById(req, res, next) {
  try {
    const { id } = req.params;
    const author = memoryStore.authors.find(a => a.id === parseInt(id, 10));
    if (!author) {
      throw new AppError(`Author #${id} not found`, 404);
    }
    return res.status(200).json({
      success: true,
      data: author
    });
  } catch (error) {
    next(error);
  }
}

export async function createAuthor(req, res, next) {
  try {
    const { name, email, role = 'author', bio, avatar_url } = req.body;
    if (!name || !email) {
      throw new AppError('Author name and email are required.', 400);
    }

    const existing = memoryStore.authors.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new AppError(`An author with email ${email} already exists.`, 409);
    }

    const newAuthor = {
      id: Date.now(),
      name,
      email,
      role: role || 'author',
      bio: bio || '',
      avatar_url: avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
    };

    memoryStore.authors.push(newAuthor);

    return res.status(201).json({
      success: true,
      message: 'Author profile created successfully.',
      data: newAuthor
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAuthor(req, res, next) {
  try {
    const { id } = req.params;
    const authorIndex = memoryStore.authors.findIndex(a => a.id === parseInt(id, 10));
    if (authorIndex === -1) {
      throw new AppError(`Author #${id} not found`, 404);
    }

    const existing = memoryStore.authors[authorIndex];
    const { name, role, bio, avatar_url } = req.body;

    const updated = {
      ...existing,
      name: name || existing.name,
      role: role || existing.role,
      bio: bio !== undefined ? bio : existing.bio,
      avatar_url: avatar_url || existing.avatar_url
    };

    memoryStore.authors[authorIndex] = updated;

    return res.status(200).json({
      success: true,
      message: 'Author updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAuthor(req, res, next) {
  try {
    const { id } = req.params;
    const authorIndex = memoryStore.authors.findIndex(a => a.id === parseInt(id, 10));
    if (authorIndex === -1) {
      throw new AppError(`Author #${id} not found`, 404);
    }

    memoryStore.authors.splice(authorIndex, 1);

    return res.status(200).json({
      success: true,
      message: `Author #${id} removed successfully.`
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor
};
