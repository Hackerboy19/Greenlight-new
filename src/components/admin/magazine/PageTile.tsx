import React from 'react';
import { ChevronLeft, ChevronRight, GripVertical, Trash2, Type } from 'lucide-react';
import type { MagazinePage } from '../../../types';

export interface PageTileProps {
  page: MagazinePage;
  index: number;
  count: number;
  selected: boolean;
  dragging: boolean;
  dropTarget: boolean;
  onSelect: () => void;
  onMove: (to: number) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
}

/** One page in the builder's page grid: a thumbnail you can drag, move with the arrows, or remove. */
export const PageTile: React.FC<PageTileProps> = ({
  page,
  index,
  count,
  selected,
  dragging,
  dropTarget,
  onSelect,
  onMove,
  onRemove,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop
}) => {
  const label = index === 0 ? 'Cover' : `Page ${index + 1}`;
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
        onDragStart();
      }}
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={`group relative transition-all ${dragging ? 'opacity-40 scale-95' : ''} ${dropTarget ? 'translate-x-1' : ''}`}
    >
      {dropTarget && <span className="absolute -left-2 top-2 bottom-8 w-1 rounded-full bg-brand-500" aria-hidden="true" />}
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${label}: ${page.kind === 'image' ? 'image page' : page.heading || 'text page'}`}
        className={`relative block w-full aspect-[3/4] rounded-xl overflow-hidden border-2 bg-slate-100 dark:bg-slate-800 shadow-card transition-all cursor-grab active:cursor-grabbing ${
          selected
            ? 'border-brand-500 ring-4 ring-brand-500/20'
            : 'border-transparent hover:border-brand-500/40 hover:shadow-card-hover'
        }`}
      >
        {page.kind === 'image' && page.image_url ? (
          <img src={page.image_url} alt="" draggable={false} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#fbfaf7] p-2.5 text-left">
            <Type className="w-3.5 h-3.5 text-brand-600" />
            <div className="mt-1.5 font-serif text-[11px] font-bold leading-tight text-slate-900 line-clamp-3">{page.heading || 'Text page'}</div>
            <div className="mt-1 space-y-1" aria-hidden="true">
              {[90, 100, 80, 95, 70, 85].map((w, i) => (
                <div key={i} className="h-[3px] rounded bg-slate-200" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        )}
        <span className="absolute top-1.5 left-1.5 p-0.5 rounded bg-slate-950/50 text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
          <GripVertical className="w-3.5 h-3.5" />
        </span>
      </button>

      <div className="mt-1.5 flex items-center justify-between gap-1">
        <span className={`text-[11px] font-bold ${index === 0 ? 'text-brand-700 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400'}`}>{label}</span>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onMove(index - 1)}
            disabled={index === 0}
            className="p-1 rounded-md text-slate-500 hover:text-brand-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
            aria-label={`Move ${label} earlier`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index + 1)}
            disabled={index === count - 1}
            className="p-1 rounded-md text-slate-500 hover:text-brand-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
            aria-label={`Move ${label} later`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            aria-label={`Remove ${label}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </li>
  );
};
