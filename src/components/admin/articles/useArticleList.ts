import { useCallback, useEffect, useRef, useState } from 'react';
import { authFetch } from '../../../utils/adminAuth';
import type { Article, ArticleListMeta, ArticleSortKey } from '../../../types';

export interface ArticleListQuery {
  page: number;
  limit: number;
  sort: ArticleSortKey;
  order: 'asc' | 'desc';
  statuses: Article['status'][];
  categoryIds: number[];
  authorIds: number[];
  search: string;
}

function toSearchParams(q: ArticleListQuery) {
  const params = new URLSearchParams({
    page: String(q.page),
    limit: String(q.limit),
    sort: q.sort,
    order: q.order
  });
  if (q.statuses.length) params.set('status', q.statuses.join(','));
  if (q.categoryIds.length) params.set('category_id', q.categoryIds.join(','));
  if (q.authorIds.length) params.set('author_id', q.authorIds.join(','));
  if (q.search.trim()) params.set('search', q.search.trim());
  return params;
}

/**
 * One page of GET /api/admin/articles for the given query. A response to an
 * older query that arrives late is ignored.
 */
export function useArticleList(query: ArticleListQuery, refreshKey?: unknown) {
  const [rows, setRows] = useState<Article[]>([]);
  const [meta, setMeta] = useState<ArticleListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);
  const queryString = toSearchParams(query).toString();

  const reload = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/admin/articles?${queryString}`);
      const body = await res.json().catch(() => null);
      if (request !== latest.current) return;
      if (!res.ok || !Array.isArray(body?.data)) throw new Error(body?.message || `Articles could not load (${res.status}).`);
      setRows(body.data);
      setMeta(body.meta);
    } catch (err) {
      if (request !== latest.current) return;
      setError(err instanceof Error ? err.message : 'Articles could not load.');
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    reload();
  }, [reload, refreshKey]);

  return { rows, meta, loading, error, reload };
}
