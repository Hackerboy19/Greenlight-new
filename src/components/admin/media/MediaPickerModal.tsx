import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { MediaItem } from '../../../types';
import { MediaLibrary } from './MediaLibrary';

export interface MediaPickerModalProps {
  open: boolean;
  title?: string;
  pickLabel?: string;
  canUpload: boolean;
  onPick: (item: MediaItem) => void;
  onClose: () => void;
}

/** The media library in a dialog, for choosing an image while editing an article. */
export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({ open, title = 'Choose an image', pickLabel, canUpload, onPick, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-black text-slate-900 dark:text-slate-100">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <MediaLibrary canUpload={canUpload} canDelete={false} onPick={onPick} pickLabel={pickLabel} />
        </div>
      </div>
    </div>
  );
};
