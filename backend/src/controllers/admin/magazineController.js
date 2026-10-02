/**
 * Magazine (flipbook) issues: the Admin CMS "Magazine" tab and the reader's
 * /magazine pages.
 *
 * Admins and editors build issues; publishing needs article.publish, and a
 * published issue can only be deleted by a role with article.delete.
 */

import { AppError } from '../../middlewares/errorHandler.js';
import { can } from '../../modules/auth/permissions.js';
import {
  listIssues,
  getIssue,
  getPublishedIssue,
  createIssue,
  updateIssue,
  setIssueStatus,
  deleteIssue,
  MagazineInputError
} from '../../modules/magazine/magazineStore.js';

function asAppError(err) {
  return err instanceof MagazineInputError ? new AppError(err.message, err.status) : err;
}

export async function getIssues(req, res, next) {
  try {
    return res.status(200).json({ success: true, data: await listIssues() });
  } catch (error) {
    next(error);
  }
}

export async function getIssueById(req, res, next) {
  try {
    const issue = await getIssue(req.params.id);
    if (!issue) throw new AppError('That issue no longer exists.', 404);
    return res.status(200).json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
}

export async function postIssue(req, res, next) {
  try {
    const issue = await createIssue(req.body || {}, req.user);
    return res.status(201).json({ success: true, data: issue });
  } catch (error) {
    next(asAppError(error));
  }
}

export async function putIssue(req, res, next) {
  try {
    const issue = await updateIssue(Number(req.params.id), req.body || {}, req.user);
    if (!issue) throw new AppError('That issue no longer exists.', 404);
    return res.status(200).json({ success: true, data: issue });
  } catch (error) {
    next(asAppError(error));
  }
}

export async function patchIssueStatus(req, res, next) {
  try {
    const issue = await setIssueStatus(Number(req.params.id), String((req.body || {}).status || ''), req.user);
    if (!issue) throw new AppError('That issue no longer exists.', 404);
    return res.status(200).json({ success: true, data: issue });
  } catch (error) {
    next(asAppError(error));
  }
}

export async function removeIssue(req, res, next) {
  try {
    const issue = await getIssue(req.params.id);
    if (!issue) throw new AppError('That issue no longer exists.', 404);
    if (issue.status === 'published' && !can(req.user.role, 'article.delete')) {
      throw new AppError('Only an admin can delete a published issue. Unpublish it first, or ask an admin.', 403);
    }
    await deleteIssue(issue.id);
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

/* Reader endpoints (no sign-in) */

export async function getPublishedIssues(req, res, next) {
  try {
    return res.status(200).json({ success: true, data: await listIssues({ publishedOnly: true }) });
  } catch (error) {
    next(error);
  }
}

export async function getPublishedIssueBySlug(req, res, next) {
  try {
    const issue = await getPublishedIssue(req.params.slug);
    if (!issue) throw new AppError('This magazine issue is not available.', 404);
    return res.status(200).json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
}
