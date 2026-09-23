import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Edit3,
  EyeOff,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Undo2,
  X
} from 'lucide-react';
import { authFetch } from '../../../utils/adminAuth';
import { calculateSeoHealth } from '../../../utils/seoHealth';
import type { Article, ArticleActions, ArticleSortKey, Author, Category } from '../../../types';
import { MultiSelectFilter } from './MultiSelectFilter';
import { STATUS_LABELS, StatusBadge } from './StatusBadge';
import { TablePagination } from './TablePagination';
import { useArticleList } from './useArticleList';

/** A workflow step the table can apply to one or many articles. */
type WorkflowAction = 'submit' | 'publish' | 'returnToDraft' | 'unpublish' | 'delete';

const WORKFLOW: Record<
  WorkflowAction,
  { label: string; done: string; icon: React.ComponentType<{ className?: string }>; status?: Article['status']; tone: string }
> = {
  submit: { label: 'Submit for review', done: 'submitted for review', icon: Send, status: 'review', tone: 'text-amber-700 dark:text-amber-400' },
  publish: { label: 'Publish', done: 'published', icon: CheckCircle2, status: 'published', tone: 'text-brand-700 dark:text-brand-400' },
  returnToDraft: { label: 'Send back to draft', done: 'sent back to draft', icon: Undo2, status: 'draft', tone: 'text-violet-700 dark:text-violet-400' },
  unpublish: { label: 'Unpublish', done: 'moved to draft', icon: EyeOff, status: 'draft', tone: 'text-orange-700 dark:text-orange-400' },
  delete: { label: 'Delete', done: 'deleted', icon: Trash2, tone: 'text-red-600 dark:text-red-400' }
};

const STATUS_ORDER: Article['status'][] = ['draft', 'review', 'published', 'scheduled', 'archived'];

const COLUMNS: { key: ArticleSortKey; label: string; className?: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status', className: 'hidden sm:table-cell' },
  { key: 'category', label: 'Category', className: 'hidden md:table-cell' },
  { key: 'author', label: 'Author', className: 'hidden lg:table-cell' },
  { key: 'views', label: 'Views', className: 'hidden sm:table-cell text-right' },
  { key: 'reading_time', label: 'Read', className: 'hidden 2xl:table-cell text-right' },
  { key: 'updated_at', label: 'Updated', className: 'hidden md:table-cell' }
];

const number = new Intl.NumberFormat('en');

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export interface ArticlesTableProps {
  categories: Category[];
  authors: Author[];
  /** Status filter to start with, e.g. from the dashboard's Pending reviews card. */
  initialStatuses?: Article['status'][];
  /** Author filter to start with, e.g. from a staff card. */
  initialAuthorIds?: number[];
  /** Changes whenever an article is saved elsewhere, so the table reloads. */
  refreshKey?: unknown;
  onEdit: (articleId: number) => void;
  /** Called after the table changed articles (status or delete). */
  onChanged?: () => void;
  onNotice?: (message: string) => void;
}

/**
 * The Articles screen: server-side paging, sorting and filters, row selection
 * and the Draft → Review → Published workflow.
 */
