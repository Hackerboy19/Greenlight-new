/**
 * Admin Media Library Controller
 *
 * Uploads are sent as the raw file body (Content-Type: image/...), one file
 * per request, with the original name in the X-File-Name header. That keeps
 * the server free of a multipart parser.
 */

import { AppError } from '../../middlewares/errorHandler.js';
import { readImageInfo } from '../../modules/media/imageInfo.js';
import { saveMedia, listMedia, updateMedia, deleteMedia, MAX_UPLOAD_BYTES } from '../../modules/media/mediaStore.js';

function headerText(value) {
  try {
    return decodeURIComponent(String(value || ''));
  } catch {
    return String(value || '');
  }
}

export async function uploadMedia(req, res, next) {
  try {
    const body = req.body;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      throw new AppError('Send the image file itself as the request body, with an image Content-Type.', 400);
    }
    if (body.length > MAX_UPLOAD_BYTES) {
      throw new AppError(`Images can be at most ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`, 413);
    }
    const info = readImageInfo(body);
    if (!info) {
      throw new AppError('Only JPEG, PNG, GIF and WebP images can be uploaded.', 415);
    }
    const item = await saveMedia(body, info, {
      originalName: headerText(req.get('x-file-name')),
      altText: headerText(req.get('x-alt-text')),
      user: req.user
    });
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function getMedia(req, res, next) {
  try {
    const { items, meta } = await listMedia({ page: req.query.page, limit: req.query.limit, search: req.query.search });
    return res.status(200).json({ success: true, data: items, meta });
  } catch (error) {
    next(error);
  }
}

export async function patchMedia(req, res, next) {
  try {
    const item = await updateMedia(Number(req.params.id), req.body || {});
    if (!item) throw new AppError('That image no longer exists.', 404);
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function removeMedia(req, res, next) {
  try {
    const removed = await deleteMedia(Number(req.params.id));
    if (!removed) throw new AppError('That image no longer exists.', 404);
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export default { uploadMedia, getMedia, patchMedia, removeMedia };
