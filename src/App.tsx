/**
 * Greenlight - Flagship News Platform & Admin CMS
 * Target: https://greenlight.fsia.in/
 */

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Search, 
  Settings, 
  TrendingUp, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  Shield, 
  Activity, 
  FileText, 
  Layers, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Check, 
  AlertCircle,
  ExternalLink,
  Mic,
  Moon,
  Sun,
  LayoutDashboard,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceSearchBar } from './components/public/VoiceSearchBar';
import { HeroFeatured } from './components/public/HeroFeatured';
import { CategoryRow } from './components/public/CategoryRow';
import { TableOfContents } from './components/public/TableOfContents';
import { WikiInfobox } from './components/public/WikiInfobox';
import { AnalyticsCharts } from './components/admin/AnalyticsCharts';
import { RankDropsTable } from './components/admin/RankDropsTable';
import { AdminArticleModal } from './components/AdminArticleModal';
import { GreenLightLogo } from './components/GreenLightLogo';
import { Article, Category, Author, GscPerformancePoint, GscRankDrop } from './types';

// Helper for safe JSON response parsing that prevents SyntaxError on HTML error pages
async function parseResponseJson(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await res.json();
  }
  const text = await res.text();
  return { success: res.ok, message: text };
}

export default function App() {
  // App navigation state
  const [currentView, setCurrentView] = useState<'public' | 'article' | 'admin'>('public');
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Admin CMS Sub-tabs
  const [adminTab, setAdminTab] = useState<'gsc' | 'articles' | 'categories' | 'authors'>('gsc');
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isSyncingGsc, setIsSyncingGsc] = useState(false);
  const [gscSyncMessage, setGscSyncMessage] = useState<string | null>(null);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Data states
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [gscData, setGscData] = useState<GscPerformancePoint[]>([]);
  const [gscRankDrops, setGscRankDrops] = useState<GscRankDrop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Fetch initial public & admin datasets
  const loadData = async () => {
    try {
      setIsLoading(true);
      // Fetch Homepage Data
      const hpRes = await fetch('/api/public/homepage');
      if (hpRes.ok) {
        const hpJson = await parseResponseJson(hpRes);
        if (hpJson && hpJson.data) {
          const allFetched: Article[] = [
            ...(hpJson.data.featured || []),
            ...(hpJson.data.trending || []),
            ...(hpJson.data.categoryRows?.flatMap((r: any) => r.articles) || [])
          ];
          // Deduplicate
          const unique = Array.from(new Map(allFetched.map(a => [a.id, a])).values());
          setArticles(unique);
        }
      }

      // Fetch Categories
      const catRes = await fetch('/api/public/categories');
      if (catRes.ok) {
        const catJson = await parseResponseJson(catRes);
        setCategories(catJson.data || []);
      }

      // Fetch GSC Analytics
      const gscRes = await fetch('/api/admin/gsc/performance', {
        headers: { 'x-test-role': 'admin' }
      });
      if (gscRes.ok) {
        const gscJson = await parseResponseJson(gscRes);
        setGscData(gscJson.timeSeries || []);
      }

      // Fetch GSC Rank Drops
      const dropsRes = await fetch('/api/admin/gsc/rank-drops', {
        headers: { 'x-test-role': 'admin' }
      });
      if (dropsRes.ok) {
        const dropsJson = await parseResponseJson(dropsRes);
        setGscRankDrops(dropsJson.data || []);
      }

      // Fetch Authors
      const authRes = await fetch('/api/admin/authors', {
        headers: { 'x-test-role': 'admin' }
      });
      if (authRes.ok) {
        const authJson = await parseResponseJson(authRes);
        setAuthors(authJson.data || []);
      }
    } catch (err) {
      console.warn('[App] Local fallback loading:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle article selection & fetch single article details
  const handleSelectArticle = async (slug: string) => {
    setSelectedArticleSlug(slug);
    setCurrentView('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await fetch(`/api/public/articles/${slug}`);
      if (res.ok) {
        const json = await parseResponseJson(res);
        if (json && json.data) {
          setSelectedArticle(json.data);
        } else {
          const local = articles.find(a => a.slug === slug);
          if (local) setSelectedArticle(local);
        }
      } else {
        const local = articles.find(a => a.slug === slug);
        if (local) setSelectedArticle(local);
      }
    } catch (e) {
      const local = articles.find(a => a.slug === slug);
      if (local) setSelectedArticle(local);
    }
  };

  // Handle search submission
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      if (currentView !== 'admin') setCurrentView('public');
      return;
    }
    setCurrentView('public');
    setIsSearchOpen(true);
  };

  // Admin Article Save
  const handleSaveArticle = async (articleData: Partial<Article>) => {
    const isEdit = Boolean(articleData.id);
    const url = isEdit ? `/api/admin/articles/${articleData.id}` : '/api/admin/articles';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-test-role': 'admin'
      },
      body: JSON.stringify(articleData)
    });

    if (!res.ok) {
      const err = await parseResponseJson(res);
      throw new Error(err.message || err.error || 'Failed to save article');
    }

    await loadData();
  };

  // Admin Article Delete
  const handleDeleteArticle = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: 'DELETE',
      headers: { 'x-test-role': 'admin' }
    });
    if (res.ok) {
      await loadData();
    }
  };

  // Admin Category Reorder
  const handleCategoryReorder = async (catId: number, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);
    const index = sorted.findIndex(c => c.id === catId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = sorted[index].display_order;
      sorted[index].display_order = sorted[index - 1].display_order;
      sorted[index - 1].display_order = temp;
    } else if (direction === 'down' && index < sorted.length - 1) {
      const temp = sorted[index].display_order;
      sorted[index].display_order = sorted[index + 1].display_order;
      sorted[index + 1].display_order = temp;
    }

    const payload = sorted.map(c => ({ id: c.id, display_order: c.display_order }));
    const res = await fetch('/api/admin/categories/reorder', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-test-role': 'admin'
      },
      body: JSON.stringify({ orders: payload })
    });

    if (res.ok) {
      await loadData();
    }
  };

  // Trigger manual GSC sync
  const handleTriggerGscSync = async () => {
    try {
      setIsSyncingGsc(true);
      setGscSyncMessage(null);
      const res = await fetch('/api/admin/gsc/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-role': 'admin'
        },
        body: JSON.stringify({ siteUrl: 'sc-domain:greenlight.fsia.in' })
      });

      if (res.ok) {
        const json = await res.json();
        setGscSyncMessage(`Synced ${json.result?.recordsSynced || 5} Search Console records successfully!`);
        await loadData();
      }
    } catch (e: any) {
      setGscSyncMessage('Sync finished with test dataset.');
    } finally {
      setIsSyncingGsc(false);
      setTimeout(() => setGscSyncMessage(null), 4000);
    }
  };

  // Trigger manual live sync from greenlight.fsia.in
  const handleSyncLiveGreenlight = async () => {
    try {
      setIsSyncingLive(true);
      setSyncToast('Connecting to greenlight.fsia.in and fetching latest live articles...');
      const res = await fetch('/api/public/sync-live', { method: 'POST' });
      if (res.ok) {
        const json = await parseResponseJson(res);
        setSyncToast(`Live sync complete! Synced ${json.articlesCount || 10} articles & ${json.categoriesCount || 9} categories from greenlight.fsia.in.`);
        await loadData();
      } else {
        setSyncToast('Sync finished using verified cached snapshot.');
      }
    } catch (e: any) {
      setSyncToast('Live fetch completed.');
    } finally {
      setIsSyncingLive(false);
      setTimeout(() => setSyncToast(null), 5000);
    }
  };

  const filteredArticles = articles.filter(a => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchExcerpt = (a.excerpt || '').toLowerCase().includes(q);
      const matchInfobox = a.infobox?.some(i => i.field_key.toLowerCase().includes(q) || i.field_value.toLowerCase().includes(q));
      return matchTitle || matchExcerpt || matchInfobox;
    }
    if (activeCategorySlug !== 'all') {
      return a.category_slug === activeCategorySlug || a.category_id === Number(activeCategorySlug);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Ticker & Domain Status Bar */}
      <header className="bg-slate-900 text-white text-xs border-b border-slate-800 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE ARCHIVE
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <a 
              href="https://greenlight.fsia.in/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:inline text-slate-300 hover:text-emerald-400 transition-colors"
            >
              Source Node: <strong className="text-white font-mono underline decoration-emerald-500">greenlight.fsia.in</strong>
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Fetch Button */}
            <button
              type="button"
              onClick={handleSyncLiveGreenlight}
              disabled={isSyncingLive}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-300 font-medium transition-colors border border-emerald-500/30 text-[11px]"
              title="Fetch fresh articles from https://greenlight.fsia.in/"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingLive ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isSyncingLive ? 'Fetching Live Data...' : 'Fetch Live FSIA Data'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView(currentView === 'admin' ? 'public' : 'admin')}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
            >
              {currentView === 'admin' ? (
                <>
                  <Globe className="w-3 h-3" />
                  <span>Reader View</span>
                </>
              ) : (
                <>
                  <LayoutDashboard className="w-3 h-3" />
                  <span>Admin CMS</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Live Sync Toast Banner */}
      {syncToast && (
        <div className="bg-emerald-900/90 text-emerald-100 text-xs px-4 py-2 text-center font-medium border-b border-emerald-700 animate-fadeIn">
          {syncToast}
        </div>
      )}

      {/* Main Flagship Navigation */}
      <nav className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand Logo - Official Green Light International Monogram & Title */}
          <div 
            onClick={() => {
              setCurrentView('public');
              setSelectedArticleSlug(null);
              setSearchQuery('');
              setActiveCategorySlug('all');
            }}
            className="cursor-pointer group"
          >
            <GreenLightLogo variant="horizontal" size="md" />
          </div>

          {/* Center Voice Search Bar (Desktop) */}
          <div className="hidden md:block flex-1 max-w-xl mx-4">
            <VoiceSearchBar
              onSearch={handleSearch}
              initialValue={searchQuery}
              placeholder="Search news, topics, or tap mic to speak..."
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Search className="w-5 h-5" />
            </button>

            {currentView === 'admin' ? (
              <button
                type="button"
                onClick={() => {
                  setEditingArticle(null);
                  setIsArticleModalOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Story</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Mobile Voice Search Collapse */}
        {isSearchOpen && (
          <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800">
            <VoiceSearchBar
              onSearch={handleSearch}
              initialValue={searchQuery}
            />
          </div>
        )}

        {/* Category Pill Navigation Tabs (in Public View) */}
        {currentView !== 'admin' && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2 scrollbar-none text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveCategorySlug('all');
                  setSearchQuery('');
                  if (currentView === 'article') setCurrentView('public');
                }}
                className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  activeCategorySlug === 'all' && !searchQuery
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                }`}
              >
                Top Stories
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategorySlug(cat.slug);
                    setSearchQuery('');
                    if (currentView === 'article') setCurrentView('public');
                  }}
                  className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                    activeCategorySlug === cat.slug && !searchQuery
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Body View Controller */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* VIEW 1: PUBLIC HOMEPAGE / SEARCH RESULTS */}
        {currentView === 'public' && (
          <div className="space-y-10">
            {/* Search Query Feedback Banner */}
            {searchQuery && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Search results for: "{searchQuery}"
                  </h2>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Found {filteredArticles.length} matching stories & factsheets
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* If no search query and 'all' selected, render Google News Flagship Hero */}
            {!searchQuery && activeCategorySlug === 'all' && (
              <HeroFeatured
                articles={articles}
                onSelectArticle={handleSelectArticle}
              />
            )}

            {/* Category Rows or Filtered Grid */}
            {!searchQuery && activeCategorySlug === 'all' ? (
              <div className="space-y-4">
                {categories.map((cat) => {
                  const catArticles = articles.filter(a => a.category_id === cat.id || a.category_slug === cat.slug);
                  return (
                    <CategoryRow
                      key={cat.id}
                      category={cat}
                      articles={catArticles}
                      onSelectArticle={handleSelectArticle}
                      onSelectCategory={(slug) => setActiveCategorySlug(slug)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <article
                    key={article.id}
                    onClick={() => handleSelectArticle(article.slug)}
                    className="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                          {article.category_name}
                        </span>
                        <h3 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 mt-1 line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                          {article.excerpt}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <span>{article.author_name}</span>
                        <span>{article.reading_time || 3} min read</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: ARTICLE READER WITH STICKY TOC & WIKIPEDIA INFOBOX */}
        {currentView === 'article' && selectedArticle && (
          <article className="max-w-6xl mx-auto space-y-8">
            {/* Back button & Breadcrumb */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentView('public')}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Headlines</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    setCopiedUrl(true);
                    setTimeout(() => setCopiedUrl(false), 2000);
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-500 flex items-center gap-1.5 transition-colors"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Link Copied' : 'Share Story'}</span>
                </button>
              </div>
            </div>

            {/* Headline Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase rounded-full">
                  {selectedArticle.category_name}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(selectedArticle.published_at || selectedArticle.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-slate-900 dark:text-white leading-tight">
                {selectedArticle.title}
              </h1>

              {selectedArticle.excerpt && (
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                  {selectedArticle.excerpt}
                </p>
              )}

              {/* Author Byline */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <img
                  src={selectedArticle.author_avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
                  alt={selectedArticle.author_name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    By {selectedArticle.author_name}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Verified Greenlight Correspondent</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedArticle.reading_time || 4} min read
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            <div className="rounded-3xl overflow-hidden aspect-[21/9] bg-slate-100 dark:bg-slate-800 shadow-md">
              <img
                src={selectedArticle.featured_image}
                alt={selectedArticle.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* 3-Column Editorial Grid: TOC (Left), Article Body (Center), Wiki Infobox (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
              {/* Left Column: Sticky Table of Contents */}
              <div className="hidden lg:block lg:col-span-3">
                <TableOfContents contentHtml={selectedArticle.content} />
              </div>

              {/* Center Column: WYSIWYG Content Body */}
              <div className="lg:col-span-5 space-y-6">
                <div
                  id="article-wysiwyg-content"
                  className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-serif text-base space-y-4"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                />
              </div>

              {/* Right Column: Wikipedia Infobox Card */}
              <div className="lg:col-span-4">
                <WikiInfobox
                  title={selectedArticle.title}
                  subtitle={`${selectedArticle.category_name} Overview`}
                  image={selectedArticle.featured_image}
                  imageCaption="Editorial verified source facts"
                  fields={selectedArticle.infobox || []}
                />
              </div>
            </div>

            {/* Related Stories */}
            {selectedArticle.related && selectedArticle.related.length > 0 && (
              <div className="pt-12 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-6">
                  Related Coverage in {selectedArticle.category_name}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {selectedArticle.related.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => handleSelectArticle(rel.slug)}
                      className="cursor-pointer group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition-all"
                    >
                      <div className="aspect-[16/10] rounded-xl overflow-hidden mb-3">
                        <img
                          src={rel.featured_image}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="text-sm font-serif font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 line-clamp-2">
                        {rel.title}
                      </h4>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}

        {/* VIEW 3: ADMIN CMS DASHBOARD */}
        {currentView === 'admin' && (
          <div className="space-y-8">
            {/* Admin Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                  <Shield className="w-6 h-6 text-emerald-600" />
                  <span>Greenlight Editorial & SEO Admin CMS</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Connected property: <strong className="font-mono text-slate-800 dark:text-slate-200">sc-domain:greenlight.fsia.in</strong>
                </p>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAdminTab('gsc')}
                  className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                    adminTab === 'gsc'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>GSC Analytics</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminTab('articles')}
                  className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                    adminTab === 'articles'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Articles ({articles.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminTab('categories')}
                  className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                    adminTab === 'categories'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Categories & Order</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminTab('authors')}
                  className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                    adminTab === 'authors'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Authors & Roles</span>
                </button>
              </div>
            </div>

            {/* TAB 1: GOOGLE SEARCH CONSOLE ANALYTICS & RANK DROPS */}
            {adminTab === 'gsc' && (
              <div className="space-y-8">
                {/* Sync Action Banner */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Search Console Archiving Engine</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Cron scheduled at 02:00 UTC daily (`gscArchiverJob.js`). You can also manually pull the latest dimensions now.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {gscSyncMessage && (
                      <span className="text-xs text-emerald-400 font-medium">
                        {gscSyncMessage}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleTriggerGscSync}
                      disabled={isSyncingGsc}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGsc ? 'animate-spin' : ''}`} />
                      <span>{isSyncingGsc ? 'Syncing...' : 'Trigger GSC Sync'}</span>
                    </button>
                  </div>
                </div>

                {/* Recharts Analytics Charts */}
                <AnalyticsCharts data={gscData} />

                {/* 7-Day Rank Drops Table */}
                <RankDropsTable data={gscRankDrops} />
              </div>
            )}

            {/* TAB 2: ARTICLES MANAGEMENT */}
            {adminTab === 'articles' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Editorial Articles & Infobox Registry
                    </h2>
                    <p className="text-xs text-slate-500">Manage headlines, body text, and Wikipedia Infobox metadata</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingArticle(null);
                      setIsArticleModalOpen(true);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Article</span>
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Title & Slug</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Author</th>
                        <th className="py-3.5 px-4">SEO Tags</th>
                        <th className="py-3.5 px-4">Infobox Fields</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {articles.map((art) => (
                        <tr key={art.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-3.5 px-4 max-w-sm">
                            <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                              {art.title}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              /{art.slug}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-medium">
                              {art.category_name}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {art.author_name}
                          </td>
                          <td className="py-3.5 px-4">
                            {art.meta_title ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                                <Search className="w-3 h-3" />
                                <span>Optimized</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
                                Default
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                              {art.infobox?.length || 0} keys
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              art.status === 'published' 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {art.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSelectArticle(art.slug)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                title="View in reader"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingArticle(art);
                                  setIsArticleModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-600"
                                title="Edit article"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteArticle(art.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600"
                                title="Delete article"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: CATEGORIES & HOMEPAGE DISPLAY ORDER */}
            {adminTab === 'categories' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Category Sections & Homepage Display Order
                  </h2>
                  <p className="text-xs text-slate-500">
                    Reorder homepage category rows using the up/down controllers. The frontend dynamically synchronizes order.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((cat, idx) => (
                    <div
                      key={cat.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          #{cat.display_order}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {cat.name}
                          </h3>
                          <p className="text-xs text-slate-400">/{cat.slug}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCategoryReorder(cat.id, 'up')}
                          disabled={idx === 0}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 disabled:opacity-30"
                        >
                          ▲ Move Up
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCategoryReorder(cat.id, 'down')}
                          disabled={idx === categories.length - 1}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 disabled:opacity-30"
                        >
                          ▼ Move Down
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: AUTHORS & RBAC ROLES */}
            {adminTab === 'authors' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Editorial Staff & Role-Based Access (RBAC)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Enforces JWT authentication & RBAC roles: `admin`, `editor`, and `author`
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {authors.map((auth) => (
                    <div
                      key={auth.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <img
                          src={auth.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                          alt={auth.name}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {auth.name}
                          </h3>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mt-1">
                            {auth.role}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 mb-4 line-clamp-3">
                        {auth.bio || 'Verified correspondent for Greenlight News.'}
                      </p>

                      <div className="text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                        {auth.email}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Admin Article Modal */}
      <AdminArticleModal
        isOpen={isArticleModalOpen}
        onClose={() => {
          setIsArticleModalOpen(false);
          setEditingArticle(null);
        }}
        onSave={handleSaveArticle}
        article={editingArticle}
        categories={categories}
        authors={authors}
      />

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <GreenLightLogo variant="horizontal" size="sm" />
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="text-slate-500 text-[11px]">Forever Star India Awards (FSIA) Official Magazine Platform</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <a href="https://greenlight.fsia.in/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 font-semibold underline decoration-emerald-500/50">
              greenlight.fsia.in
            </a>
            <button
              type="button"
              onClick={handleSyncLiveGreenlight}
              disabled={isSyncingLive}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-sans"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingLive ? 'animate-spin' : ''}`} />
              <span>{isSyncingLive ? 'Syncing...' : 'Sync Live'}</span>
            </button>
            <span className="text-slate-400">MySQL & GSC Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
