import { authFetch, clearSession, loadSession, SESSION_EXPIRED_EVENT } from '../../../utils/adminAuth';
import type { MediaItem } from '../../../types';

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_UPLOAD_MB = 5;

/** Checks a file before uploading. Returns a reason it can't be uploaded, or null. */
export function rejectReason(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Only JPEG, PNG, WebP and GIF images can be uploaded.';
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `This image is larger than ${MAX_UPLOAD_MB} MB.`;
  return null;
}

/**
 * Uploads one image as the raw request body. Uses XMLHttpRequest because
 * fetch() can't report upload progress.
 */
export function uploadMediaFile(file: File, onProgress?: (fraction: number) => void): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const session = loadSession();
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/media');
    if (session) xhr.setRequestHeader('Authorization', `Bearer ${session.token}`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      let body: any = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // not JSON
      }
      if (xhr.status === 401 && session) {
        clearSession();
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }
      if (xhr.status >= 200 && xhr.status < 300 && body?.data) resolve(body.data);
      else reject(new Error(body?.message || `Upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error('The upload could not reach the server.'));
    xhr.send(file);
  });
}

export async function fetchMedia(params: { page: number; limit: number; search: string }) {
  const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) });
  if (params.search.trim()) query.set('search', params.search.trim());
  const res = await authFetch(`/api/admin/media?${query}`);
  const body = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(body?.data)) throw new Error(body?.message || `The media library could not load (${res.status}).`);
  return body as { data: MediaItem[]; meta: { page: number; limit: number; total: number; totalPages: number } };
}

export async function saveMediaDetails(id: number, fields: Partial<Pick<MediaItem, 'alt_text' | 'caption' | 'credit'>>) {
  const res = await authFetch(`/api/admin/media/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields)
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.data) throw new Error(body?.message || `Could not save (${res.status}).`);
  return body.data as MediaItem;
}

export async function deleteMediaItem(id: number) {
  const res = await authFetch(`/api/admin/media/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Could not delete (${res.status}).`);
  }
}

/** Full URL for places outside the site, such as og:image. */
export function absoluteMediaUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `${window.location.origin}${url}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
