import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  ImagePlus,
  Images,
  Loader2,
  Save,
  Send,
  Trash2,
  Type,
  Upload,
  X
} from 'lucide-react';
import type { MagazineIssue, MagazinePage, MediaItem } from '../../../types';
import { Card, SectionHeading, buttonClass } from '../ui';
import { MediaPickerModal } from '../media/MediaPickerModal';
import { ACCEPTED_TYPES, rejectReason, uploadMediaFile } from '../media/mediaApi';
import { FlipbookViewer } from '../../magazine/FlipbookViewer';
import { PageTile } from './PageTile';
import { IssueDraft, createIssue, deleteIssue, saveIssue, setIssueStatus, slugify } from './magazineApi';
import { IssueStatusBadge } from './IssueStatusBadge';

const MAX_PAGES = 40;

const field =
  'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500';
const labelClass = 'block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1';

export interface IssueEditorProps {
  /** null for a new issue. */
  issue: MagazineIssue | null;
  canPublish: boolean;
  canUpload: boolean;
  canDeletePublished: boolean;
  onBack: () => void;
  onSaved: (issue: MagazineIssue) => void;
  onDeleted: () => void;
  onNotice: (message: string) => void;
}

function toDraft(issue: MagazineIssue | null): IssueDraft {
  return {
    title: issue?.title || '',
    slug: issue?.slug || '',
    issue_label: issue?.issue_label || '',
    description: issue?.description || '',
    pages: (issue?.pages || []).map(({ kind, image_url, alt_text, heading, body }) => ({ kind, image_url, alt_text, heading, body }))
  };
}

const naturalOrder = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/**
 * Builds one magazine issue: its details, and its pages in reading order.
 * Pages are images from the media library (or uploaded here, in file-name
 * order) and text pages. Preview opens the same flipbook readers get.
 */
