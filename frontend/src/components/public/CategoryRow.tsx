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
            id={`view-all-${category.slug}`}
            type="button"
            onClick={() => onSelectCategory(category.slug)}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <span>See more</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Responsive Articles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {articles.map((article, idx) => (
          <motion.article
            id={`category-article-${article.id}`}
            key={article.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            onClick={() => onSelectArticle(article.slug)}
            className="group cursor-pointer flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/90 overflow-hidden hover:shadow-lg hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-200"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={article.featured_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80'}
                alt={article.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur text-[10px] font-medium text-white rounded">
                {article.reading_time || 3} min read
              </span>
            </div>

            <div className="p-4 flex flex-col flex-grow justify-between">
              <div>
                <h3 className="text-sm font-serif font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-2 leading-snug">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                  {article.author_name}
                </span>
                <span>{timeAgo(article.published_at)}</span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default CategoryRow;
