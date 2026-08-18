/**
 * CategoryRow Component
 * Modular Google News category section rendering ordered editorial feeds with responsive cards
 */

import React from 'react';
import { ArrowRight, Clock, Bookmark, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ArticleItem } from './HeroFeatured';

export interface CategoryRowProps {
  category: {
    id: number | string;
    name: string;
    slug: string;
    description?: string;
    display_order?: number;
  };
  articles: ArticleItem[];
  onSelectArticle: (slug: string) => void;
  onSelectCategory?: (categorySlug: string) => void;
  className?: string;
}

function timeAgo(dateString?: string): string {
  if (!dateString) return 'Just now';
  const now = new Date().getTime();
  const date = new Date(dateString).getTime();
  const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
  if (diffHours <= 0) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  articles,
  onSelectArticle,
  onSelectCategory,
  className = ""
}) => {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section 
      id={`category-row-${category.slug}`} 
      className={`w-full py-6 border-b border-slate-100 dark:border-slate-800/80 last:border-0 ${className}`}
    >
      {/* Category Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-6 bg-emerald-600 dark:bg-emerald-500 rounded-full" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{category.name}</span>
            </h2>
            {category.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                {category.description}
              </p>
            )}
          </div>
        </div>

        {onSelectCategory && (
          <button
            type="button"
            onClick={() => onSelectCategory(category.slug)}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 group"
          >
            <span>View all {articles.length} stories</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Grid of Articles in Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.slice(0, 3).map((article) => (
          <article
            key={article.id}
            onClick={() => onSelectArticle(article.slug)}
            className="group cursor-pointer flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900/60 transition-all"
          >
            {/* Featured Image */}
            <div className="relative aspect-[16/9] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <img
                src={article.featured_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80'}
                alt={article.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-medium">
                {article.reading_time || 3} min read
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {article.author_name}
                  </span>
                  <span>•</span>
                  <span>{timeAgo(article.published_at)}</span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {article.excerpt}
                </p>
              </div>

              {/* Infobox micro chips */}
              {article.infobox && article.infobox.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="truncate max-w-[140px]">
                    {article.infobox[0].field_key}: {article.infobox[0].field_value}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    +{article.infobox.length} facts
                  </span>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default CategoryRow;
