import React, { useEffect, useState } from 'react';
import { Check, Copy, Trash2 } from 'lucide-react';
import type { MediaItem } from '../../../types';
import { absoluteMediaUrl, formatBytes, saveMediaDetails } from './mediaApi';

export interface MediaDetailsProps {
  item: MediaItem;
  onSaved: (item: MediaItem) => void;
  onDelete?: (item: MediaItem) => void;
  /** Shown in the picker: the button that uses this image. */
  pickLabel?: string;
  onPick?: (item: MediaItem) => void;
}

/** Preview, facts and editable alt text / caption / credit for one image. */
export const MediaDetails: React.FC<MediaDetailsProps> = ({ item, onSaved, onDelete, pickLabel, onPick }) => {
  const [alt, setAlt] = useState(item.alt_text);
  const [caption, setCaption] = useState(item.caption);
  const [credit, setCredit] = useState(item.credit);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setAlt(item.alt_text);
    setCaption(item.caption);
    setCredit(item.credit);
    setMessage(null);
  }, [item.id]);

  const dirty = alt !== item.alt_text || caption !== item.caption || credit !== item.credit;

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const saved = await saveMediaDetails(item.id, { alt_text: alt, caption, credit });
      onSaved(saved);
      setMessage('Saved.');
      return saved;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const field =
    'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500';

  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <img src={item.url} alt={alt} className="w-full max-h-64 object-contain" />
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-slate-500 dark:text-slate-400">Size</dt>
        <dd className="text-slate-800 dark:text-slate-200 tabular-nums">
          {item.width && item.height ? `${item.width} × ${item.height}px · ` : ''}
          {formatBytes(item.file_size)}
        </dd>
        <dt className="text-slate-500 dark:text-slate-400">Uploaded</dt>
        <dd className="text-slate-800 dark:text-slate-200">
          {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          {item.uploader_name ? ` by ${item.uploader_name}` : ''}
        </dd>
        <dt className="text-slate-500 dark:text-slate-400">File</dt>
        <dd className="text-slate-800 dark:text-slate-200 font-mono truncate" title={item.file_name}>
          {item.file_name}
        </dd>
      </dl>

      <label className="block">
        <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Alt text</span>
        <input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} placeholder="Describe the image for screen readers and Google" className={field} />
      </label>
      <label className="block">
        <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Caption</span>
        <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} className={field} />
      </label>
      <label className="block">
        <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Credit</span>
        <input value={credit} onChange={(e) => setCredit(e.target.value)} maxLength={200} placeholder="Photo: …" className={field} />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        {onPick && (
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              // Keep alt text typed here with the picked image.
              const latest = dirty ? await save() : item;
              if (latest) onPick(latest);
            }}
            className="h-9 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold disabled:opacity-50"
          >
            {pickLabel || 'Use this image'}
          </button>
        )}
        {dirty && (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={`h-9 px-4 rounded-xl text-sm font-bold disabled:opacity-50 ${
              onPick
                ? 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                : 'bg-brand-600 hover:bg-brand-500 text-white'
            }`}
          >
            {saving ? 'Saving…' : 'Save details'}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(absoluteMediaUrl(item.url));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-brand-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        )}
      </div>
      {message && <p className="text-xs text-slate-500 dark:text-slate-400">{message}</p>}
    </div>
  );
};
