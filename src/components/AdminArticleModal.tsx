/**
 * Admin Article Create / Edit Modal
 * Integrates Article details, WYSIWYG preview, SEO Meta Tags (meta_title, meta_description), and Wikipedia Infobox Builder
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Sparkles, 
  Image, 
  Check, 
  AlertCircle, 
  FileText, 
  Globe, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Copy
} from 'lucide-react';
import { Article, Category, Author, InfoboxItem } from '../types';
import { InfoboxBuilder } from './admin/InfoboxBuilder';

export interface AdminArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (articleData: Partial<Article>) => Promise<void>;
  article?: Article | null;
  categories: Category[];
  authors: Author[];
}

export const AdminArticleModal: React.FC<AdminArticleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  article,
  categories = [],
  authors = []
}) => {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [authorId, setAuthorId] = useState<number>(authors[0]?.id || 1);
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [infobox, setInfobox] = useState<InfoboxItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const defaultCatId = categories[0]?.id || 1;
    const defaultAuthId = authors[0]?.id || 1;

    if (article) {
      setTitle(article.title || '');
      setExcerpt(article.excerpt || '');
      setContent(article.content || '');
      setFeaturedImage(article.featured_image || '');
      setMetaTitle(article.meta_title || article.title || '');
      setMetaDescription(article.meta_description || article.excerpt || '');
      setCategoryId(article.category_id || defaultCatId);
      setAuthorId(article.author_id || defaultAuthId);
      setStatus(article.status || 'published');
      setIsFeatured(Boolean(article.is_featured));
      setInfobox(article.infobox || []);
    } else {
      setTitle('');
      setExcerpt('');
      setContent('<h2>Key Developments</h2><p>Provide verified reporting and context here...</p><h3>Implications</h3><p>Analysis of immediate and long-term systemic impact.</p>');
      setFeaturedImage('https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80');
      setMetaTitle('');
      setMetaDescription('');
      setCategoryId(defaultCatId);
      setAuthorId(defaultAuthId);
      setStatus('published');
      setIsFeatured(false);
      setInfobox([
        { section: 'Overview', field_key: 'Topic Domain', field_value: 'National Policy' },
        { section: 'Overview', field_key: 'Primary Sector', field_value: 'Infrastructure' }
      ]);
    }
    setError(null);
  }, [article, categories, authors, isOpen]);

  if (!isOpen) return null;

  // Helpers for SEO auto-sync
  const handleAutoFillMetaTitle = () => {
    if (title.trim()) {
      setMetaTitle(`${title.trim()} | Greenlight FSIA`);
    }
  };

  const handleAutoFillMetaDescription = () => {
    if (excerpt.trim()) {
      setMetaDescription(excerpt.trim().slice(0, 160));
    } else if (content.trim()) {
      const stripped = content.replace(/<[^>]*>?/gm, '').trim();
      setMetaDescription(stripped.slice(0, 155));
    }
  };

  // SEO Score calculation helpers
  const titleLength = metaTitle.length;
  const descLength = metaDescription.length;

  const getTitleStatus = () => {
    if (titleLength === 0) return { label: 'Empty', color: 'text-slate-400 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800' };
    if (titleLength >= 35 && titleLength <= 65) return { label: 'Optimal (35-65)', color: 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50' };
    if (titleLength > 65) return { label: 'Too Long (>65)', color: 'text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50' };
    return { label: 'Short (<35)', color: 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50' };
  };

  const getDescStatus = () => {
    if (descLength === 0) return { label: 'Empty', color: 'text-slate-400 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800' };
    if (descLength >= 120 && descLength <= 160) return { label: 'Optimal (120-160)', color: 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50' };
    if (descLength > 160) return { label: 'Too Long (>160)', color: 'text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50' };
    return { label: 'Short (<120)', color: 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50' };
  };

  const titleStatus = getTitleStatus();
  const descStatus = getDescStatus();

  // Generated slug for snippet preview
  const previewSlug = article?.slug || (title ? title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').slice(0, 50) : 'headline-slug');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Article title and main body content are required.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        id: article?.id,
        title,
        excerpt,
        content,
        featured_image: featuredImage,
        meta_title: metaTitle.trim() || title,
        meta_description: metaDescription.trim() || excerpt,
        category_id: Number(categoryId) || 1,
        author_id: Number(authorId) || 1,
        status,
        is_featured: isFeatured ? 1 : 0,
        infobox
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save article.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="admin-article-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div id="admin-article-modal-container" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {article ? 'Edit Editorial Article & SEO' : 'Draft New Article & SEO'}
              </h2>
              <p className="text-xs text-slate-500">Greenlight CMS Publication Suite & Search Engine Metadata</p>
            </div>
          </div>
          <button
            type="button"
            id="admin-article-modal-close-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Headline Title *
            </label>
            <input
              type="text"
              id="article-headline-input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Forever Star India Awards Season 5 in Jaipur: A Grand Celebration"
              className="w-full text-base font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Category
              </label>
              <select
                id="article-category-select"
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value) || 1)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                ) : (
                  <option value={1}>General (Editorial)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Author Byline
              </label>
              <select
                id="article-author-select"
                value={authorId}
                onChange={(e) => setAuthorId(Number(e.target.value) || 1)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              >
                {authors.length > 0 ? (
                  authors.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                  ))
                ) : (
                  <option value={1}>Editorial Staff (Editor)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Publication Status
              </label>
              <select
                id="article-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  id="article-featured-checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span>Hero Spotlight Story</span>
              </label>
            </div>
          </div>

          {/* Featured Image URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Featured Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                id="article-featured-image-input"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              />
              {featuredImage && (
                <div className="w-10 h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <img src={featuredImage} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Short Deck / Excerpt (Lead Summary)
            </label>
            <textarea
              rows={2}
              id="article-excerpt-input"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief 1-2 sentence overview for Google News preview and social cards..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          {/* ========================================================================= */}
          {/* SEARCH ENGINE OPTIMIZATION (SEO) & SEARCH CONSOLE TAGS SECTION */}
          {/* ========================================================================= */}
          <div id="article-seo-settings-panel" className="p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 dark:border-emerald-900/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    Search Engine Optimization (SEO) & Meta Tags
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Configure Google Search titles, snippet descriptions, and SERP CTR optimization
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-500 font-mono">Domain: greenlight.fsia.in</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Meta Title Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="article-meta-title-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>SEO Meta Title (<code className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">meta_title</code>)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="meta-title-autofill-btn"
                      onClick={handleAutoFillMetaTitle}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-generate from Headline</span>
                    </button>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${titleStatus.color}`}>
                      {titleLength} / 60 chars ({titleStatus.label})
                    </span>
                  </div>
                </div>
                <input
                  type="text"
                  id="article-meta-title-input"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="e.g. Forever Star India Awards Season 5 | FSIA Jaipur Gala"
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Optimal length: 50-60 characters. Appears as the clickable blue title in Google search results.
                </p>
              </div>

              {/* Meta Description Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="article-meta-description-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>SEO Meta Description (<code className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">meta_description</code>)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="meta-desc-autofill-btn"
                      onClick={handleAutoFillMetaDescription}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-fill from Excerpt</span>
                    </button>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${descStatus.color}`}>
                      {descLength} / 160 chars ({descStatus.label})
                    </span>
                  </div>
                </div>
                <textarea
                  rows={3}
                  id="article-meta-description-input"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="e.g. Discover Forever Star India Awards (FSIA) Season 5 in Jaipur — bringing together 400+ national awardees, celebrity runways, and grassroots champions."
                  className="w-full text-xs font-normal px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Optimal length: 120-160 characters. Persuades searchers to click through to read the full story.
                </p>
              </div>

              {/* Real-time Google SERP Snippet Preview */}
              <div className="pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Google Search Live Snippet Preview (SERP)</span>
                </div>
                <div id="google-serp-preview-card" className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm space-y-1.5">
                  {/* Google site info line */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      G
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-medium text-slate-900 dark:text-slate-100 leading-none">Greenlight FSIA</span>
                      <span className="text-[11px] text-slate-500 font-mono truncate max-w-sm">
                        https://greenlight.fsia.in › article › {previewSlug}
                      </span>
                    </div>
                  </div>

                  {/* Google Blue Link Title */}
                  <h4 className="text-base sm:text-lg font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer leading-snug pt-0.5 line-clamp-1">
                    {metaTitle || title || 'Greenlight Editorial Headline - Forever Star India Awards'}
                  </h4>

                  {/* Google snippet description text */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {metaDescription || excerpt || 'Read the full in-depth editorial coverage, factsheet infobox, and verified awards recognition reporting on Greenlight FSIA.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Article HTML Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Article Content (WYSIWYG HTML) *
            </label>
            <textarea
              rows={6}
              id="article-content-html-input"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<h2>Heading 2</h2><p>Article body paragraphs...</p><blockquote>Notable quote</blockquote>"
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Infobox Builder */}
          <div className="pt-2">
            <InfoboxBuilder
              articleTitle={title || 'Article Factsheet'}
              initialFields={infobox}
              onChange={(newFields) => setInfobox(newFields)}
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <button
            type="button"
            id="admin-article-modal-cancel-btn"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            id="admin-article-modal-save-btn"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save & Publish Article'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminArticleModal;
