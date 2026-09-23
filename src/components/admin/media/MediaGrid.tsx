import React from 'react';
import { Check } from 'lucide-react';
import type { MediaItem } from '../../../types';

export interface MediaGridProps {
  items: MediaItem[];
  selectedId: number | null;
  onSelect: (item: MediaItem) => void;
  /** Double-click (or Enter) picks the image straight away in the picker. */
  onActivate?: (item: MediaItem) => void;
  loading?: boolean;
}

/** Square thumbnails of the library, newest first. */
export const MediaGrid: React.FC<MediaGridProps> = ({ items, selectedId, onSelect, onActivate, loading }) => {
  if (loading && items.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">No images yet. Upload some above.</p>;
  }
  return (
    <ul className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 ${loading ? 'opacity-60' : ''}`}>
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              onDoubleClick={() => onActivate?.(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onActivate) {
                  e.preventDefault();
                  onActivate(item);
                }
              }}
              aria-pressed={selected}
              aria-label={item.alt_text || item.file_name}
              title={item.alt_text || item.file_name}
              className={`group relative block w-full aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 transition ${
                selected ? 'ring-3 ring-brand-500' : 'hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600'
              }`}
            >
              <img src={item.url} alt="" loading="lazy" className="w-full h-full object-cover" />
              {selected && (
                <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shadow">
                  <Check className="w-4 h-4" />
                </span>
              )}
              {!item.alt_text && (
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-500/90 text-[10px] font-bold text-white">
                  No alt text
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
};
