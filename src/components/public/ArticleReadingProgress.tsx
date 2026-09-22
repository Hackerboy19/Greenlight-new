/**
 * Article Reading Progress Indicator
 * Renders a subtle, high-precision progress bar at the top of the article view
 * indicating how far the user has scrolled through the article content.
 * Styled in light English editorial palette with soft emerald accent.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Clock, CheckCircle2, ArrowUp } from 'lucide-react';

interface ArticleReadingProgressProps {
  targetContainerId?: string;
  totalReadingTime?: number; // In minutes
  showTopPill?: boolean;
}

export const ArticleReadingProgress: React.FC<ArticleReadingProgressProps> = ({
  targetContainerId = 'article-detail-container',
  totalReadingTime = 4,
  showTopPill = true
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Calculate scroll progress percentage based on article container
  const updateProgress = useCallback(() => {
    const container = document.getElementById(targetContainerId);
    if (!container) {
      // Fallback to window scroll if container isn't found
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight - windowHeight;
      if (docHeight > 0) {
        const scrolled = (window.scrollY / docHeight) * 100;
        const clamped = Math.min(100, Math.max(0, Math.round(scrolled)));
        setScrollProgress(clamped);
        setIsCompleted(clamped >= 96);
      }
      return;
    }

    const rect = container.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const containerHeight = container.offsetHeight;

    // Start progress as soon as container enters viewport, reaching 100% near the end of content
    const totalScrollableDistance = containerHeight - (windowHeight * 0.75);

    if (totalScrollableDistance <= 0) {
      setScrollProgress(100);
      setIsCompleted(true);
      return;
    }

    // Distance scrolled from top of container
    const scrolledFromTop = -rect.top + 80; // 80px offset for sticky header
    const currentProgress = (scrolledFromTop / totalScrollableDistance) * 100;
    const clampedProgress = Math.min(100, Math.max(0, Math.round(currentProgress)));

    setScrollProgress(clampedProgress);
    setIsCompleted(clampedProgress >= 96);
  }, [targetContainerId]);

  useEffect(() => {
    // Initial calculation
    updateProgress();

    // Throttled scroll listener using requestAnimationFrame for optimal 60fps performance
    let animationFrameId: number | null = null;
    const handleScroll = () => {
      if (animationFrameId !== null) return;
      animationFrameId = window.requestAnimationFrame(() => {
        updateProgress();
        animationFrameId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [updateProgress]);

  // Estimated reading time remaining (minutes)
  const remainingMinutes = Math.max(
    0,
    Math.ceil(totalReadingTime * (1 - scrollProgress / 100))
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* 1. Subtle Fixed Top Progress Bar (Stuck to top edge of viewport/navbar) */}
      <div 
        id="article-fixed-reading-bar" 
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-[3px] bg-slate-200/50 dark:bg-slate-800/60"
        role="progressbar"
        aria-valuenow={scrollProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Article reading progress"
      >
        <div 
          className="h-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-150 ease-out shadow-[0_0_8px_rgba(5,150,105,0.4)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. Top-of-Article Page Progress Card (Visible right at top of article page) */}
      {showTopPill && (
        <div 
          id="article-reading-progress-pill"
          className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Left: Progress info & reading time */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/40">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isCompleted ? 'Article Completed' : 'Reading Progress'}
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                    {scrollProgress}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {isCompleted
                      ? 'You have finished this story'
                      : remainingMinutes > 0
                        ? `~${remainingMinutes} min read remaining`
                        : 'Almost finished'}
                  </span>
                  <span>•</span>
                  <span>{totalReadingTime} min total</span>
                </div>
              </div>
            </div>

            {/* Right: Progress Track Bar & Jump control */}
            <div className="flex items-center gap-3 sm:w-64">
              <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/60 dark:border-slate-700/50">
                <div 
                  className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-200 ease-out"
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>

              {scrollProgress > 25 && (
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors shrink-0"
                  title="Scroll to top of article"
                >
                  <ArrowUp className="w-3 h-3" />
                  <span className="hidden sm:inline">Top</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
