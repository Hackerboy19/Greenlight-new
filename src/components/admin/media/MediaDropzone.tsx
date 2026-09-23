import React, { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, UploadCloud } from 'lucide-react';
import type { MediaItem } from '../../../types';
import { ACCEPTED_TYPES, MAX_UPLOAD_MB, rejectReason, uploadMediaFile } from './mediaApi';

interface UploadRow {
  key: string;
  name: string;
  progress: number;
  error?: string;
  done?: boolean;
}

export interface MediaDropzoneProps {
  onUploaded: (item: MediaItem) => void;
  compact?: boolean;
}

/** Drop images here or click to choose them. Uploads run one after another with progress. */
export const MediaDropzone: React.FC<MediaDropzoneProps> = ({ onUploaded, compact }) => {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rows, setRows] = useState<UploadRow[]>([]);

  const patch = (key: string, change: Partial<UploadRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...change } : r)));

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    const queued = list.map((file, i) => ({ file, row: { key: `${Date.now()}-${i}-${file.name}`, name: file.name, progress: 0 } }));
    setRows((prev) => [...queued.map((q) => q.row), ...prev].slice(0, 12));

    for (const { file, row } of queued) {
      const reason = rejectReason(file);
      if (reason) {
        patch(row.key, { error: reason });
        continue;
      }
      try {
        const item = await uploadMediaFile(file, (p) => patch(row.key, { progress: p }));
        patch(row.key, { progress: 1, done: true });
        onUploaded(item);
      } catch (err) {
        patch(row.key, { error: err instanceof Error ? err.message : 'Upload failed.' });
      }
    }
    // Clear finished rows after a moment; keep errors until the next upload.
    setTimeout(() => setRows((prev) => prev.filter((r) => !r.done)), 2500);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload images: drop files here or press Enter to choose"
        onClick={() => input.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            input.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors ${
          compact ? 'px-4 py-5' : 'px-6 py-10'
        } ${
          dragging
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
            : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 bg-slate-50/60 dark:bg-slate-800/30'
        }`}
      >
        <UploadCloud className={`text-brand-600 dark:text-brand-400 ${compact ? 'w-6 h-6' : 'w-9 h-9'}`} />
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {dragging ? 'Drop to upload' : 'Drag images here, or click to choose'}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">JPEG, PNG, WebP or GIF, up to {MAX_UPLOAD_MB} MB each</div>
        <input
          ref={input}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {rows.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center gap-2 text-xs">
              {row.error ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              ) : row.done ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-500" />
              ) : (
                <span className="w-4 h-4 shrink-0 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
              )}
              <span className="truncate max-w-[12rem] text-slate-700 dark:text-slate-200">{row.name}</span>
              {row.error ? (
                <span className="text-red-600 dark:text-red-400">{row.error}</span>
              ) : (
                <span className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <span className="block h-full bg-brand-500 transition-all" style={{ width: `${Math.round(row.progress * 100)}%` }} />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
