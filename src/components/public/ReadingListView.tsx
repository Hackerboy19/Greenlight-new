/**
 * ReadingListView Component
 * Elegant 'My Reading List' view featuring light English editorial aesthetics,
 * local persistence metrics, reading time tally, category filters, and quick article actions.
 */

import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Clock,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Share2,
  BookOpen,
  Filter,
  Search,
  Sparkles,
  Check,
  CheckCircle2,
  ExternalLink,
  Layers
} from 'lucide-react';
import { Article } from '../../types';

interface ReadingListViewProps {
  bookmarkedIds: (string | number)[];
  articles: Article[];
  onSelectArticle: (slug: string) => void;
  onToggleBookmark: (articleId: string | number) => void;
  onClearReadingList: () => void;
  onBackToFeed: () => void;
  onOpenShareModal?: (article: Article) => void;
}

export const ReadingListView: React.FC<ReadingListViewProps> = ({
  bookmarkedIds,
  articles,
  onSelectArticle,
  onToggleBookmark,
  onClearReadingList,
  onBackToFeed,
  onOpenShareModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'time-asc' | 'time-desc' | 'title'>('recent');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copiedListToast, setCopiedListToast] = useState(false);

  // Filter articles that are currently in the reading list
  const savedArticles = useMemo(() => {
    return articles.filter(a => bookmarkedIds.includes(a.id));
  }, [articles, bookmarkedIds]);

  // Derive unique categories from saved articles
  const savedCategories = useMemo(() => {
    const cats = new Set<string>();
    savedArticles.forEach(a => {
      if (a.category_name) cats.add(a.category_name);
    });
    return Array.from(cats);
  }, [savedArticles]);

  // Filter and sort the saved articles
  const displayedArticles = useMemo(() => {
    let list = [...savedArticles];

    if (categoryFilter !== 'all') {
      list = list.filter(a => a.category_name === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        a =>
          a.title.toLowerCase().includes(q) ||
          (a.excerpt && a.excerpt.toLowerCase().includes(q)) ||
          (a.category_name && a.category_name.toLowerCase().includes(q)) ||
          (a.author_name && a.author_name.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'time-asc') {
      list.sort((a, b) => (a.reading_time || 3) - (b.reading_time || 3));
    } else if (sortBy === 'time-desc') {
      list.sort((a, b) => (b.reading_time || 3) - (a.reading_time || 3));
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Recent (order in bookmarkedIds reversed)
      list.sort((a, b) => {
        const idxA = bookmarkedIds.indexOf(a.id);
        const idxB = bookmarkedIds.indexOf(b.id);
        return idxB - idxA;
      });
    }

    return list;
  }, [savedArticles, categoryFilter, searchQuery, sortBy, bookmarkedIds]);

  // Aggregate stats
  const totalReadingTime = useMemo(() => {
    return savedArticles.reduce((sum, a) => sum + (a.reading_time || 3), 0);
  }, [savedArticles]);

  const handleCopyListSummary = () => {
    if (savedArticles.length === 0) return;
    const text = savedArticles
      .map((a, i) => `${i + 1}. ${a.title} (${a.reading_time || 3} min read) - ${a.category_name}`)
      .join('\n');
    navigator.clipboard?.writeText(
      `My Greenlight Reading List (${savedArticles.length} stories, ${totalReadingTime} mins total):\n\n${text}`
    );
    setCopiedListToast(true);
    setTimeout(() => setCopiedListToast(false), 2500);
  };

  return (
    <div id="my-reading-list-view" className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onBackToFeed}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Headlines</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs">
              <Bookmark className="w-5 h-5 fill-emerald-600 dark:fill-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 dark:text-slate-100 tracking-tight">
                My Reading List
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Your curated personal reading queue, stored locally in your browser for offline reading.
              </p>
            </div>
          </div>
        </div>

        {/* Global actions */}
        {savedArticles.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyListSummary}
              className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              title="Copy titles and links of your reading list to clipboard"
            >
              {copiedListToast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedListToast ? 'Summary Copied!' : 'Export List'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Clear All */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-serif">
                Clear entire reading list?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This will remove all {savedArticles.length} saved articles from your local storage. This action cannot be undone.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearReadingList();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Ribbon (Light English Tone) */}
      {savedArticles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Saved Stories
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
                {savedArticles.length}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {savedArticles.length === 1 ? 'article' : 'articles'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Reading Time
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {totalReadingTime}
              </span>
              <span className="text-xs text-slate-500">minutes</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Topics Covered
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
                {savedCategories.length}
              </span>
              <span className="text-xs text-slate-500">categories</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
              Storage Mode
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Offline Ready</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Sort Controls */}
      {savedArticles.length > 0 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </span>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                categoryFilter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All ({savedArticles.length})
            </button>
            {savedCategories.map(cat => {
              const count = savedArticles.filter(a => a.category_name === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search saved..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none font-medium cursor-pointer"
            >
              <option value="recent">Recently Saved</option>
              <option value="time-asc">Shortest Read</option>
              <option value="time-desc">Longest Read</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Articles List / Grid */}
      {displayedArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedArticles.map(article => (
            <article
              key={article.id}
              className="group flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-500/40 transition-all justify-between"
            >
              {/* Image & Quick Toggle */}
              <div 
                className="relative aspect-[16/10] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer"
                onClick={() => onSelectArticle(article.slug)}
              >
                <img
                  src={article.featured_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80'}
                  alt={article.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600/90 backdrop-blur-md text-white shadow-xs uppercase tracking-wider">
                    {article.category_name}
                  </span>
                </div>

                {/* Remove Bookmark Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(article.id);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-emerald-600 text-white shadow-md hover:bg-rose-600 transition-colors active:scale-90"
                  title="Remove from Reading List"
                  aria-label="Remove bookmark"
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>

                {/* Bottom reading time pill */}
                <div className="absolute bottom-2.5 left-3 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>{article.reading_time || 3} min read</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 
                    onClick={() => onSelectArticle(article.slug)}
                    className="text-base font-serif font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 cursor-pointer leading-snug"
                  >
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                {/* Infobox micro chips if present */}
                {article.infobox && article.infobox.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {article.infobox.slice(0, 2).map((info, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
                      >
                        <strong>{info.field_key}:</strong> {info.field_value}
                      </span>
                    ))}
                  </div>
                )}

                {/* Card Actions Row */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 truncate">
                    <span>By {article.author_name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onOpenShareModal && (
                      <button
                        type="button"
                        onClick={() => onOpenShareModal(article)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Share this story"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectArticle(article.slug)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 transition-colors active:scale-95"
                    >
                      <span>Read</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : savedArticles.length > 0 ? (
        // Search returned zero within saved articles
        <div className="p-12 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <Search className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No saved stories match your filter
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query "{searchQuery}" or selecting "All" categories.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        // Zero saved articles total: Clean Empty State
        <div className="p-10 sm:p-14 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200/60 dark:border-emerald-800 shadow-xs">
            <Bookmark className="w-8 h-8 stroke-[1.5]" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-serif font-black text-slate-900 dark:text-slate-100">
              Your Reading List is Empty
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Save stories as you browse the Greenlight news feed or read verified FSIA awards coverage. Tap the bookmark icon on any card or report to build your reading queue.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onBackToFeed}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Top Stories</span>
            </button>
          </div>

          {/* Recommended to Bookmark Preview */}
          {articles.length > 0 && (
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 text-left space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Recommended Stories to Save</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {articles.slice(0, 2).map(rec => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3 hover:border-emerald-300 transition-all"
                  >
                    <div 
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => onSelectArticle(rec.slug)}
                    >
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">
                        {rec.category_name}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {rec.title}
                      </h4>
                      <span className="text-[10px] text-slate-400">{rec.reading_time || 3} min read</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleBookmark(rec.id)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-700 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-slate-200 dark:border-slate-600 transition-all shadow-xs active:scale-90"
                      title="Add to Reading List"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
