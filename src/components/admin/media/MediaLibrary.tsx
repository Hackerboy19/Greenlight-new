import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import type { MediaItem } from '../../../types';
import { TablePagination } from '../articles/TablePagination';
import { MediaDetails } from './MediaDetails';
import { MediaDropzone } from './MediaDropzone';
import { MediaGrid } from './MediaGrid';
import { deleteMediaItem, fetchMedia } from './mediaApi';

export interface MediaLibraryProps {
  canUpload: boolean;
  canDelete: boolean;
  /** Picker mode: shows a "use this image" button. */
  onPick?: (item: MediaItem) => void;
  pickLabel?: string;
  onNotice?: (message: string) => void;
}

/** Upload, browse, describe and delete images. Also the body of the image picker. */
export const MediaLibrary: React.FC<MediaLibraryProps> = ({ canUpload, canDelete, onPick, pickLabel, onNotice }) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 24, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const load = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const body = await fetchMedia({ page, limit, search });
      if (request !== latest.current) return;
      setItems(body.data);
      setMeta(body.meta);
    } catch (err) {
      if (request === latest.current) setError(err instanceof Error ? err.message : 'The media library could not load.');
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUploaded = (item: MediaItem) => {
    // Show new uploads first without waiting for a reload, and select the latest.
    setItems((prev) => [item, ...prev.filter((p) => p.id !== item.id)].slice(0, limit));
    setMeta((m) => ({ ...m, total: m.total + 1 }));
    setSelected(item);
  };

  const handleDelete = async (item: MediaItem) => {
    if (!window.confirm(`Delete ${item.file_name}? Articles that use it will show a broken image.`)) return;
    try {
      await deleteMediaItem(item.id);
      setSelected(null);
      onNotice?.('Image deleted.');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-5">
      <div className="space-y-4 min-w-0">
        {canUpload && <MediaDropzone onUploaded={handleUploaded} compact={Boolean(onPick)} />}

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by file name, alt text or caption"
            aria-label="Search images"
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
          />
        </div>

        {error && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
            <span>{error}</span>
            <button type="button" onClick={load} className="inline-flex items-center gap-1 font-semibold hover:underline shrink-0">
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </button>
          </div>
        )}

        <MediaGrid
          items={items}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          onActivate={onPick}
          loading={loading}
        />

        {meta.total > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800">
            <TablePagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
              pageSizes={[24, 48, 96]}
            />
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-20 self-start rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        {selected ? (
          <MediaDetails
            item={selected}
            onSaved={(saved) => {
              setSelected(saved);
              setItems((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
            }}
            onDelete={canDelete ? handleDelete : undefined}
            onPick={onPick}
            pickLabel={pickLabel}
          />
        ) : (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {onPick ? 'Select an image to use it.' : 'Select an image to see its details and add alt text.'}
          </p>
        )}
      </aside>
    </div>
  );
};
