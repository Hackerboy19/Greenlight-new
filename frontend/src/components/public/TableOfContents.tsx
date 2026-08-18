/**
 * TableOfContents Component
 * Sticky navigational sidebar with IntersectionObserver scroll-spy for h2/h3 headings
 */

import React, { useEffect, useState } from 'react';
import { ListTree, ChevronRight, Bookmark } from 'lucide-react';
import { motion } from 'motion/react';

export interface TocHeading {
  id: string;
  text: string;
  level: number; // 2 for h2, 3 for h3
}

export interface TableOfContentsProps {
  contentHtml?: string;
  headings?: TocHeading[];
  className?: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  contentHtml,
  headings: initialHeadings,
  className = ""
}) => {
  const [headings, setHeadings] = useState<TocHeading[]>(initialHeadings || []);
  const [activeId, setActiveId] = useState<string>('');
  const [readProgress, setReadProgress] = useState(0);

  // Parse headings from DOM or HTML
  useEffect(() => {
    if (initialHeadings && initialHeadings.length > 0) {
      setHeadings(initialHeadings);
      return;
    }

    // Extract headings from rendered article body
    const articleContainer = document.getElementById('article-wysiwyg-content');
    if (!articleContainer) return;

    const elements = articleContainer.querySelectorAll('h2, h3');
    const parsedHeadings: TocHeading[] = [];

    elements.forEach((el, index) => {
      let id = el.id;
      if (!id) {
        id = `heading-${index}-${el.textContent?.toLowerCase().replace(/[^\w]+/g, '-')}`;
        el.id = id;
      }
      parsedHeadings.push({
        id,
        text: el.textContent || `Section ${index + 1}`,
        level: el.tagName.toLowerCase() === 'h2' ? 2 : 3
      });
    });

    setHeadings(parsedHeadings);
  }, [contentHtml, initialHeadings]);

  // Setup IntersectionObserver for scroll spy
  useEffect(() => {
    if (headings.length === 0) return;

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const visibleEntry = entries.find(entry => entry.isIntersecting);
      if (visibleEntry) {
        setActiveId(visibleEntry.target.id);
      }
    };

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '-80px 0% -65% 0%',
      threshold: [0, 0.5, 1]
    });

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    // Track overall reading progress
    const handleScroll = () => {
      const articleEl = document.getElementById('article-wysiwyg-content');
      if (!articleEl) return;
      const rect = articleEl.getBoundingClientRect();
      const totalHeight = rect.height - window.innerHeight;
      if (totalHeight <= 0) {
        setReadProgress(100);
        return;
      }
      const scrolled = Math.max(0, -rect.top);
      const progress = Math.min(100, Math.round((scrolled / totalHeight) * 100));
      setReadProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const topOffset = 85; // header offset
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveId(id);
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav 
      id="article-table-of-contents"
      aria-label="Table of contents"
      className={`bg-slate-50/70 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 sticky top-24 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <ListTree className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Contents</span>
        </div>
        <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
          {readProgress}% read
        </span>
      </div>

      {/* Progress line */}
      <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-emerald-500 rounded-full transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <ul className="space-y-1.5 text-xs">
        {headings.map((h) => {
          const isActive = activeId === h.id;
          return (
            <li key={h.id} className={`${h.level === 3 ? 'ml-3' : ''}`}>
              <button
                type="button"
                onClick={() => scrollToHeading(h.id)}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-between group ${
                  isActive
                    ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="truncate leading-relaxed">{h.text}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default TableOfContents;
