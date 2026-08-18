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
          <span>Top Editorial Stories</span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Primary Lead Story (7 cols) */}
        {primary && (
          <motion.div
            id={`lead-story-${primary.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => onSelectArticle(primary.slug)}
            className="lg:col-span-7 flex flex-col justify-between group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={primary.featured_image || 'https://images.unsplash.com/photo-1517976487508-54b9d0dc6b29?w=1200&auto=format&fit=crop&q=80'}
                alt={primary.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="eager"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 bg-emerald-600/90 backdrop-blur text-white text-xs font-semibold rounded-full uppercase tracking-wider shadow-sm">
                  {primary.category_name || 'Featured'}
                </span>
                <span className="px-2.5 py-1 bg-black/60 backdrop-blur text-white text-xs font-medium rounded-full flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>Breaking</span>
                </span>
              </div>
            </div>

            <div className="p-6 md:p-8 flex flex-col flex-grow justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-slate-50 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {primary.title}
                </h1>
                {primary.excerpt && (
                  <p className="mt-3 text-base text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {primary.excerpt}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2.5">
                  <img
                    src={primary.author_avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
                    alt={primary.author_name || 'Author'}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <span className="font-medium text-slate-800 dark:text-slate-200">{primary.author_name}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {primary.reading_time || 4} min read
                  </span>
                  <span>•</span>
                  <span>{timeAgo(primary.published_at)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Secondary Stories Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          {secondaryStories.map((story, index) => (
            <motion.article
              id={`secondary-story-${story.id}`}
              key={story.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: index * 0.1 }}
              onClick={() => onSelectArticle(story.slug)}
              className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:shadow-md transition-all duration-200 cursor-pointer group flex-1 items-center"
            >
              <div className="flex-1 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                      {story.category_name}
                    </span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[11px] text-slate-400">{timeAgo(story.published_at)}</span>
                  </div>
                  <h2 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-2 leading-snug">
                    {story.title}
                  </h2>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{story.author_name}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {story.reading_time || 3}m
                  </span>
                </div>
              </div>

              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                <img
                  src={story.featured_image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80'}
                  alt={story.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroFeatured;
