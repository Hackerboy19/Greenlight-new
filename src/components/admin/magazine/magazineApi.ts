import { authFetch } from '../../../utils/adminAuth';
import type { MagazineIssue, MagazinePage } from '../../../types';

export interface IssueDraft {
  title: string;
  slug: string;
  issue_label: string;
  description: string;
  pages: MagazinePage[];
}

async function send<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await authFetch(url, {
    ...init,
    headers: init.body ? { 'Content-Type': 'application/json' } : undefined
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message || `The request failed (${res.status}).`);
  return body?.data as T;
}

export const fetchIssues = () => send<MagazineIssue[]>('/api/admin/magazine/issues');

export const fetchIssue = (id: number) => send<MagazineIssue>(`/api/admin/magazine/issues/${id}`);

export const createIssue = (draft: IssueDraft) =>
  send<MagazineIssue>('/api/admin/magazine/issues', { method: 'POST', body: JSON.stringify(draft) });

export const saveIssue = (id: number, draft: IssueDraft) =>
  send<MagazineIssue>(`/api/admin/magazine/issues/${id}`, { method: 'PUT', body: JSON.stringify(draft) });

export const setIssueStatus = (id: number, status: MagazineIssue['status']) =>
  send<MagazineIssue>(`/api/admin/magazine/issues/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const deleteIssue = (id: number) => send<void>(`/api/admin/magazine/issues/${id}`, { method: 'DELETE' });

/** Same rule as the server: lower-case letters, numbers and dashes. */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}
