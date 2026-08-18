/**
 * HeroFeatured Component
 * Implements a Google News flagship editorial layout with primary spotlight hero and secondary breaking stories
 */

import React from 'react';
import { Clock, TrendingUp, Sparkles, ArrowRight, Bookmark } from 'lucide-react';
import { motion } from 'motion/react';

export interface ArticleItem {
  id: number | string;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  category_name?: string;
  category_slug?: string;
  author_name?: string;
  author_avatar?: string;
  reading_time?: number;
  published_at?: string;
  views_count?: number;
  meta_title?: string;
  meta_description?: string;
  infobox?: Array<{ section: string; field_key: string; field_value: string }>;
}

export interface HeroFeaturedProps {
  articles: ArticleItem[];
  onSelectArticle: (slug: string) => void;
  className?: string;
}

function timeAgo(dateString?: string): string {
  if (!dateString) return 'Just now';
  const now = new Date().getTime();
  const date = new Date(dateString).getTime();
  const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
  if (diffHours <= 0) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export const HeroFeatured: React.FC<HeroFeaturedProps> = ({
  articles,
  onSelectArticle,
  className = ""
}) => {
  if (!articles || articles.length === 0) {
    return null;
  }

  const primary = articles[0];
  const secondaryStories = articles.slice(1, 4);

  return (
    <section id="hero-featured-section" className={`w-full ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs tracking-wider uppercase">
          <Sparkles className="w-4 h-4" />
          <span>Flagship Lead & Top Stories</span>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Live Verification Feed • Updated Daily
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* PRIMARY SPOTLIGHT STORY (7 Cols) */}
        <article 
          onClick={() => onSelectArticle(primary.slug)}
          className="lg:col-span-7 group cursor-pointer flex flex-col space-y-4"
        >
          <div className="relative aspect-[16/10] w-full rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-800/80">
            <img 
              src={primary.featured_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80'} 
              alt={primary.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            
            {/* Top Category Badge */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600/90 backdrop-blur-md text-white shadow-md">
                {primary.category_name || 'FSIA Special'}
              </span>
            </div>

            {/* Bottom Meta Overlay */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center gap-3 text-xs text-slate-200 mb-1">
                <span className="font-semibold">{primary.author_name}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {primary.reading_time || 4} min read
                </span>
                <span>•</span>
                <span>{timeAgo(primary.published_at)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
              {primary.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed line-clamp-3">
              {primary.excerpt}
            </p>
          </div>

          {/* Quick Infobox Preview Tags (if available) */}
          {primary.infobox && primary.infobox.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-2">
              {primary.infobox.slice(0, 3).map((item, idx) => (
                <span 
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  <strong className="text-slate-800 dark:text-slate-100">{item.field_key}:</strong> {item.field_value}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* SECONDARY EDITORIAL STACK (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {secondaryStories.map((story, index) => (
            <article 
              key={story.id}
              onClick={() => onSelectArticle(story.slug)}
              className={`group cursor-pointer py-4 first:pt-0 last:pb-0 flex items-start gap-4 transition-all`}
            >
              {/* Story content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {story.category_name}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 text-[11px]">
                    {timeAgo(story.published_at)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                  {story.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {story.excerpt}
                </p>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                  <span>By {story.author_name}</span>
                  <span>•</span>
                  <span>{story.reading_time || 3}m</span>
                </div>
              </div>

              {/* Story Image */}
              {story.featured_image && (
                <div className="w-24 sm:w-28 aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <img 
                    src={story.featured_image} 
                    alt={story.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroFeatured;
