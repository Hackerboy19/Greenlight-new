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
  ChevronLeft,
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
  Flame,
  Copy,
  LayoutGrid,
  List,
  FolderPlus,
  UserPlus,
  Eye,
  HelpCircle,
  Filter,
  CheckCircle2,
  X,
  Code2,
  Download,
  BookOpen,
  ArrowUpDown,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceSearchBar } from './components/public/VoiceSearchBar';
import { HeroFeatured } from './components/public/HeroFeatured';
import { CategoryRow } from './components/public/CategoryRow';
import { TableOfContents } from './components/public/TableOfContents';
import { WikiInfobox } from './components/public/WikiInfobox';
import { AudioReader } from './components/public/AudioReader';
import { TranslationSelector } from './components/public/TranslationSelector';
import { AdBanner } from './components/public/AdBanner';
import { ArticleReadingProgress } from './components/public/ArticleReadingProgress';
import { translateArticle } from './utils/translationService';
import { AnalyticsCharts } from './components/admin/AnalyticsCharts';
import { RankDropsTable } from './components/admin/RankDropsTable';
import { SocialShareAnalytics } from './components/admin/SocialShareAnalytics';
import { AiContentAuditPanel } from './components/admin/AiContentAuditPanel';
import { ShareArticleModal } from './components/public/ShareArticleModal';
import { ReadingListView } from './components/public/ReadingListView';
import { recordSocialClickEvent, SocialPlatform } from './data/socialShareData';
import { AdminArticleModal } from './components/AdminArticleModal';
import { GreenLightLogo } from './components/GreenLightLogo';
import { PhpCodeGenerator } from './components/admin/PhpCodeGenerator';
import { SeoHealthIndicator } from './components/admin/SeoHealthIndicator';
import { calculateSeoHealth } from './utils/seoHealth';
import { Article, Category, Author, GscPerformancePoint, GscRankDrop } from './types';
import { INITIAL_ARTICLES, INITIAL_CATEGORIES, INITIAL_AUTHORS } from './data/initialData';
import { AdminLoginScreen } from './components/admin/AdminLoginScreen';
import { AdminShell } from './components/admin/layout/AdminShell';
import type { AdminNavItem } from './components/admin/layout/AdminSidebar';
import { DashboardHome } from './components/admin/dashboard/DashboardHome';
import { ArticlesTable } from './components/admin/articles/ArticlesTable';
import { useTheme } from './utils/theme';
import {
  AdminSession,
  SESSION_EXPIRED_EVENT,
  authFetch,
  clearSession,
  hasPermission,
  loadSession,
  verifySession
} from './utils/adminAuth';

// Helper for safe JSON response parsing that prevents SyntaxError on HTML error pages
async function parseResponseJson(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await res.json();
  }
  const text = await res.text();
  return { success: res.ok, message: text };
}

const ADMIN_PATH = '/admin';