export const IssueEditor: React.FC<IssueEditorProps> = ({
  issue: initialIssue,
  canPublish,
  canUpload,
  canDeletePublished,
  onBack,
  onSaved,
  onDeleted,
  onNotice
}) => {
  const [issue, setIssue] = useState<MagazineIssue | null>(initialIssue);
  const [draft, setDraft] = useState<IssueDraft>(() => toDraft(initialIssue));
  const [saved, setSaved] = useState<string>(() => JSON.stringify(toDraft(initialIssue)));
  // The address follows the title until someone edits it by hand.
  const [slugTouched, setSlugTouched] = useState(Boolean(initialIssue));
  const [selected, setSelected] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [fileDropActive, setFileDropActive] = useState(false);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState<null | 'save' | 'publish' | 'delete'>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(draft) !== saved;
  const pages = draft.pages;
  const status = issue?.status || 'draft';

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [dirty]);

  const update = (fields: Partial<IssueDraft>) => setDraft((d) => ({ ...d, ...fields }));
  const setPages = (fn: (pages: MagazinePage[]) => MagazinePage[]) => setDraft((d) => ({ ...d, pages: fn(d.pages) }));

  const addPages = (added: MagazinePage[]) => {
    const room = MAX_PAGES - pages.length;
    if (room <= 0) {
      setError(`An issue can have at most ${MAX_PAGES} pages.`);
      return;
    }
    if (added.length > room) setError(`Only ${room} more page${room === 1 ? '' : 's'} fit; the rest were left out.`);
    setPages((list) => [...list, ...added.slice(0, room)]);
    setSelected(pages.length);
  };

  const movePage = (from: number, to: number) => {
    if (to < 0 || to >= pages.length || from === to) return;
    setPages((list) => {
      const next = list.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setSelected(to);
  };

  const removePage = (index: number) => {
    setPages((list) => list.filter((_, i) => i !== index));
    setSelected(null);
  };

  const updatePage = (index: number, fields: Partial<MagazinePage>) =>
    setPages((list) => list.map((p, i) => (i === index ? { ...p, ...fields } : p)));

  /** Uploads images one at a time, in file-name order, and adds them as pages. */
  const uploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).sort((a, b) => naturalOrder.compare(a.name, b.name));
    const rejected = files.map((f) => ({ f, reason: rejectReason(f) })).filter((r) => r.reason);
    const ok = files.filter((f) => !rejectReason(f)).slice(0, Math.max(0, MAX_PAGES - pages.length));
    if (rejected.length) setError(`${rejected[0].f.name}: ${rejected[0].reason}`);
    if (!ok.length) return;
    setUploading({ done: 0, total: ok.length });
    const added: MagazinePage[] = [];
    for (const file of ok) {
      try {
        const item = await uploadMediaFile(file);
        added.push({ kind: 'image', image_url: item.url, alt_text: item.alt_text, heading: '', body: '' });
      } catch (err) {
        setError(`${file.name}: ${err instanceof Error ? err.message : 'upload failed'}`);
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUploading(null);
    if (added.length) addPages(added);
  };

  const pickFromLibrary = (item: MediaItem) => {
    setPickerOpen(false);
    addPages([{ kind: 'image', image_url: item.url, alt_text: item.alt_text, heading: '', body: '' }]);
  };

  const addTextPage = () => addPages([{ kind: 'text', image_url: null, alt_text: '', heading: '', body: '' }]);

  const persist = async (): Promise<MagazineIssue | null> => {
    const body: IssueDraft = { ...draft, slug: draft.slug || slugify(draft.title) };
    const result = issue ? await saveIssue(issue.id, body) : await createIssue(body);
    setIssue(result);
    const fresh = toDraft(result);
    setDraft(fresh);
    setSaved(JSON.stringify(fresh));
    setSlugTouched(true);
    onSaved(result);
    return result;
  };

  const run = async (kind: 'save' | 'publish', action: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  };

  const handleSave = () =>
    run('save', async () => {
      await persist();
      onNotice('Issue saved.');
    });

  const handleStatus = (next: MagazineIssue['status']) =>
    run('publish', async () => {
      let current = issue;
      if (!current || dirty) current = await persist();
      if (!current) return;
      const result = await setIssueStatus(current.id, next);
      setIssue(result);
      onSaved(result);
      onNotice(next === 'published' ? `"${result.title}" is live in the Magazine section.` : `"${result.title}" is hidden from readers.`);
    });

  const handleDelete = async () => {
    if (!issue) {
      onBack();
      return;
    }
    if (!window.confirm(`Delete "${issue.title}"? Its images stay in the media library.`)) return;
    setBusy('delete');
    try {
      await deleteIssue(issue.id);
      onNotice('Issue deleted.');
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The issue could not be deleted.');
      setBusy(null);
    }
  };

  const confirmBack = () => {
    if (dirty && !window.confirm('Leave without saving your changes?')) return;
    onBack();
  };

  const selectedPage = selected !== null ? pages[selected] : null;
  const previewPages = useMemo(() => pages.filter((p) => (p.kind === 'image' ? Boolean(p.image_url) : p.heading || p.body)), [pages]);
  const canDelete = !issue || issue.status === 'draft' || canDeletePublished;

  return (
    <div className="space-y-5">
      {/* Header: back, title, status and actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={confirmBack} className={buttonClass('secondary', 'sm')} aria-label="Back to all issues">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">All issues</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-ink dark:text-slate-100 truncate">{draft.title || 'New issue'}</h2>
              <IssueStatusBadge status={status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {pages.length} page{pages.length === 1 ? '' : 's'}
              {dirty ? ' · Unsaved changes' : issue ? ' · All changes saved' : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPreviewOpen(true)} disabled={!previewPages.length} className={buttonClass('secondary', 'sm')}>
            <BookOpen className="w-4 h-4" />
            Preview
          </button>
          <button type="button" onClick={handleSave} disabled={busy !== null || (!dirty && Boolean(issue))} className={buttonClass('secondary', 'sm')}>
            {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {status === 'published' ? 'Save changes' : 'Save draft'}
          </button>
          {canPublish &&
            (status === 'published' ? (
              <button type="button" onClick={() => handleStatus('draft')} disabled={busy !== null} className={buttonClass('secondary', 'sm')}>
                {busy === 'publish' ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
                Unpublish
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleStatus('published')}
                disabled={busy !== null || pages.length < 2}
                title={pages.length < 2 ? 'Add at least 2 pages first' : undefined}
                className={buttonClass('primary', 'sm')}
              >
                {busy === 'publish' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publish
              </button>
            ))}
          {issue?.status === 'published' && (
            <a href={`/magazine/${issue.slug}`} target="_blank" rel="noopener noreferrer" className={buttonClass('ghost', 'sm')}>
              <Eye className="w-4 h-4" />
              View live
            </a>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-2.5 text-sm text-red-800 dark:text-red-300">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss" className="shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Pages */}
        <Card className="lg:col-span-8 space-y-4">
          <SectionHeading
            level="h3"
            title="Pages"
            subtitle="The first page is the cover. Drag pages, or use the arrows, to change the order."
          />

          <div className="flex flex-wrap gap-2">
            {canUpload && (
              <>
                <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading !== null} className={buttonClass('primary', 'sm')}>
                  <Upload className="w-4 h-4" />
                  Upload pages
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept={ACCEPTED_TYPES.join(',')}
                  multiple
                  hidden
                  onChange={(e) => {
                    if (e.target.files?.length) uploadFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </>
            )}
            <button type="button" onClick={() => setPickerOpen(true)} className={buttonClass('secondary', 'sm')}>
              <Images className="w-4 h-4" />
              From media library
            </button>
            <button type="button" onClick={addTextPage} className={buttonClass('secondary', 'sm')}>
              <Type className="w-4 h-4" />
              Text page
            </button>
          </div>

          <div
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes('Files') && canUpload) {
                e.preventDefault();
                setFileDropActive(true);
              }
            }}
            onDragLeave={(e) => {
              if (e.currentTarget === e.target) setFileDropActive(false);
            }}
            onDrop={(e) => {
              if (e.dataTransfer.files.length && canUpload) {
                e.preventDefault();
                uploadFiles(e.dataTransfer.files);
              }
              setFileDropActive(false);
            }}
            className={`rounded-xl transition-colors ${fileDropActive ? 'bg-brand-50 dark:bg-brand-950/40 ring-2 ring-dashed ring-brand-500' : ''}`}
          >
            {pages.length === 0 && !uploading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                <ImagePlus className="w-8 h-8 text-brand-600" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Add the pages of this issue</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Drop page images here (they are added in file-name order, so name them page-01, page-02 …), pick them from the media library, or add text pages.
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 p-1">
                {pages.map((page, index) => (
                  <PageTile
                    key={`${index}-${page.kind}-${page.image_url || ''}`}
                    page={page}
                    index={index}
                    count={pages.length}
                    selected={selected === index}
                    dragging={dragFrom === index}
                    dropTarget={dragFrom !== null && dragOver === index && dragOver !== dragFrom}
                    onSelect={() => setSelected(index)}
                    onMove={(to) => movePage(index, to)}
                    onRemove={() => removePage(index)}
                    onDragStart={() => setDragFrom(index)}
                    onDragEnter={() => setDragOver(index)}
                    onDragEnd={() => {
                      setDragFrom(null);
                      setDragOver(null);
                    }}
                    onDrop={() => {
                      if (dragFrom !== null) movePage(dragFrom, index);
                      setDragFrom(null);
                      setDragOver(null);
                    }}
                  />
                ))}
                {uploading &&
                  Array.from({ length: uploading.total - uploading.done }).map((_, i) => (
                    <li key={`up-${i}`} className="aspect-[3/4] rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
                    </li>
                  ))}
              </ul>
            )}
          </div>
          {uploading && (
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-400" aria-live="polite">
              Uploading {uploading.done + 1} of {uploading.total}…
            </p>
          )}
        </Card>

        {/* Details and the selected page */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          <Card className="space-y-3.5">
            <SectionHeading level="h3" title="Issue details" />
            <label className="block">
              <span className={labelClass}>Title</span>
              <input
                value={draft.title}
                maxLength={200}
                placeholder="e.g. The Super Women Issue"
                onChange={(e) => update({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
                className={field}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Issue label</span>
              <input
                value={draft.issue_label}
                maxLength={80}
                placeholder="e.g. Issue 12 · October 2026"
                onChange={(e) => update({ issue_label: e.target.value })}
                className={field}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Web address</span>
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus-within:border-brand-500 overflow-hidden">
                <span className="pl-3 text-xs text-slate-500 whitespace-nowrap">/magazine/</span>
                <input
                  value={draft.slug}
                  maxLength={120}
                  onChange={(e) => {
                    setSlugTouched(true);
                    update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') });
                  }}
                  onBlur={() => update({ slug: slugify(draft.slug) })}
                  className="flex-1 min-w-0 px-1 py-2 bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </label>
            <label className="block">
              <span className={labelClass}>Short description</span>
              <textarea
                value={draft.description}
                maxLength={600}
                rows={3}
                placeholder="Shown above the flipbook and in Google results"
                onChange={(e) => update({ description: e.target.value })}
                className={`${field} resize-y`}
              />
            </label>
          </Card>

          {selectedPage && selected !== null && (
            <Card className="space-y-3.5">
              <SectionHeading level="h3" title={selected === 0 ? 'Cover' : `Page ${selected + 1}`} subtitle={selectedPage.kind === 'image' ? 'Image page' : 'Text page'} />
              {selectedPage.kind === 'image' ? (
                <>
                  {selectedPage.image_url && (
                    <img src={selectedPage.image_url} alt="" className="w-full max-h-56 object-contain rounded-xl bg-slate-100 dark:bg-slate-800" />
                  )}
                  <label className="block">
                    <span className={labelClass}>Describe this page</span>
                    <input
                      value={selectedPage.alt_text}
                      maxLength={300}
                      placeholder="For screen readers, e.g. Cover: Dr. Meera Shah on stage"
                      onChange={(e) => updatePage(selected, { alt_text: e.target.value })}
                      className={field}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="block">
                    <span className={labelClass}>Heading</span>
                    <input
                      value={selectedPage.heading}
                      maxLength={200}
                      onChange={(e) => updatePage(selected, { heading: e.target.value })}
                      className={field}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Text</span>
                    <textarea
                      value={selectedPage.body}
                      maxLength={6000}
                      rows={9}
                      placeholder="Leave an empty line between paragraphs."
                      onChange={(e) => updatePage(selected, { body: e.target.value })}
                      className={`${field} resize-y font-serif`}
                    />
                  </label>
                  <p className="text-[11px] text-slate-500">A page holds roughly 250 words; longer text is cut off at the page edge.</p>
                </>
              )}
            </Card>
          )}

          {canDelete && (
            <button type="button" onClick={handleDelete} disabled={busy !== null} className={buttonClass('ghost', 'sm', 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40')}>
              {busy === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {issue ? 'Delete issue' : 'Discard'}
            </button>
          )}
        </div>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        title="Add a page from the media library"
        pickLabel="Add as page"
        canUpload={canUpload}
        onPick={pickFromLibrary}
        onClose={() => setPickerOpen(false)}
      />

      {previewOpen && (
        <div
          className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-3 sm:p-8"
          onMouseDown={(e) => e.target === e.currentTarget && setPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Preview"
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-3 text-white">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-400">Preview · {status === 'published' ? 'published' : 'not published yet'}</div>
                <div className="font-serif text-lg font-bold">{draft.title || 'New issue'}</div>
              </div>
              <button type="button" onClick={() => setPreviewOpen(false)} className="p-2 rounded-full hover:bg-white/10" aria-label="Close preview">
                <X className="w-5 h-5" />
              </button>
            </div>
            <FlipbookViewer title={draft.title || 'Greenlight'} pages={previewPages} />
          </div>
        </div>
      )}
    </div>
  );
};
