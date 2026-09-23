/**
 * Who may create, edit and publish which article.
 *
 *   admin, editor  edit any article and publish it.
 *   author         creates articles as drafts under their own byline, edits
 *                  them while they are still drafts, and may submit a draft
 *                  for review. Publishing, featuring and changing the byline
 *                  need editor permissions.
 *
 * Each check returns the fields the caller must apply (for example, the
 * author's own byline) or throws a 403 AppError.
 */

import { memoryStore } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { can } from './permissions.js';

// Statuses that take an article live, schedule it, or pull it from the site.
const EDITORIAL_STATUSES = new Set(['published', 'scheduled', 'archived']);
const ALL_STATUSES = new Set(['draft', 'review', 'published', 'scheduled', 'archived']);

function forbidden(message) {
  return new AppError(message, 403);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * The author profile (byline) that belongs to the signed-in user, matched by
 * email. With { create: true } a profile is added when the user has none, so
 * a new author's first article carries their own name.
 */
export function ownAuthorProfile(user, { create = false } = {}) {
  const email = normalizeEmail(user && user.email);
  if (!email) return null;
  const found = memoryStore.authors.find((a) => normalizeEmail(a.email) === email);
  if (found || !create) return found || null;

  const profile = {
    id: Math.max(0, ...memoryStore.authors.map((a) => Number(a.id) || 0)) + 1,
    name: user.name || email,
    email,
    role: user.role,
    bio: '',
    avatar_url: ''
  };
  memoryStore.authors.push(profile);
  return profile;
}

function checkStatus(user, status) {
  if (!ALL_STATUSES.has(status)) {
    throw new AppError(`Unknown status "${status}".`, 400);
  }
  if (EDITORIAL_STATUSES.has(status) && !can(user.role, 'article.publish')) {
    throw forbidden('Only editors and admins can publish, schedule or archive articles. Save it as a draft or submit it for review.');
  }
  if (status === 'review' && !can(user.role, 'article.submit')) {
    throw forbidden('Your role cannot submit articles for review.');
  }
}

/**
 * Checks a new article. Returns { status, authorId, isFeatured } to use in
 * place of the request's values.
 */
export function authorizeCreate(user, body) {
  if (!can(user.role, 'article.create')) {
    throw forbidden('Your role cannot create articles.');
  }

  const status = body.status || (can(user.role, 'article.publish') ? 'published' : 'draft');
  checkStatus(user, status);

  let authorId = body.author_id;
  if (!can(user.role, 'article.edit.any')) {
    authorId = ownAuthorProfile(user, { create: true }).id;
  }

  const isFeatured = can(user.role, 'article.feature') ? Boolean(body.is_featured) : false;
  return { status, authorId, isFeatured };
}

/**
 * Checks an edit to an existing article. Returns { status, authorId,
 * isFeatured } to use in place of the request's values (undefined means
 * "keep the existing value").
 */
export function authorizeUpdate(user, existing, body) {
  const nextStatus = body.status || existing.status;
  const statusChanged = nextStatus !== existing.status;

  if (can(user.role, 'article.edit.any')) {
    // Moving an article into, out of, or between live states is publishing.
    if (statusChanged && (EDITORIAL_STATUSES.has(nextStatus) || EDITORIAL_STATUSES.has(existing.status))) {
      if (!can(user.role, 'article.publish')) {
        throw forbidden('Only editors and admins can publish or unpublish articles.');
      }
    }
    if (statusChanged) checkStatus(user, nextStatus);
    return {
      status: nextStatus,
      authorId: body.author_id,
      isFeatured: can(user.role, 'article.feature') ? body.is_featured : undefined
    };
  }

  if (!can(user.role, 'article.edit.own')) {
    throw forbidden('Your role cannot edit articles.');
  }
  const own = ownAuthorProfile(user);
  if (!own || Number(existing.author_id) !== Number(own.id)) {
    throw forbidden('You can only edit articles you wrote.');
  }
  if (existing.status !== 'draft') {
    throw forbidden('This article is no longer a draft. Ask an editor to make changes.');
  }
  if (statusChanged) checkStatus(user, nextStatus);

  // Authors keep their own byline and cannot feature articles.
  return { status: nextStatus, authorId: undefined, isFeatured: undefined };
}

/** Throws unless the user may delete the article. */
export function authorizeDelete(user) {
  if (!can(user.role, 'article.delete')) {
    throw forbidden('Only admins can delete articles.');
  }
}
