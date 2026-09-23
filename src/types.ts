/**
 * Global TypeScript Interfaces & Types for Greenlight Platform
 */

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  status: 'published' | 'draft' | 'review' | 'scheduled' | 'archived';
  is_featured: number | boolean;
  views_count: number;
  reading_time: number;
  published_at?: string;
  created_at: string;
  updated_at?: string;
  infobox?: InfoboxItem[];
  related?: Article[];
  /** Admin API only: what the signed-in user may do with this article. */
  actions?: ArticleActions;
}

export interface ArticleActions {
  edit: boolean;
  submit: boolean;
  publish: boolean;
  returnToDraft: boolean;
  unpublish: boolean;
  delete: boolean;
}

export type ArticleSortKey =
  | 'title'
  | 'status'
  | 'category'
  | 'author'
  | 'views'
  | 'reading_time'
  | 'created_at'
  | 'updated_at'
  | 'published_at';

/** meta of GET /api/admin/articles */
export interface ArticleListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sort: ArticleSortKey;
  order: 'asc' | 'desc';
  statusCounts: Record<Article['status'], number>;
}

export interface InfoboxItem {
  section?: string;
  field_key: string;
  field_value: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
  is_active: number;
  articles?: Article[];
  articleCount?: number;
}

export interface Author {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'author';
  bio?: string;
  avatar_url?: string;
}

export interface GscPerformancePoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscRankDrop {
  query: string;
  page: string;
  current_avg_pos: number;
  previous_avg_pos: number;
  pos_change: number;
  current_clicks: number;
  previous_clicks: number;
  clicks_diff: number;
  current_impressions: number;
  previous_impressions: number;
  status: 'critical_drop' | 'slight_drop' | 'stable' | 'surging';
  severity: 'high' | 'low' | 'normal' | 'positive';
}

export interface ContentAuditRecommendation {
  articleId: number;
  slug: string;
  currentTitle: string;
  category?: string;
  currentCtr: number;
  clicks?: number;
  impressions?: number;
  suggestedHeadline: string;
  alternativeHeadline?: string;
  rationale: string;
  expectedImpact: string;
  status: 'high_performer' | 'steady' | 'needs_optimization';
  strengths?: string[];
  improvements?: string[];
}

export interface ContentAuditOverview {
  auditedArticlesCount: number;
  averageCtr: number;
  totalEstimatedTrafficLift: string;
  keyFindings: string;
}

export interface ContentAuditResult {
  overview: ContentAuditOverview;
  recommendations: ContentAuditRecommendation[];
  source?: string;
}


/** One day of site traffic on the admin dashboard. */
export interface TrafficPoint {
  date: string;
  views: number;
  visitors: number;
}

export type ActivityAction = 'created' | 'edited' | 'submitted' | 'returned' | 'published' | 'unpublished' | 'deleted';

/** One entry in the admin dashboard's Recent Activity feed. */
export interface ActivityEntry {
  id: number;
  actor_user_id: number | null;
  actor_name: string;
  actor_role: string;
  action: ActivityAction;
  article_id: number | null;
  article_title: string;
  created_at: string;
}

/** GET /api/admin/dashboard */
export interface DashboardSummary {
  metrics: {
    published: number;
    pendingReview: number;
    drafts: number;
    scheduled: number;
    totalViews: number;
  };
  traffic: { source: 'mock' | 'live'; days: TrafficPoint[] };
  activity: ActivityEntry[];
}
