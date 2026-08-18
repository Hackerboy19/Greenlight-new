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

  // Track scroll position & active heading with IntersectionObserver and scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight > 0) {
        const scrolled = (window.scrollY / docHeight) * 100;
        setReadProgress(Math.min(100, Math.max(0, scrolled)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Heading Intersection Observer
    const headingElements = headings.map(h => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
    if (headingElements.length === 0) return () => window.removeEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0% -60% 0%' }
    );

    headingElements.forEach(el => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveId(id);
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav 
      id="article-table-of-contents"
      aria-label="Table of Contents"
      className={`p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-24 shadow-sm text-xs ${className}`}
    >
      {/* Reading Progress Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <ListTree className="w-3.5 h-3.5" />
            <span>Table of Contents</span>
          </span>
          <span className="font-mono">{Math.round(readProgress)}% read</span>
        </div>
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-150"
            style={{ width: `${readProgress}%` }}
          />
        </div>
      </div>

      {/* Heading links */}
      <ul className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <li key={heading.id}>
              <button
                type="button"
                onClick={() => scrollToHeading(heading.id)}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors flex items-center gap-1.5 group ${
                  heading.level === 3 ? 'pl-5 text-[11px]' : 'font-semibold text-xs'
                } ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border-l-2 border-emerald-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="truncate">{heading.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default TableOfContents;