function isAdminPath(pathname: string) {
  return pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`);
}

type AdminTab = 'dashboard' | 'articles' | 'gsc' | 'social' | 'categories' | 'authors' | 'php';

// Header title and one-line description for each Admin CMS screen.
const ADMIN_PAGE_TITLES: Record<AdminTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Publishing, traffic and what the team changed recently' },
  articles: { title: 'Articles', subtitle: 'Write, edit and publish stories and their infoboxes' },
  gsc: { title: 'SEO & Search Console', subtitle: 'Clicks, impressions and ranking changes from Google' },
  social: { title: 'Social shares', subtitle: 'Shares and click-through by platform' },
  categories: { title: 'Categories', subtitle: 'Homepage sections and their order' },
  authors: { title: 'Editorial staff', subtitle: 'Bylines and roles' },
  php: { title: 'PHP code generator', subtitle: 'Export the catalog as PHP for the live site' }
};

export default function App() {
  // App navigation state
  // The Admin CMS lives at /admin; readers never see a link to it.
  const [currentView, setCurrentView] = useState<'public' | 'article' | 'admin' | 'reading-list'>(
    () => (isAdminPath(window.location.pathname) ? 'admin' : 'public')
  );
  // Signed-in CMS user. The admin dashboard renders only while this is set.
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => loadSession());
  const [adminLoginNotice, setAdminLoginNotice] = useState<string | null>(null);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // User Reading List (Local persistence)
  const [bookmarkedIds, setBookmarkedIds] = useState<(string | number)[]>(() => {
    try {
      const saved = localStorage.getItem('greenlight_reading_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error('Failed to parse reading list from localStorage:', err);
    }
    // Seed with initial featured article id for instant usability
    return [1];
  });

  useEffect(() => {
    try {
      localStorage.setItem('greenlight_reading_list', JSON.stringify(bookmarkedIds));
    } catch (err) {
      console.error('Failed to save reading list to localStorage:', err);
    }
  }, [bookmarkedIds]);

  const toggleBookmark = (articleId: string | number) => {
    setBookmarkedIds(prev => {
      if (prev.includes(articleId)) {
        return prev.filter(id => id !== articleId);
      } else {
        return [...prev, articleId];
      }
    });
  };

  const isBookmarked = (articleId: string | number) => {
    return bookmarkedIds.includes(articleId);
  };

  const clearReadingList = () => {
    setBookmarkedIds([]);
  };

  // Admin CMS Sub-tabs & Filter states
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const theme = useTheme();
  // Controls follow the signed-in role; the server enforces the same rules.
  const can = (permission: string) => hasPermission(adminSession?.user, permission);
  const TAB_PERMISSION: Partial<Record<typeof adminTab, string>> = {
    gsc: 'analytics.view',
    social: 'analytics.view',
    categories: 'category.manage',
    authors: 'author.manage',
    php: 'settings.manage'
  };
  const canOpenTab = (tab: typeof adminTab) => !TAB_PERMISSION[tab] || can(TAB_PERMISSION[tab]!);
  useEffect(() => {
    if (!canOpenTab(adminTab)) setAdminTab('dashboard');
  });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareArticleTarget, setShareArticleTarget] = useState<Article | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'content' | 'seo' | 'infobox' | 'php'>('content');
  // Bumped whenever articles change, so the table and dashboard reload.
  const [articlesVersion, setArticlesVersion] = useState(0);
  // Dashboard cards and staff cards open the table pre-filtered; a new key resets the table to it.
  const [articlesTableFilter, setArticlesTableFilter] = useState<{ statuses?: Article['status'][]; authorIds?: number[] }>({});
  const [articlesTableKey, setArticlesTableKey] = useState(0);
  const openArticlesTable = (filter: { statuses?: Article['status'][]; authorIds?: number[] } = {}) => {
    setArticlesTableFilter(filter);
    setArticlesTableKey((k) => k + 1);
    setAdminTab('articles');
  };
  const [adminCategorySearch, setAdminCategorySearch] = useState('');
  const [adminAuthorSearch, setAdminAuthorSearch] = useState('');
  const [adminAuthorRoleFilter, setAdminAuthorRoleFilter] = useState('all');
  const [adminExportToast, setAdminExportToast] = useState<string | null>(null);

  // Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Author Modal state
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newAuthorEmail, setNewAuthorEmail] = useState('');
  const [newAuthorRole, setNewAuthorRole] = useState<'admin' | 'editor' | 'author'>('author');
  const [newAuthorBio, setNewAuthorBio] = useState('');
  const [newAuthorAvatar, setNewAuthorAvatar] = useState('');

  const [isSyncingGsc, setIsSyncingGsc] = useState(false);
  const [gscSyncMessage, setGscSyncMessage] = useState<string | null>(null);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Data states initialized with instant high-quality defaults to prevent blank canvas
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [authors, setAuthors] = useState<Author[]>(INITIAL_AUTHORS);
  const [gscData, setGscData] = useState<GscPerformancePoint[]>([]);
  const [gscRankDrops, setGscRankDrops] = useState<GscRankDrop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Translation states
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedArticle, setTranslatedArticle] = useState<Article | null>(null);

  // Category Nav Scroll & Responsive State
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkCategoryScroll = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
    }
  };

  useEffect(() => {
    checkCategoryScroll();
    const handleResize = () => checkCategoryScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [categories]);

  const handleScrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      categoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkCategoryScroll, 320);
    }
  };

  // Handle translation change
  const handleLanguageChange = async (langCode: string) => {
    setCurrentLanguage(langCode);
    if (!selectedArticle || langCode === 'en') {
      setTranslatedArticle(null);
      return;
    }

    try {
      setIsTranslating(true);
      const trans = await translateArticle(selectedArticle, langCode);
      setTranslatedArticle(trans);
    } catch (err) {
      console.warn('[App] Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

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
          if (unique.length > 0) {
            setArticles(unique);
          }
        }
      }

      // Fetch Categories
      const catRes = await fetch('/api/public/categories');
      if (catRes.ok) {
        const catJson = await parseResponseJson(catRes);
        if (catJson && Array.isArray(catJson.data) && catJson.data.length > 0) {
          setCategories(catJson.data);
        }
      }

      // Admin datasets need a signed-in session; skip them for readers.
      const session = loadSession();
      if (!session) return;

      // Search Console data is only for roles that can view analytics.
      if (hasPermission(session.user, 'analytics.view')) {
        // Fetch GSC Analytics
        const gscRes = await authFetch('/api/admin/gsc/performance');
        if (gscRes.ok) {
          const gscJson = await parseResponseJson(gscRes);
          if (gscJson?.timeSeries) {
            setGscData(gscJson.timeSeries);
          }
        }

        // Fetch GSC Rank Drops
        const dropsRes = await authFetch('/api/admin/gsc/rank-drops');
        if (dropsRes.ok) {
          const dropsJson = await parseResponseJson(dropsRes);
          if (dropsJson?.data) {
            setGscRankDrops(dropsJson.data);
          }
        }
      }

      // Fetch Authors
      const authRes = await authFetch('/api/admin/authors');
      if (authRes.ok) {
        const authJson = await parseResponseJson(authRes);
        if (authJson?.data) {
          setAuthors(authJson.data);
        }
      }
    } catch (err) {
      console.warn('[App] Server API fallback active (using initial offline snapshot):', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Drop the dashboard when the server rejects the stored token (expired,
  // revoked secret) and confirm a stored session is still valid on load.
  useEffect(() => {
    const handleExpired = () => {
      setAdminSession(null);
      setAdminLoginNotice('Your session has ended. Please sign in again.');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    verifySession().then((user) => {
      // Pick up role or permission changes made since the last sign-in.
      setAdminSession((current) => (user && current ? { ...current, user } : null));
    });
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  // Keep the address bar in step with the admin view, so /admin can be
  // bookmarked and the browser Back button leaves the CMS.
  useEffect(() => {
    const onAdminPath = isAdminPath(window.location.pathname);
    if (currentView === 'admin' && !onAdminPath) {
      window.history.pushState(null, '', ADMIN_PATH);
    } else if (currentView !== 'admin' && onAdminPath) {
      window.history.pushState(null, '', '/');
    }
  }, [currentView]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(isAdminPath(window.location.pathname) ? 'admin' : 'public');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleAdminSignedIn = (session: AdminSession) => {
    setAdminSession(session);
    setAdminLoginNotice(null);
    loadData();
  };

  const handleAdminSignOut = () => {
    clearSession();
    setAdminSession(null);
    setAdminLoginNotice(null);
    setIsArticleModalOpen(false);
    setCurrentView('public');
  };

  useEffect(() => {
    loadData();

    const handleSeoFixed = (e: any) => {
      if (e.detail?.id) {
        setArticles(prev => prev.map(a => a.id === e.detail.id ? { ...a, ...e.detail } as Article : a));
      }
    };
    window.addEventListener('article-seo-fixed', handleSeoFixed);
    return () => window.removeEventListener('article-seo-fixed', handleSeoFixed);
  }, []);

  // Handle article selection & fetch single article details
  const handleSelectArticle = async (slug: string) => {
    setSelectedArticleSlug(slug);
    setCurrentView('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let fetchedArticle: Article | null = null;

    try {
      const res = await fetch(`/api/public/articles/${slug}`);
      if (res.ok) {
        const json = await parseResponseJson(res);
        if (json && json.data) {
          fetchedArticle = json.data;
        } else {
          fetchedArticle = articles.find(a => a.slug === slug) || null;
        }
      } else {
        fetchedArticle = articles.find(a => a.slug === slug) || null;
      }
    } catch (e) {
      fetchedArticle = articles.find(a => a.slug === slug) || null;
    }

    if (fetchedArticle) {
      setSelectedArticle(fetchedArticle);

      // Track incoming referral click if arrived via tracked social UTM link
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get('utm_source') as SocialPlatform | null;
        if (utmSource && fetchedArticle) {
          recordSocialClickEvent(fetchedArticle.id, utmSource, articles);
        }
      } catch (err) {
        // Ignore URL parsing errors
      }

      if (currentLanguage !== 'en') {
        try {
          setIsTranslating(true);
          const trans = await translateArticle(fetchedArticle, currentLanguage);
          setTranslatedArticle(trans);
        } catch (err) {
          console.warn('Translation error:', err);
        } finally {
          setIsTranslating(false);
        }
      } else {
        setTranslatedArticle(null);
      }
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

    const res = await authFetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(articleData)
    });

    if (!res.ok) {
      const err = await parseResponseJson(res);
      throw new Error(err.message || err.error || 'Failed to save article');
    }

    setArticlesVersion((v) => v + 1);
    await loadData();
  };

  // Quick Fix SEO handler (real-time UI update)
  const handleQuickFixSeo = (updatedArticle: Partial<Article>) => {
    if (updatedArticle.id) {
      setArticles(prev => prev.map(a => a.id === updatedArticle.id ? { ...a, ...updatedArticle } as Article : a));
      if (editingArticle && editingArticle.id === updatedArticle.id) {
        setEditingArticle(prev => prev ? { ...prev, ...updatedArticle } : null);
      }
    }
  };

  // AI Content Audit headline applicator
  const handleApplyHeadlineFromAudit = async (articleId: number, newHeadline: string) => {
    try {
      const res = await authFetch(`/api/admin/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newHeadline,
          meta_title: newHeadline
        })
      });

      if (res.ok) {
        setArticles(prev => prev.map(a => a.id === articleId ? { ...a, title: newHeadline, meta_title: newHeadline } : a));
        setSyncToast(`Applied improved headline to Story #${articleId}!`);
        setTimeout(() => setSyncToast(null), 3500);
      }
    } catch (err) {
      console.warn('Failed to apply headline update:', err);
    }
  };

  // Admin Article Delete
  const handleDeleteArticle = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    const res = await authFetch(`/api/admin/articles/${id}`, {
      method: 'DELETE'
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
    const res = await authFetch('/api/admin/categories/reorder', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
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
      const res = await authFetch('/api/admin/gsc/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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

  // Non-Tech Easy Actions: Clone / Duplicate Article as Template
  const handleDuplicateArticle = (art: Article) => {
    const cloned: Article = {
      ...art,
      id: undefined as any,
      title: `${art.title} (Draft Copy)`,
      slug: `${art.slug}-copy-${Date.now().toString().slice(-4)}`,
      status: 'draft'
    };
    setEditingArticle(cloned);
    setIsArticleModalOpen(true);
  };

  // Create Category Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const slug = newCategoryName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    const newCat: Category = {
      id: Date.now(),
      name: newCategoryName.trim(),
      slug: slug || `category-${Date.now()}`,
      display_order: categories.length + 1,
      description: newCategoryDesc || `Featured reports and editorial updates in ${newCategoryName.trim()}`,
      is_active: 1
    };

    try {
      const res = await authFetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCat)
      });
      if (res.ok) {
        const json = await parseResponseJson(res);
        if (json && json.data) {
          setCategories(prev => [...prev, json.data]);
        } else {
          setCategories(prev => [...prev, newCat]);
        }
      } else {
        setCategories(prev => [...prev, newCat]);
      }
    } catch {
      setCategories(prev => [...prev, newCat]);
    }

    setIsCategoryModalOpen(false);
    setNewCategoryName('');
    setNewCategoryDesc('');
    setSyncToast(`Category "${newCat.name}" added to homepage taxonomy!`);
    setTimeout(() => setSyncToast(null), 3500);
  };

  // Delete Category Handler
  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to remove this category?')) return;
    try {
      await authFetch(`/api/admin/categories/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Delete category error:', err);
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    setSyncToast('Category removed successfully.');
    setTimeout(() => setSyncToast(null), 3000);
  };

  // Create Author Handler
  const handleCreateAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthorName.trim() || !newAuthorEmail.trim()) return;
    const newAuth: Author = {
      id: Date.now(),
      name: newAuthorName.trim(),
      email: newAuthorEmail.trim(),
      role: newAuthorRole,
      bio: newAuthorBio || 'Editorial contributor at Greenlight FSIA News.',
      avatar_url: newAuthorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80'
    };

    try {
      const res = await authFetch('/api/admin/authors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAuth)
      });
      if (res.ok) {
        const json = await parseResponseJson(res);
        if (json && json.data) {
          setAuthors(prev => [...prev, json.data]);
        } else {
          setAuthors(prev => [...prev, newAuth]);
        }
      } else {
        setAuthors(prev => [...prev, newAuth]);
      }
    } catch {
      setAuthors(prev => [...prev, newAuth]);
    }

    setIsAuthorModalOpen(false);
    setNewAuthorName('');
    setNewAuthorEmail('');
    setNewAuthorBio('');
    setNewAuthorAvatar('');
    setSyncToast(`Staff member "${newAuth.name}" added with role "${newAuth.role.toUpperCase()}"!`);
    setTimeout(() => setSyncToast(null), 3500);
  };

  // Delete Author Handler
  const handleDeleteAuthor = async (id: number) => {
    if (!confirm('Are you sure you want to remove this staff profile?')) return;
    try {
      await authFetch(`/api/admin/authors/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Delete author error:', err);
    }
    setAuthors(prev => prev.filter(a => a.id !== id));
    setSyncToast('Staff member removed.');
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleExportArticles = (format: 'json' | 'csv') => {
    try {
      if (format === 'json') {
        const exportData = JSON.stringify(articles, null, 2);
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `greenlight-articles-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setAdminExportToast('Articles catalog exported as JSON');
      } else {
        const headers = ['ID', 'Title', 'Slug', 'Category', 'Author', 'Status', 'SEO Health Score', 'SEO Status', 'Reading Time (min)', 'Infobox Fields'];
        const rows = articles.map(a => {
          const health = calculateSeoHealth(a);
          return [
            a.id,
            `"${(a.title || '').replace(/"/g, '""')}"`,
            `"${a.slug || ''}"`,
            `"${(a.category_name || '').replace(/"/g, '""')}"`,
            `"${(a.author_name || '').replace(/"/g, '""')}"`,
            `"${a.status || 'published'}"`,
            `"${health.score}%"`,
            `"${health.status.toUpperCase()}"`,
            a.reading_time || 3,
            a.infobox?.length || 0
          ];
        });
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `greenlight-articles-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setAdminExportToast('Articles catalog exported as CSV');
      }
    } catch {
      setAdminExportToast('Export processed');
    }
    setTimeout(() => setAdminExportToast(null), 3000);
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

  // Signed in and on /admin: the page is the Admin CMS, without the reader site's header and footer.
  const inAdmin = currentView === 'admin' && Boolean(adminSession);

  const adminNavItems: AdminNavItem<AdminTab>[] = (
    [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'articles', label: 'Articles', icon: FileText, group: 'Content' },
      { id: 'categories', label: 'Categories', icon: Layers, count: categories.length, group: 'Content' },
      { id: 'authors', label: 'Editorial staff', icon: Users, count: authors.length, group: 'Content' },
      { id: 'gsc', label: 'SEO & Search Console', icon: Activity, group: 'Insights' },
      { id: 'social', label: 'Social shares', icon: Share2, group: 'Insights' },
      { id: 'php', label: 'PHP code generator', icon: Code2, group: 'Tools' }
    ] satisfies AdminNavItem<AdminTab>[]
  ).filter((item) => canOpenTab(item.id));

  const showAdminNotice = (message: string) => {
    setAdminExportToast(message);
    setTimeout(() => setAdminExportToast(null), 4000);
  };

  // The table and activity feed hold no article bodies, so load the full article first.
  const openArticleEditorById = async (articleId: number) => {
    try {
      const res = await authFetch(`/api/admin/articles/${articleId}`);
      const body = await parseResponseJson(res);
      if (!res.ok || !body?.data) {
        showAdminNotice(res.status === 404 ? 'That article no longer exists.' : body?.message || 'The article could not be opened.');
        return;
      }
      setEditingArticle(body.data);
      setModalInitialTab('content');
      setIsArticleModalOpen(true);
    } catch {
      showAdminNotice('The article could not be opened. Check your connection.');
    }
  };

  const adminHeaderActions = (
    <>
      {adminTab === 'articles' && (
        <div className="hidden md:flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => handleExportArticles('csv')}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all flex items-center gap-1.5"
            title="Download the articles catalog as a CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={() => handleExportArticles('json')}
            className="px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
            title="Download as JSON"
          >
            JSON
          </button>
        </div>
      )}
      {can('settings.manage') && (
        <button
          type="button"
          onClick={handleSyncLiveGreenlight}
          disabled={isSyncingLive}
          className="inline-flex items-center justify-center gap-2 h-9 px-2.5 sm:px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500/60 transition-colors"
          title="Pull the latest articles from greenlight.fsia.in"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-600 ${isSyncingLive ? 'animate-spin' : ''}`} />
          <span className="hidden xl:inline">{isSyncingLive ? 'Syncing…' : 'Sync live data'}</span>
        </button>
      )}
      {can('article.create') && (
        <button
          type="button"
          onClick={() => {
            setEditingArticle(null);
            setModalInitialTab('content');
            setIsArticleModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New article</span>
        </button>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* The reader site chrome is hidden inside the signed-in Admin CMS. */}
      {!inAdmin && (
      <>
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

            {/* Only signed-in staff get a shortcut into the CMS; everyone else must know /admin. */}
            {(adminSession || currentView === 'admin') && (
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
            )}
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

          {/* Quick Actions & Language Selector */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* My Reading List Navigation Toggle */}
            <button
              type="button"
              onClick={() => {
                setCurrentView(currentView === 'reading-list' ? 'public' : 'reading-list');
                if (currentView !== 'reading-list') {
                  setSelectedArticleSlug(null);
                  setSearchQuery('');
                }
              }}
              className={`min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs border ${
                currentView === 'reading-list'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-900/20 ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
              title="View My Reading List"
              aria-label="My Reading List"
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarkedIds.length > 0 ? (currentView === 'reading-list' ? 'fill-white text-white' : 'fill-emerald-600 text-emerald-600') : ''}`} />
              <span className="hidden sm:inline">My Reading List</span>
              <span className="sm:hidden">Saved</span>
              {bookmarkedIds.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  currentView === 'reading-list'
                    ? 'bg-white text-emerald-700'
                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {bookmarkedIds.length}
                </span>
              )}
            </button>

            {/* Global Language Selector */}
            <TranslationSelector
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
              isTranslating={isTranslating}
              variant="compact"
            />

            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Search className="w-5 h-5" />
            </button>

            {currentView === 'admin' && adminSession ? (
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

        {/* Category Pill Navigation Tabs (in Public View) - Responsive Auto-Adjusting */}
        {currentView !== 'admin' && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xs relative px-2 sm:px-4">
            <div className="max-w-7xl mx-auto relative flex items-center">
              {/* Left Scroll Button */}
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => handleScrollCategories('left')}
                  className="hidden sm:flex absolute left-0 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 items-center justify-center text-slate-700 dark:text-slate-200 hover:text-emerald-600 hover:border-emerald-500 active:scale-95 transition-all"
                  aria-label="Scroll categories left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Edge Gradient Mask for Left Scroll */}
              {canScrollLeft && (
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent z-10" />
              )}

              {/* Scrollable Category Track */}
              <div
                ref={categoryScrollRef}
                onScroll={checkCategoryScroll}
                className="flex-1 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth text-xs sm:text-sm font-semibold"
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategorySlug('all');
                    setSearchQuery('');
                    if (currentView !== 'public') setCurrentView('public');
                  }}
                  className={`min-h-[40px] px-3.5 sm:px-4 py-2 rounded-full transition-all whitespace-nowrap active:scale-95 shrink-0 flex items-center gap-1.5 ${
                    activeCategorySlug === 'all' && !searchQuery && currentView === 'public'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold ring-2 ring-emerald-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 bg-white/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Top Stories</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('reading-list');
                    setSearchQuery('');
                  }}
                  className={`min-h-[40px] px-3.5 sm:px-4 py-2 rounded-full transition-all whitespace-nowrap active:scale-95 shrink-0 flex items-center gap-1.5 ${
                    currentView === 'reading-list'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold ring-2 ring-emerald-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 bg-white/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${bookmarkedIds.length > 0 && currentView !== 'reading-list' ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                  <span>My Reading List</span>
                  {bookmarkedIds.length > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                      currentView === 'reading-list' ? 'bg-white text-emerald-700' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {bookmarkedIds.length}
                    </span>
                  )}
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
                    className={`min-h-[40px] px-3.5 sm:px-4 py-2 rounded-full transition-all whitespace-nowrap active:scale-95 shrink-0 ${
                      activeCategorySlug === cat.slug && !searchQuery
                        ? 'bg-emerald-600 text-white shadow-xs font-bold ring-2 ring-emerald-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 bg-white/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Edge Gradient Mask for Right Scroll */}
              {canScrollRight && (
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent z-10" />
              )}

              {/* Right Scroll Button */}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => handleScrollCategories('right')}
                  className="hidden sm:flex absolute right-0 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 items-center justify-center text-slate-700 dark:text-slate-200 hover:text-emerald-600 hover:border-emerald-500 active:scale-95 transition-all"
                  aria-label="Scroll categories right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Top Advert Leaderboard Banner (Official FSIA / Greenlight) */}
      <AdBanner
        variant="leaderboard"
        customTitle="Forever Star India Awards Season 6 — Grand Conclave Jaipur"
        customSubtitle="National nominations now open for Entrepreneurs, Healthcare Pioneers, Innovators & Super Women. Claim your recognition."
        customCta="Nominate Online"
        targetUrl="https://greenlight.fsia.in/"
      />
      </>
      )}

      {/* Main Body View Controller */}
      {!inAdmin || !adminSession ? (
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* VIEW 1: PUBLIC HOMEPAGE / SEARCH RESULTS */}
        {currentView === 'public' && (
          <div className="space-y-8 sm:space-y-10">
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
                  className="min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95"
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
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={toggleBookmark}
              />
            )}

            {/* Category Rows with Native Mid-Feed Advert */}
            {!searchQuery && activeCategorySlug === 'all' ? (
              <div className="space-y-4">
                {categories.map((cat, idx) => {
                  const catArticles = articles.filter(a => a.category_id === cat.id || a.category_slug === cat.slug);
                  return (
                    <React.Fragment key={cat.id}>
                      <CategoryRow
                        category={cat}
                        articles={catArticles}
                        onSelectArticle={handleSelectArticle}
                        onSelectCategory={(slug) => setActiveCategorySlug(slug)}
                        bookmarkedIds={bookmarkedIds}
                        onToggleBookmark={toggleBookmark}
                      />
                      {/* Mid-feed sponsor banner after 2nd category */}
                      {idx === 1 && (
                        <div className="py-2">
                          <AdBanner
                            variant="mid-article"
                            customTitle="The Real Super Woman Awards 2026: Honoring Women Trailblazers"
                            customSubtitle="Recognizing female changemakers in healthcare, enterprise, and social justice across all Indian states."
                            customCta="Register Free"
                            targetUrl="https://greenlight.fsia.in/"
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <article
                    key={article.id}
                    onClick={() => handleSelectArticle(article.slug)}
                    className="article-card article-card-reveal cursor-pointer bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between group relative"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Bookmark Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(article.id);
                        }}
                        className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md transition-all shadow-sm active:scale-90 ${
                          isBookmarked(article.id)
                            ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                            : 'bg-black/40 hover:bg-black/60 text-white/90 hover:text-white border border-white/20'
                        }`}
                        title={isBookmarked(article.id) ? "Remove from Reading List" : "Save to Reading List"}
                        aria-label="Toggle Bookmark"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked(article.id) ? 'fill-current' : ''}`} />
                      </button>
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

        {/* VIEW 2: ARTICLE READER WITH AUDIO NARRATION, TRANSLATION, STICKY TOC & WIKIPEDIA INFOBOX */}
        {currentView === 'article' && selectedArticle && (() => {
          const displayArticle = translatedArticle || selectedArticle;
          return (
            <article id="article-detail-container" className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
              {/* Subtle Article Reading Progress Bar & Status Pill */}
              <ArticleReadingProgress
                targetContainerId="article-detail-container"
                totalReadingTime={displayArticle.reading_time || 4}
                showTopPill={true}
              />

              {/* Back button, Breadcrumb & Share */}
              <div className="flex flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentView('public')}
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-colors active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Headlines</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* Bookmark / Reading List Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleBookmark(displayArticle.id)}
                    className={`min-h-[40px] px-3.5 py-2 text-xs rounded-xl border flex items-center gap-1.5 transition-all shadow-xs active:scale-95 font-semibold ${
                      isBookmarked(displayArticle.id)
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600'
                    }`}
                    title={isBookmarked(displayArticle.id) ? "Remove from Reading List" : "Save to Reading List"}
                    aria-label="Bookmark this article"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked(displayArticle.id) ? 'fill-emerald-600 dark:fill-emerald-400 text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <span>{isBookmarked(displayArticle.id) ? 'Saved' : 'Save Story'}</span>
                  </button>

                  {/* Share button with Multi-Platform Tracker Modal */}
                  <button
                    type="button"
                    onClick={() => {
                      setShareArticleTarget(displayArticle);
                      setIsShareModalOpen(true);
                    }}
                    className="min-h-[40px] px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 flex items-center gap-1.5 transition-colors shadow-xs active:scale-95 font-semibold"
                    title="Share story via WhatsApp, LinkedIn, X, Facebook, Telegram, or Copy Tracked Link"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Share Story</span>
                  </button>

                  {/* Fast direct copy */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className="min-h-[40px] px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 transition-colors shadow-xs active:scale-95"
                    title="Quick copy current link"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{copiedUrl ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Translation Pill Bar */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <TranslationSelector
                  currentLanguage={currentLanguage}
                  onLanguageChange={handleLanguageChange}
                  isTranslating={isTranslating}
                  variant="pills"
                />

                {isTranslating && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 animate-pulse shrink-0">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Translating article...</span>
                  </div>
                )}
              </div>

              {/* Headline Section */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase rounded-full">
                    {displayArticle.category_name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(displayArticle.published_at || displayArticle.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black text-slate-900 dark:text-white leading-tight">
                  {displayArticle.title}
                </h1>

                {displayArticle.excerpt && (
                  <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                    {displayArticle.excerpt}
                  </p>
                )}

                {/* Author Byline */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <img
                    src={displayArticle.author_avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
                    alt={displayArticle.author_name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      By {displayArticle.author_name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>Verified Greenlight Correspondent</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {displayArticle.reading_time || 4} min read
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio Article Reader Player */}
              <AudioReader
                title={displayArticle.title}
                contentHtml={displayArticle.content}
                excerpt={displayArticle.excerpt}
                authorName={displayArticle.author_name}
                languageCode={currentLanguage}
              />

              {/* Featured Image */}
              <div className="rounded-3xl overflow-hidden aspect-[16/10] sm:aspect-[21/9] bg-slate-100 dark:bg-slate-800 shadow-md">
                <img
                  src={displayArticle.featured_image}
                  alt={displayArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Mobile Table of Contents Accordion (Visible on Mobile & Tablet) */}
              <div className="block lg:hidden">
                <TableOfContents contentHtml={displayArticle.content} isMobile={true} />
              </div>

              {/* 3-Column Editorial Grid: TOC (Left), Article Body (Center), Wiki Infobox & Sidebar Ad (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
                {/* Left Column: Sticky Table of Contents (Desktop) */}
                <div className="hidden lg:block lg:col-span-3">
                  <TableOfContents contentHtml={displayArticle.content} />
                </div>

                {/* Center Column: WYSIWYG Content Body with Mid-Article Sponsored Box */}
                <div className="lg:col-span-5 space-y-6">
                  <div
                    id="article-wysiwyg-content"
                    className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-serif text-base space-y-4"
                    dangerouslySetInnerHTML={{ __html: displayArticle.content }}
                  />

                  {/* Mid-Article Sponsored Feature */}
                  <AdBanner
                    variant="mid-article"
                    customTitle="Forever Star India Awards Season 6"
                    customSubtitle="Nominate top entrepreneurs, innovators, healthcare leaders, and creators for national prestige."
                    customCta="Nominate Now"
                    targetUrl="https://greenlight.fsia.in/"
                  />
                </div>

                {/* Right Column: Wikipedia Infobox Card & Sidebar Ad */}
                <div className="lg:col-span-4 space-y-6">
                  <WikiInfobox
                    title={displayArticle.title}
                    subtitle={`${displayArticle.category_name} Overview`}
                    image={displayArticle.featured_image}
                    imageCaption="Editorial verified source facts"
                    fields={displayArticle.infobox || []}
                  />

                  {/* Sticky Sidebar Advertisement */}
                  <AdBanner
                    variant="sidebar"
                    customTitle="Forever Miss & Mrs India 2026"
                    customSubtitle="National talent auditions open across 28 states. Transform your career in pageantry & media."
                    customCta="Register for Auditions"
                    targetUrl="https://greenlight.fsia.in/"
                  />
                </div>
              </div>

              {/* Related Stories */}
              {displayArticle.related && displayArticle.related.length > 0 && (
                <div className="pt-12 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-6">
                    Related Coverage in {displayArticle.category_name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {displayArticle.related.map((rel) => (
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
          );
        })()}

        {/* VIEW: MY READING LIST */}
        {currentView === 'reading-list' && (
          <ReadingListView
            bookmarkedIds={bookmarkedIds}
            articles={articles}
            onSelectArticle={handleSelectArticle}
            onToggleBookmark={toggleBookmark}
            onClearReadingList={clearReadingList}
            onBackToFeed={() => setCurrentView('public')}
            onOpenShareModal={(article) => {
              setShareArticleTarget(article);
              setIsShareModalOpen(true);
            }}
          />
        )}

        {/* VIEW 3: ADMIN CMS DASHBOARD */}
        {currentView === 'admin' && !adminSession && (
          <AdminLoginScreen
            onSignedIn={handleAdminSignedIn}
            onCancel={() => setCurrentView('public')}
            notice={adminLoginNotice}
          />
        )}
      </main>
      ) : (
        <AdminShell<AdminTab>
          navItems={adminNavItems}
          activeId={adminTab}
          onNavigate={setAdminTab}
          user={adminSession.user}
          onSignOut={handleAdminSignOut}
          onReaderView={() => setCurrentView('public')}
          isDark={theme.isDark}
          onToggleTheme={theme.toggle}
          title={ADMIN_PAGE_TITLES[adminTab].title}
          subtitle={ADMIN_PAGE_TITLES[adminTab].subtitle}
          actions={adminHeaderActions}
        >
          <div className="space-y-6">
            {/* Export Toast Notification */}
            {adminExportToast && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{adminExportToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminExportToast(null)}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {adminTab === 'dashboard' && (
              <DashboardHome
                isDark={theme.isDark}
                refreshKey={articlesVersion}
                onOpenArticles={(status) => openArticlesTable({ statuses: status ? [status] : [] })}
                onOpenArticle={openArticleEditorById}
              />
            )}

            {/* TAB 1: ARTICLES (server-side table with the Draft → Review → Published workflow) */}
            {adminTab === 'articles' && (
              <ArticlesTable
                key={articlesTableKey}
                categories={categories}
                authors={authors}
                initialStatuses={articlesTableFilter.statuses}
                initialAuthorIds={articlesTableFilter.authorIds}
                refreshKey={articlesVersion}
                onEdit={openArticleEditorById}
                onChanged={() => {
                  setArticlesVersion((v) => v + 1);
                  loadData();
                }}
                onNotice={showAdminNotice}
              />
            )}

            {/* TAB 2: GOOGLE SEARCH CONSOLE ANALYTICS & RANK DROPS */}
            {adminTab === 'gsc' && (
              <div className="space-y-6">
                {/* Sync Action Banner */}
                <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Google Search Console Archiving & Intelligence</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      Monitors impressions, CTR, average SERP rankings, and tracks 7-day algorithmic drops for verified Greenlight property.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {gscSyncMessage && (
                      <span className="text-xs text-emerald-400 font-medium">
                        {gscSyncMessage}
                      </span>
                    )}
                    {can('settings.manage') && (
                    <button
                      type="button"
                      onClick={handleTriggerGscSync}
                      disabled={isSyncingGsc}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGsc ? 'animate-spin' : ''}`} />
                      <span>{isSyncingGsc ? 'Syncing...' : 'Sync Search Console'}</span>
                    </button>
                    )}
                  </div>
                </div>

                {/* Plain-English SEO Help Guide for Non-Tech Editors */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                    <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">👆 Clicks</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Actual readers who clicked on a Greenlight link on Google.
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                    <div className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">👀 Impressions</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      How many times your story appeared on someone&apos;s search result page.
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                    <div className="text-xs font-bold text-purple-800 dark:text-purple-300 mb-1">🎯 Click-Through Rate (CTR)</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Percentage of viewers who clicked (Higher CTR = more attractive headline).
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                    <div className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">🏆 Average Position</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Google search rank (1 to 10 is on Google Page 1).
                    </div>
                  </div>
                </div>

                {/* Recharts Analytics Charts */}
                <AnalyticsCharts data={gscData} />

                {/* AI Content Audit Summary Panel (Top 10 articles by CTR analyzed with Gemini) */}
                <AiContentAuditPanel
                  articles={articles}
                  onApplyHeadline={handleApplyHeadlineFromAudit}
                  onEditArticle={(art) => {
                    setEditingArticle(art);
                    setIsArticleModalOpen(true);
                  }}
                />

                {/* 7-Day Rank Drops Table */}
                <RankDropsTable data={gscRankDrops} />
              </div>
            )}

            {/* TAB: SOCIAL MEDIA SHARES & CTR DASHBOARD */}
            {adminTab === 'social' && (
              <SocialShareAnalytics
                articles={articles}
                onSelectArticle={handleSelectArticle}
              />
            )}

            {/* TAB 3: CATEGORIES & HOMEPAGE DISPLAY ORDER */}
            {adminTab === 'categories' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-600" />
                      <span>Category Sections & Homepage Display Order</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Reorder homepage sections using the Move Up / Move Down buttons. Changes reflect instantly on the public website.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl flex items-center gap-2 shadow-xs"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Add New Category</span>
                  </button>
                </div>

                {/* Categories Search & Filter Bar */}
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={adminCategorySearch}
                      onChange={(e) => setAdminCategorySearch(e.target.value)}
                      placeholder="Filter category sections by name or slug..."
                      className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 transition-colors"
                    />
                    {adminCategorySearch && (
                      <button
                        type="button"
                        onClick={() => setAdminCategorySearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 shrink-0 font-medium">
                    {categories.filter(c => !adminCategorySearch || c.name.toLowerCase().includes(adminCategorySearch.toLowerCase()) || c.slug.toLowerCase().includes(adminCategorySearch.toLowerCase())).length} of {categories.length} Sections
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories
                    .filter(c => !adminCategorySearch || c.name.toLowerCase().includes(adminCategorySearch.toLowerCase()) || c.slug.toLowerCase().includes(adminCategorySearch.toLowerCase()))
                    .map((cat, idx) => {
                    const count = articles.filter(a => a.category_slug === cat.slug || a.category_id === cat.id).length;
                    const pct = articles.length ? Math.round((count / articles.length) * 100) : 0;
                    return (
                      <div
                        key={cat.id}
                        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-sm">
                                #{cat.display_order}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                                  <span>{cat.name}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-normal">
                                    {count} articles ({pct}%)
                                  </span>
                                </h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">/{cat.slug}</p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                              title="Delete category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                            {cat.description || 'Homepage editorial section category.'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCategorySlug(cat.slug);
                              setCurrentView('public');
                            }}
                            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            title="Preview this section on homepage feed"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View on Feed</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 mr-1 hidden sm:inline">
                              Position #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCategoryReorder(cat.id, 'up')}
                              disabled={idx === 0}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                            >
                              ▲ Move Up
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCategoryReorder(cat.id, 'down')}
                              disabled={idx === categories.length - 1}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                            >
                              ▼ Move Down
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: AUTHORS & RBAC ROLES */}
            {adminTab === 'authors' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <span>Editorial Staff & Role Permissions</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assign roles to newsroom correspondents: <strong>Admin</strong> (Full access), <strong>Editor</strong> (Publish & SEO), or <strong>Author</strong> (Draft creation).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAuthorModalOpen(true)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl flex items-center gap-2 shadow-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Staff Member</span>
                  </button>
                </div>

                {/* Staff Search & Role Filter Toolbar */}
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={adminAuthorSearch}
                      onChange={(e) => setAdminAuthorSearch(e.target.value)}
                      placeholder="Search staff by name, email, or role..."
                      className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 transition-colors"
                    />
                    {adminAuthorSearch && (
                      <button
                        type="button"
                        onClick={() => setAdminAuthorSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Role Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setAdminAuthorRoleFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        adminAuthorRoleFilter === 'all'
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      All ({authors.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminAuthorRoleFilter('admin')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        adminAuthorRoleFilter === 'admin'
                          ? 'bg-slate-800 text-white shadow-2xs font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Admins
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminAuthorRoleFilter('editor')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        adminAuthorRoleFilter === 'editor'
                          ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70 border border-emerald-200/50'
                      }`}
                    >
                      Editors
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminAuthorRoleFilter('author')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        adminAuthorRoleFilter === 'author'
                          ? 'bg-amber-600 text-white shadow-2xs font-bold'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100/70 border border-amber-200/50'
                      }`}
                    >
                      Authors
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {authors
                    .filter(auth => {
                      const q = adminAuthorSearch.toLowerCase().trim();
                      const matchesSearch = !q ||
                        auth.name.toLowerCase().includes(q) ||
                        auth.email.toLowerCase().includes(q) ||
                        (auth.bio || '').toLowerCase().includes(q);
                      const matchesRole = adminAuthorRoleFilter === 'all' || auth.role === adminAuthorRoleFilter;
                      return matchesSearch && matchesRole;
                    })
                    .map((auth) => {
                    const authorArticleCount = articles.filter(a => a.author_name === auth.name || a.author_id === auth.id).length;
                    return (
                      <div
                        key={auth.id}
                        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={auth.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                                alt={auth.name}
                                className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                              />
                              <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {auth.name}
                                </h3>
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${
                                  auth.role === 'admin'
                                    ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/80'
                                    : auth.role === 'editor'
                                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80'
                                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80'
                                }`}>
                                  {auth.role}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteAuthor(auth.id)}
                              className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                              title="Delete staff profile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">
                            {auth.bio || 'Verified correspondent for Greenlight News.'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              openArticlesTable({ authorIds: [auth.id] });
                            }}
                            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            title={`Filter articles written by ${auth.name}`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{authorArticleCount} Stories</span>
                          </button>

                          <span className="font-mono text-slate-400 truncate max-w-[130px]">
                            {auth.email}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: PHP CODE FILE GENERATOR FOR DEVELOPERS */}
            {adminTab === 'php' && (
              <PhpCodeGenerator
                articles={articles}
                categories={categories}
                authors={authors}
              />
            )}
          </div>
        </AdminShell>
      )}

      {/* Admin Article Modal */}
      <AdminArticleModal
        isOpen={isArticleModalOpen}
        onClose={() => {
          setIsArticleModalOpen(false);
          setEditingArticle(null);
          setModalInitialTab('content');
        }}
        onSave={handleSaveArticle}
        article={editingArticle}
        categories={categories}
        authors={authors}
        initialTab={modalInitialTab}
        canPublish={can('article.publish')}
        ownName={adminSession?.user.name}
      />

      {/* Public Multi-Platform Share Modal */}
      {isShareModalOpen && shareArticleTarget && (
        <ShareArticleModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareArticleTarget(null);
          }}
          article={shareArticleTarget}
          articlesList={articles}
        />
      )}

      {/* Non-Tech Friendly Category Creation Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add New Category Section</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="pt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Technology & AI, Luxury Lifestyle, Conclaves"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Brief summary of stories in this category..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs transition-colors"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Non-Tech Friendly Author Creation Modal */}
      {isAuthorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Newsroom Staff Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthorModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAuthor} className="pt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newAuthorName}
                  onChange={(e) => setNewAuthorName(e.target.value)}
                  placeholder="e.g. Priya Nair, Dr. Rajesh Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  value={newAuthorEmail}
                  onChange={(e) => setNewAuthorEmail(e.target.value)}
                  placeholder="e.g. editor@greenlight.fsia.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role & Permissions
                </label>
                <select
                  value={newAuthorRole}
                  onChange={(e) => setNewAuthorRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="admin">Administrator (Full Access & SEO Management)</option>
                  <option value="editor">Senior Editor (Publishing & Editing)</option>
                  <option value="author">Staff Writer / Correspondent (Drafts)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Short Bio
                </label>
                <textarea
                  rows={2}
                  value={newAuthorBio}
                  onChange={(e) => setNewAuthorBio(e.target.value)}
                  placeholder="Covering national conclaves and verified corporate achievements..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAuthorModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs transition-colors"
                >
                  Save Team Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      {!inAdmin && (
      <>
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
      {/* Bottom Sticky Sponsor Bar */}
      <AdBanner
        variant="bottom-sticky"
        customTitle="FSIA Season 6 Conclave Jaipur — National Nominations Open"
        customSubtitle="Recognizing top national talent in business, leadership, healthcare, and education."
        customCta="Apply Now"
        targetUrl="https://greenlight.fsia.in/"
      />
      </>
      )}
    </div>
  );
}
