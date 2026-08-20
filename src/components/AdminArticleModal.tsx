/**
 * Admin Article Create / Edit Modal
 * Integrates Article details, WYSIWYG preview, SEO Meta Tags (meta_title, meta_description), and Wikipedia Infobox Builder
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Sparkles, 
  Image as ImageIcon, 
  Check, 
  AlertCircle, 
  FileText, 
  Globe, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Layers,
  Sparkle,
  BookOpen,
  Share2,
  ExternalLink,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Article, Category, Author, InfoboxItem } from '../types';
import { InfoboxBuilder } from './admin/InfoboxBuilder';
import { WysiwygEditor } from './admin/WysiwygEditor';

export interface AdminArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (articleData: Partial<Article>) => Promise<void>;
  article?: Article | null;
  categories: Category[];
  authors: Author[];
}

const STOCK_IMAGE_PRESETS = [
  { label: 'FSIA Awards Gala', url: 'https://greenlight.fsia.in/assets/img/blog/1774683990.png' },
  { label: 'Luxury Hotel', url: 'https://greenlight.fsia.in/assets/img/blog/1775463112.png' },
  { label: 'Dining & Cuisine', url: 'https://greenlight.fsia.in/assets/img/blog/1775467932.png' },
  { label: 'Entrepreneurs', url: 'https://greenlight.fsia.in/assets/img/blog/1775118343.png' },
  { label: 'Family Travel', url: 'https://greenlight.fsia.in/assets/img/blog/1779098256.png' },
  { label: 'Skincare & Beauty', url: 'https://greenlight.fsia.in/assets/img/blog/1774854130.png' },
];

export const AdminArticleModal: React.FC<AdminArticleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  article,
  categories = [],
  authors = []
}) => {
  const [modalTab, setModalTab] = useState<'content' | 'seo' | 'infobox'>('content');
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [previewTab, setPreviewTab] = useState<'google' | 'social' | 'twitter' | 'whatsapp'>('google');
  const [copiedTags, setCopiedTags] = useState(false);
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
      setOgImage(article.og_image || article.featured_image || '');
      setCategoryId(article.category_id || defaultCatId);
      setAuthorId(article.author_id || defaultAuthId);
      setStatus(article.status || 'published');
      setIsFeatured(Boolean(article.is_featured));
      setInfobox(article.infobox || []);
    } else {
      setTitle('');
      setExcerpt('');
      setContent('<h2>Key Developments</h2><p>Forever Star India Awards continues to set new national benchmarks for recognizing trailblazers across fashion, industry, and social innovation.</p><h3>National Impact & Reach</h3><p>Connecting awardees across 28 states with direct media broadcasting and verified knowledge credentials.</p>');
      const defaultImg = 'https://greenlight.fsia.in/assets/img/blog/1774683990.png';
      setFeaturedImage(defaultImg);
      setMetaTitle('');
      setMetaDescription('');
      setOgImage(defaultImg);
      setCategoryId(defaultCatId);
      setAuthorId(defaultAuthId);
      setStatus('published');
      setIsFeatured(false);
      setInfobox([
        { section: 'Overview', field_key: 'Topic Domain', field_value: 'National Talent & Media' },
        { section: 'Overview', field_key: 'Primary Sector', field_value: 'Recognition & Awards' }
      ]);
    }
    setModalTab('content');
    setError(null);
  }, [article, categories, authors, isOpen]);

  if (!isOpen) return null;

  // Helpers for SEO auto-sync
  const handleAutoFillMetaTitle = () => {
    if (title.trim()) {
      setMetaTitle(`${title.trim()} | Greenlight FSIA Official`);
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

  const handleSyncOgImageFromFeatured = () => {
    if (featuredImage.trim()) {
      setOgImage(featuredImage.trim());
    }
  };

  // SEO Score calculation helpers
  const titleLength = metaTitle.length;
  const descLength = metaDescription.length;
  const activeOgImage = ogImage.trim() || featuredImage.trim();

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
  const previewSlug = article?.slug || (title ? title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').slice(0, 50) : 'editorial-headline-slug');
  const canonicalUrl = `https://greenlight.fsia.in/article/${previewSlug}`;

  // Generated HTML Meta Tags for Developer Copy
  const generatedMetaTags = `<!-- Primary Meta Tags -->
<title>${metaTitle || title || 'Greenlight FSIA Official Story'}</title>
<meta name="title" content="${metaTitle || title || ''}">
<meta name="description" content="${metaDescription || excerpt || ''}">
<link rel="canonical" href="${canonicalUrl}">

<!-- Open Graph / Facebook / LinkedIn / WhatsApp -->
<meta property="og:type" content="article">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:title" content="${metaTitle || title || ''}">
<meta property="og:description" content="${metaDescription || excerpt || ''}">
<meta property="og:image" content="${activeOgImage}">
<meta property="og:site_name" content="Greenlight FSIA News Platform">

<!-- Twitter Cards -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${canonicalUrl}">
<meta property="twitter:title" content="${metaTitle || title || ''}">
<meta property="twitter:description" content="${metaDescription || excerpt || ''}">
<meta property="twitter:image" content="${activeOgImage}">`;

  const handleCopyMetaTags = () => {
    navigator.clipboard.writeText(generatedMetaTags);
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Article title and main story content are required.');
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
        og_image: ogImage.trim() || featuredImage,
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
    <div id="admin-article-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div id="admin-article-modal-container" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                {article ? 'Edit Story & Search Optimization' : 'Create New Editorial Story'}
              </h2>
              <p className="text-xs text-slate-500">Non-technical visual editor • SEO metadata • Wikipedia factsheet</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="admin-article-modal-close-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Responsive Auto-Adjusting Step Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60 p-2 sm:p-2.5">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => setModalTab('content')}
              className={`min-h-[44px] px-2 sm:px-3 py-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs font-bold ${
                modalTab === 'content'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">1. Content</span>
                <span className="hidden sm:inline md:hidden">1. Content & Story</span>
                <span className="hidden md:inline">1. Story & Main Content</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setModalTab('seo')}
              className={`min-h-[44px] px-2 sm:px-3 py-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs font-bold ${
                modalTab === 'seo'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">2. SEO &amp; OG</span>
                <span className="hidden sm:inline md:hidden">2. SEO &amp; Social</span>
                <span className="hidden md:inline">2. Google SEO &amp; Open Graph</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setModalTab('infobox')}
              className={`min-h-[44px] px-2 sm:px-3 py-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs font-bold ${
                modalTab === 'infobox'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className="truncate flex items-center gap-1">
                <span className="sm:hidden">3. Factsheet</span>
                <span className="hidden sm:inline md:hidden">3. Factsheet</span>
                <span className="hidden md:inline">3. Wikipedia Factsheet</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  modalTab === 'infobox' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {infobox.length}
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: STORY AND CONTENT */}
          {modalTab === 'content' && (
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Headline Title *
                </label>
                <input
                  type="text"
                  id="article-headline-input"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Forever Star India Awards Season 5 in Jaipur: A Grand Celebration"
                  className="w-full text-base font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Publication Settings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Category Section
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
                    Publish Status
                  </label>
                  <select
                    id="article-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="published">Published (Live Online)</option>
                    <option value="draft">Draft (Saved in Admin)</option>
                    <option value="archived">Archived (Unlisted)</option>
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
                    <span>Spotlight in Hero Bar</span>
                  </label>
                </div>
              </div>

              {/* Featured Cover Image */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Featured Cover Image
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    id="article-featured-image-input"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="https://greenlight.fsia.in/assets/img/blog/..."
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                  />
                  {featuredImage && (
                    <div className="w-12 h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                      <img src={featuredImage} alt="Cover Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* 1-Click Quick Preset Covers */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-2">
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">Quick presets:</span>
                  {STOCK_IMAGE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFeaturedImage(preset.url)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-600 dark:text-slate-300 hover:text-emerald-700 border border-slate-200/80 dark:border-slate-700 whitespace-nowrap"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lead Deck / Excerpt */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Short Lead Summary (Appears on Homepage cards & Google Discover)
                </label>
                <textarea
                  rows={2}
                  id="article-excerpt-input"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A concise 1-2 sentence lead overview of this story..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              {/* Visual WYSIWYG Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>Story Body (Visual Rich Text Editor) *</span>
                  </label>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✨ Type and format visually — no coding required
                  </span>
                </div>
                <WysiwygEditor
                  value={content}
                  onChange={(newHtml) => setContent(newHtml)}
                />
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE SEO & OPEN GRAPH SOCIAL METADATA */}
          {modalTab === 'seo' && (
            <div id="article-seo-settings-panel" className="space-y-6">
              {/* Header Overview Card */}
              <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 dark:border-emerald-900/40 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>Search Visibility & Open Graph Metadata</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                          SEO & Social
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Configure Meta Title, Meta Description, and Open Graph Share Image (<code className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300">og:image</code>) for Google Search, Discover, and social sharing.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                      greenlight.fsia.in
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyMetaTags}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                      title="Copy raw HTML meta tags to clipboard"
                    >
                      {copiedTags ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      <span>{copiedTags ? 'Tags Copied!' : 'Copy HTML Tags'}</span>
                    </button>
                  </div>
                </div>

                {/* Readiness Score Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Meta Title:</span>
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded-full border ${titleStatus.color}`}>
                      {titleLength}/60 ({titleStatus.label})
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Meta Description:</span>
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded-full border ${descStatus.color}`}>
                      {descLength}/160 ({descStatus.label})
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Open Graph Image:</span>
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded-full border ${
                      activeOgImage ? 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50' : 'text-amber-700 border-amber-200 bg-amber-50'
                    }`}>
                      {activeOgImage ? 'Configured (1200x630)' : 'Missing (Default)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 1: META TITLE & META DESCRIPTION */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    1. Search Engine Snippet Metadata
                  </h4>
                </div>

                {/* Meta Title Field */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                    <label htmlFor="article-meta-title-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>Meta Title</span>
                      <code className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                        &lt;meta name="title"&gt; &amp; &lt;meta property="og:title"&gt;
                      </code>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="meta-title-autofill-btn"
                        onClick={handleAutoFillMetaTitle}
                        className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Auto-fill from Headline</span>
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
                    placeholder="e.g. Forever Star India Awards Season 5 in Jaipur | FSIA Official Gala"
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Google displays the first 50–60 characters. Keep primary brand keywords like "Forever Star India Awards" or the subject name near the beginning.
                  </p>
                </div>

                {/* Meta Description Field */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                    <label htmlFor="article-meta-description-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>Meta Description</span>
                      <code className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                        &lt;meta name="description"&gt; &amp; &lt;meta property="og:description"&gt;
                      </code>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="meta-desc-autofill-btn"
                        onClick={handleAutoFillMetaDescription}
                        className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Auto-fill from Summary</span>
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
                    placeholder="e.g. In-depth coverage of Forever Star India Awards (FSIA) Season 5 in Jaipur — honoring nationwide talent, celebrity runways, and social impact leaders."
                    className="w-full text-xs font-normal px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Optimal length: 120–160 characters. A concise, engaging summary increases Google CTR and WhatsApp link preview clarity.
                  </p>
                </div>
              </div>

              {/* SECTION 2: OPEN GRAPH SHARE IMAGE (og:image) */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      2. Open Graph Share Image (<code className="font-mono text-emerald-600 lowercase font-normal">og:image</code>)
                    </h4>
                  </div>

                  <button
                    type="button"
                    id="sync-og-from-featured-btn"
                    onClick={handleSyncOgImageFromFeatured}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Copy from Featured Cover</span>
                  </button>
                </div>

                <div>
                  <label htmlFor="article-og-image-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Social Sharing Image URL
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="url"
                        id="article-og-image-input"
                        value={ogImage}
                        onChange={(e) => setOgImage(e.target.value)}
                        placeholder="https://greenlight.fsia.in/assets/img/blog/1774683990.png"
                        className="w-full text-xs font-mono pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Recommended resolution: <strong>1200 × 630 pixels</strong> (Aspect ratio 1.91:1). Used as the high-resolution hero thumbnail on Facebook, WhatsApp, LinkedIn, Twitter Cards, and Telegram.
                  </p>
                </div>

                {/* Stock Presets for Fast Open Graph Setup */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Quick Preset Share Images:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {STOCK_IMAGE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setOgImage(preset.url)}
                        className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                          ogImage === preset.url
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <ImageIcon className="w-3 h-3 text-slate-400" />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Open Graph Image Visual Preview Box */}
                {activeOgImage && (
                  <div className="pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Open Graph Image Preview</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
                        1200x630 px (1.91:1 Ratio)
                      </span>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 group max-h-48 flex items-center justify-center">
                      <img
                        src={activeOgImage}
                        alt="Open Graph share preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-48 object-cover group-hover:scale-102 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 flex flex-col justify-between p-3 pointer-events-none">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/60 text-white backdrop-blur-xs">
                            og:image
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                            Active
                          </span>
                        </div>
                        <div className="text-white">
                          <p className="text-xs font-bold line-clamp-1">{metaTitle || title || 'Story Title'}</p>
                          <p className="text-[10px] text-slate-300 font-mono">greenlight.fsia.in</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: MULTI-PLATFORM SERP & SOCIAL SHARING PREVIEWS */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      3. Live Social &amp; Search Simulator
                    </h4>
                  </div>

                  {/* Platform Switcher Pills */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('google')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        previewTab === 'google'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Google Search</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewTab('social')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        previewTab === 'social'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Facebook &amp; LinkedIn</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewTab('whatsapp')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        previewTab === 'whatsapp'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>WhatsApp Link</span>
                    </button>
                  </div>
                </div>

                {/* Google Search SERP Simulator */}
                {previewTab === 'google' && (
                  <div id="google-serp-preview-card" className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm space-y-2">
                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                        G
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-slate-900 dark:text-slate-100 leading-none">Greenlight FSIA Official</span>
                        <span className="text-[11px] text-slate-500 font-mono truncate max-w-sm sm:max-w-md">
                          https://greenlight.fsia.in › article › {previewSlug}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-base sm:text-lg font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer leading-snug pt-0.5 line-clamp-1">
                      {metaTitle || title || 'Greenlight Editorial Headline - Forever Star India Awards'}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {metaDescription || excerpt || 'Read verified in-depth reporting, editorial analysis, and factsheet credentials on Greenlight FSIA.'}
                    </p>
                  </div>
                )}

                {/* Facebook / LinkedIn Open Graph Simulator */}
                {previewTab === 'social' && (
                  <div id="facebook-og-preview-card" className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm max-w-lg">
                    {activeOgImage && (
                      <div className="w-full h-48 sm:h-56 bg-slate-900 overflow-hidden">
                        <img
                          src={activeOgImage}
                          alt="Open Graph share card"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-3.5 bg-slate-100/70 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                        GREENLIGHT.FSIA.IN
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {metaTitle || title || 'Forever Star India Awards - Greenlight FSIA'}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {metaDescription || excerpt || 'Official editorial coverage, verified factsheets, and recipient stories.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* WhatsApp Chat Preview Bubble */}
                {previewTab === 'whatsapp' && (
                  <div id="whatsapp-og-preview-card" className="p-3 bg-[#EFEAE2] dark:bg-slate-950 rounded-2xl max-w-md">
                    <div className="bg-white dark:bg-[#1F2C34] rounded-xl p-2 shadow-sm border border-black/5 dark:border-white/5 space-y-2">
                      {activeOgImage && (
                        <div className="w-full h-36 rounded-lg overflow-hidden bg-slate-900">
                          <img
                            src={activeOgImage}
                            alt="WhatsApp link preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="px-1 space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {metaTitle || title || 'Editorial Headline - Greenlight'}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                          {metaDescription || excerpt || 'Comprehensive coverage and official factsheet on greenlight.fsia.in'}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          greenlight.fsia.in
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: CANONICAL & ROBOTS DIRECTIVES */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Search Engine Directives &amp; Structured Schema</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                    index, follow, max-image-preview:large
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Canonical Target:</span>{' '}
                    <code className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 truncate inline-block max-w-full">
                      {canonicalUrl}
                    </code>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Schema.org Target:</span>{' '}
                    <span className="font-mono text-[10px]">NewsArticle + FactCheck + Organization</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WIKIPEDIA INFOBOX FACTSHEET */}
          {modalTab === 'infobox' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-slate-700 dark:text-slate-300">
                <strong className="text-emerald-800 dark:text-emerald-300 font-bold block mb-1">
                  About Wikipedia Factsheet Infoboxes:
                </strong>
                Structured facts appear in the right-hand sidebar for readers and enable Google Knowledge Graph panels. Use the quick presets below to add verified dates, venues, leadership, and stats in one click.
              </div>

              <InfoboxBuilder
                articleTitle={title || 'Article Factsheet'}
                initialFields={infobox}
                onChange={(newFields) => setInfobox(newFields)}
              />
            </div>
          )}
        </form>

        {/* Modal Footer with Step Navigator */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 bg-slate-50/70 dark:bg-slate-800/70">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="admin-article-modal-cancel-btn"
              onClick={onClose}
              className="min-h-[40px] px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            {modalTab !== 'content' && (
              <button
                type="button"
                onClick={() => setModalTab(modalTab === 'infobox' ? 'seo' : 'content')}
                className="min-h-[40px] px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Previous Step</span>
                <span className="sm:hidden">Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            {modalTab === 'content' && (
              <button
                type="button"
                onClick={() => setModalTab('seo')}
                className="min-h-[40px] px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span>Next: SEO &amp; Social (OG)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {modalTab === 'seo' && (
              <button
                type="button"
                onClick={() => setModalTab('infobox')}
                className="min-h-[40px] px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span>Next: Factsheet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              id="admin-article-modal-save-btn"
              onClick={handleSubmit}
              disabled={isSaving}
              className="min-h-[40px] px-4 sm:px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save & Publish'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminArticleModal;