export const ArticlesTable: React.FC<ArticlesTableProps> = ({
  categories,
  authors,
  initialStatuses = [],
  initialAuthorIds = [],
  refreshKey,
  onEdit,
  onChanged,
  onNotice
}) => {
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput, 300);
  const [statuses, setStatuses] = useState<Article['status'][]>(initialStatuses);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [authorIds, setAuthorIds] = useState<number[]>(initialAuthorIds);
  const [sort, setSort] = useState<ArticleSortKey>('updated_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Any change to what is listed starts again from page 1 with nothing selected.
  useEffect(() => {
    setPage(1);
  }, [search, statuses, categoryIds, authorIds, sort, order, limit]);

  const { rows, meta, loading, error, reload } = useArticleList(
    { page, limit, sort, order, statuses, categoryIds, authorIds, search },
    refreshKey
  );

  useEffect(() => {
    setSelected(new Set());
  }, [rows]);

  const statusOptions = STATUS_ORDER.map((st) => ({
    value: st,
    label: STATUS_LABELS[st],
    count: meta?.statusCounts?.[st]
  }));
  const categoryOptions = useMemo(() => categories.map((c) => ({ value: c.id, label: c.name })), [categories]);
  const authorOptions = useMemo(() => authors.map((a) => ({ value: a.id, label: a.name })), [authors]);
  const hasFilters = Boolean(searchInput || statuses.length || categoryIds.length || authorIds.length);

  const toggleSort = (key: ArticleSortKey) => {
    if (sort === key) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(key);
      // Text reads naturally A→Z; numbers and dates newest or biggest first.
      setOrder(['title', 'category', 'author', 'status'].includes(key) ? 'asc' : 'desc');
    }
  };

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allOnPageSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const toggleRow = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedRows = rows.filter((r) => selected.has(r.id));
  const allowed = (row: Article, action: WorkflowAction) => Boolean(row.actions?.[action as keyof ArticleActions]);

  /** Applies one workflow step to the given articles, skipping any the user may not change. */
  const run = async (action: WorkflowAction, targets: Article[]) => {
    const permitted = targets.filter((row) => allowed(row, action));
    if (!permitted.length) return;
    if (action === 'delete') {
      const what = permitted.length === 1 ? `"${permitted[0].title}"` : `${permitted.length} articles`;
      if (!window.confirm(`Delete ${what}? This cannot be undone.`)) return;
    }

    setBusy(true);
    setActionError(null);
    const failures: string[] = [];
    for (const row of permitted) {
      try {
        const res =
          action === 'delete'
            ? await authFetch(`/api/admin/articles/${row.id}`, { method: 'DELETE' })
            : await authFetch(`/api/admin/articles/${row.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: WORKFLOW[action].status })
              });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          failures.push(`${row.title}: ${body?.message || `error ${res.status}`}`);
        }
      } catch {
        failures.push(`${row.title}: the server could not be reached`);
      }
    }
    setBusy(false);

    const succeeded = permitted.length - failures.length;
    const skipped = targets.length - permitted.length;
    if (succeeded) {
      const noun = succeeded === 1 ? '1 article' : `${succeeded} articles`;
      onNotice?.(`${noun} ${WORKFLOW[action].done}${skipped ? `; ${skipped} skipped because your role can't change them` : ''}.`);
    }
    if (failures.length) setActionError(failures.join(' · '));
    await reload();
    if (succeeded) onChanged?.();
  };

  const bulkActions = (Object.keys(WORKFLOW) as WorkflowAction[]).filter((action) =>
    selectedRows.some((row) => allowed(row, action))
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search title, slug or author"
            aria-label="Search articles"
            className="w-full h-10 pl-9 pr-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 shadow-card outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MultiSelectFilter label="Status" options={statusOptions} selected={statuses} onChange={setStatuses} />
          <MultiSelectFilter label="Category" options={categoryOptions} selected={categoryIds} onChange={setCategoryIds} />
          <MultiSelectFilter label="Author" options={authorOptions} selected={authorIds} onChange={setAuthorIds} />
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setStatuses([]);
                setCategoryIds([]);
                setAuthorIds([]);
              }}
              className="h-10 inline-flex items-center gap-1 px-2.5 text-xs font-semibold text-slate-500 hover:text-red-600"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {(error || actionError) && (
        <div className="flex items-start justify-between gap-3 p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
          <span>{error || actionError}</span>
          {error ? (
            <button type="button" onClick={reload} className="inline-flex items-center gap-1 font-semibold hover:underline shrink-0">
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </button>
          ) : (
            <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss" className="shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="rounded-card border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card overflow-hidden">
        {/* Bulk actions for the selected rows */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-brand-50 dark:bg-brand-950/40 border-b border-brand-100 dark:border-brand-900/60 text-xs">
            <span className="font-bold text-brand-900 dark:text-brand-200 mr-1">{selected.size} selected</span>
            {bulkActions.length === 0 && (
              <span className="text-slate-500 dark:text-slate-400">Your role can't change these articles.</span>
            )}
            {bulkActions.map((action) => {
              const { label, icon: Icon, tone } = WORKFLOW[action];
              return (
                <button
                  key={action}
                  type="button"
                  disabled={busy}
                  onClick={() => run(action, selectedRows)}
                  className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold hover:border-slate-300 disabled:opacity-50 ${tone}`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-auto text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
            >
              Clear selection
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="w-10 pl-4 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAll}
                    aria-label="Select all articles on this page"
                    className="w-4 h-4 accent-brand-600"
                  />
                </th>
                {COLUMNS.map((col) => {
                  const active = sort === col.key;
                  const SortIcon = active ? (order === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                  return (
                    <th
                      key={col.key}
                      className={`px-3 py-3 font-bold ${col.className || ''}`}
                      aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={`inline-flex items-center gap-1 uppercase hover:text-slate-900 dark:hover:text-slate-100 ${
                          active ? 'text-brand-700 dark:text-brand-400' : ''
                        }`}
                      >
                        {col.label}
                        <SortIcon className={`w-3 h-3 ${active ? '' : 'opacity-40'}`} />
                      </button>
                    </th>
                  );
                })}
                <th className="px-3 py-3 font-bold hidden 2xl:table-cell">SEO</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={loading && rows.length ? 'opacity-60 transition-opacity' : ''}>
              {loading && rows.length === 0 &&
                [0, 1, 2, 3, 4].map((i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                    <td colSpan={COLUMNS.length + 3} className="px-4 py-4">
                      <div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    </td>
                  </tr>
                ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 3} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    {hasFilters ? 'No articles match these filters.' : 'No articles yet. Use New article to write one.'}
                  </td>
                </tr>
              )}

              {rows.map((row) => {
                const seo = calculateSeoHealth(row);
                const rowActions = (['submit', 'publish', 'returnToDraft', 'unpublish'] as WorkflowAction[]).filter((a) =>
                  allowed(row, a)
                );
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                      selected.has(row.id) ? 'bg-brand-50/60 dark:bg-brand-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="pl-4 py-3 align-top">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        aria-label={`Select ${row.title}`}
                        className="w-4 h-4 mt-0.5 accent-brand-600"
                      />
                    </td>
                    <td className="px-3 py-3 align-top min-w-[10rem] sm:min-w-[14rem] max-w-md">
                      {row.actions?.edit ? (
                        <button
                          type="button"
                          onClick={() => onEdit(row.id)}
                          className="font-serif font-bold text-[15px] leading-snug text-left text-ink dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-2"
                        >
                          {row.title}
                        </button>
                      ) : (
                        <span className="font-serif font-bold text-[15px] leading-snug text-ink dark:text-slate-100 line-clamp-2">{row.title}</span>
                      )}
                      <div className="text-xs text-slate-400 font-mono line-clamp-1 break-all mt-0.5">/{row.slug}</div>
                      <div className="sm:hidden mt-1.5">
                        <StatusBadge status={row.status} />
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top hidden sm:table-cell">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-3 align-top hidden md:table-cell text-slate-600 dark:text-slate-300">
                      {row.category_name}
                    </td>
                    <td className="px-3 py-3 align-top hidden lg:table-cell text-slate-600 dark:text-slate-300">
                      {row.author_name}
                    </td>
                    <td className="px-3 py-3 align-top hidden sm:table-cell text-right tabular-nums text-slate-600 dark:text-slate-300">
                      {number.format(row.views_count || 0)}
                    </td>
                    <td className="px-3 py-3 align-top hidden 2xl:table-cell text-right tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {row.reading_time} min
                    </td>
                    <td className="px-3 py-3 align-top hidden md:table-cell text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(row.updated_at || row.created_at)}
                    </td>
                    <td className="px-3 py-3 align-top hidden 2xl:table-cell">
                      <span
                        title={`SEO health ${seo.score}%`}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          seo.status === 'green'
                            ? 'text-brand-700 dark:text-brand-400'
                            : seo.status === 'yellow'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            seo.status === 'green' ? 'bg-brand-500' : seo.status === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                        />
                        {seo.score}%
                      </span>
                    </td>
                    <td className="pl-1 pr-3 sm:px-4 py-3 align-top">
                      <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                        {rowActions.map((action) => {
                          const { label, icon: Icon, tone } = WORKFLOW[action];
                          return (
                            <button
                              key={action}
                              type="button"
                              disabled={busy}
                              onClick={() => run(action, [row])}
                              title={label}
                              aria-label={`${label}: ${row.title}`}
                              className={`inline-flex items-center gap-1 h-8 px-2 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 ${tone}`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="hidden 2xl:inline whitespace-nowrap">{label}</span>
                            </button>
                          );
                        })}
                        {row.actions?.edit && (
                          <button
                            type="button"
                            onClick={() => onEdit(row.id)}
                            title="Edit"
                            aria-label={`Edit ${row.title}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {row.actions?.delete && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => run('delete', [row])}
                            title="Delete"
                            aria-label={`Delete ${row.title}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {meta && (
          <div className="border-t border-slate-100 dark:border-slate-800">
            <TablePagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          </div>
        )}
      </div>
    </div>
  );
};
