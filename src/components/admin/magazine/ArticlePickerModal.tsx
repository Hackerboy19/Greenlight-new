import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Search, X } from 'lucide-react';
import type { Article } from '../../../types';
import { authFetch } from '../../../utils/adminAuth';
import { buttonClass } from '../ui';

export interface ArticlePickerModalProps {
  open: boolean;
  /** Resolves once the chosen articles have been added, so the button can show progress. */
  onAdd: (articles: Article[]) => Promise<void>;
  onClose: () => void;
}

/** Lists published blog articles to turn into magazine pages, in the order they are ticked. */
export const ArticlePickerModal: React.FC<ArticlePickerModalProps> = ({ open, onAdd, onClose }) => {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [chosen, setChosen] = useState<Article['id'][]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!open) return;
    setChosen([]);
    setSearch('');
    setError(null);
    authFetch('/api/admin/articles?status=published&limit=100&sort=published_at&order=desc')
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(body?.data)) throw new Error(body?.message || `Articles could not load (${res.status}).`);
        setArticles(body.data);
      })
      .catch((err) => setError(err.message));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !adding && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, adding, onClose]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (articles || []).filter((a) => !q || [a.title, a.category_name].join(' ').toLowerCase().includes(q));
  }, [articles, search]);

  if (!open) return null;

  const toggle = (id: Article['id']) => setChosen((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const add = async () => {
    const byId = new Map((articles || []).map((a) => [a.id, a]));
    setAdding(true);
    try {
      await onAdd(chosen.map((id) => byId.get(id)!).filter(Boolean));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs"
      onMouseDown={(e) => e.target === e.currentTarget && !adding && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add blog articles"
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Turn blog articles into pages</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Each article becomes its photo with the headline, then text pages. They are added in the order you tick them.
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={adding} aria-label="Close" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:border-brand-500">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search published articles"
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none"
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {error ? (
            <p className="py-8 text-center text-sm text-red-700 dark:text-red-400">{error}</p>
          ) : articles === null ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading articles…
            </div>
          ) : shown.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No published articles match.</p>
          ) : (
            <ul className="space-y-2">
              {shown.map((a) => {
                const order = chosen.indexOf(a.id);
                const picked = order !== -1;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => toggle(a.id)}
                      aria-pressed={picked}
                      className={`w-full flex items-center gap-3 p-2 rounded-2xl border text-left transition-all ${
                        picked
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                          : 'border-slate-200 dark:border-slate-800 hover:border-brand-500/50'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          picked ? 'bg-brand-600 text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {picked ? order + 1 : ''}
                      </span>
                      <div className="w-16 h-12 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {a.featured_image && <img src={a.featured_image} alt="" loading="lazy" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-400 truncate">{a.category_name}</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">{a.title}</div>
                      </div>
                      {picked && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500">{chosen.length ? `${chosen.length} selected` : 'Tick one or more articles'}</span>
          <button type="button" onClick={add} disabled={!chosen.length || adding} className={buttonClass('primary', 'sm')}>
            {adding && <Loader2 className="w-4 h-4 animate-spin" />}
            {adding ? 'Adding…' : `Add ${chosen.length || ''} article${chosen.length === 1 ? '' : 's'}`.replace('  ', ' ')}
          </button>
        </div>
      </div>
    </div>
  );
};
