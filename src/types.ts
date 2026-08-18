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
  category_id: number;
  category_name: string;
  category_slug: string;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  status: 'published' | 'draft' | 'archived';
  is_featured: number | boolean;
  views_count: number;
  reading_time: number;
  published_at?: string;
  created_at: string;
  updated_at?: string;
  infobox?: InfoboxItem[];
  related?: Article[];
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
