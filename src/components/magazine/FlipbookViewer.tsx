import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import type { MagazinePage } from '../../types';
import { MagazineBackCover, MagazinePageView } from './MagazinePageView';

export interface FlipbookViewerProps {
  title: string;
  pages: MagazinePage[];
  className?: string;
}

// Page size the book is laid out from (3:4, like a printed magazine). The
// book stretches to its container between the min and max sizes below.
const PAGE_WIDTH = 450;
const PAGE_HEIGHT = 600;

/**
 * A magazine that opens and turns like a printed one: drag a corner or click
 * a page edge to fold it over. Two-page spreads on wide screens, one page at a
 * time on phones. Arrow keys and the buttons below also turn pages.
 */
export const FlipbookViewer: React.FC<FlipbookViewerProps> = ({ title, pages, className = '' }) => {
  const bookRef = useRef<any>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [fullscreen, setFullscreen] = useState(false);

  // The book closes on a hard back cover, so it needs an even number of leaves.
  const needsBackCover = pages.length % 2 === 1;
  const total = pages.length + (needsBackCover ? 1 : 0);

  // react-pageflip reads its pages once, so a changed page list (the admin
  // preview) remounts the book.
  const bookKey = useMemo(() => pages.map((p) => `${p.kind}:${p.image_url || p.heading}`).join('|'), [pages]);

  const flip = useCallback(() => bookRef.current?.pageFlip?.(), []);
  const next = useCallback(() => flip()?.flipNext(), [flip]);
  const prev = useCallback(() => flip()?.flipPrev(), [flip]);

  useEffect(() => {
    setCurrent(0);
  }, [bookKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // page-flip adds window listeners that it only removes in destroy(), which
  // would also remove DOM nodes React owns. Remove just the listeners.
  useEffect(
    () => () => {
      const ui = flip()?.getUI?.();
      try {
        ui?.removeHandlers?.();
      } catch {
        // already gone
      }
    },
    [bookKey, flip]
  );

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else frameRef.current?.requestFullscreen?.().catch(() => {});
  };

  // "Pages 2-3 of 8" on a spread, "Page 1 of 8" on a cover or a phone.
  const shown =
    orientation === 'portrait' || current === 0 || current >= total - 1
      ? `Page ${current + 1} of ${total}`
      : `Pages ${current + 1}-${Math.min(current + 2, total)} of ${total}`;

  if (pages.length === 0) {
    return (
      <div className={`rounded-card border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-sm text-slate-500 ${className}`}>
        This issue has no pages yet.
      </div>
    );
  }

  return (
    <div
      ref={frameRef}
      className={`magazine-stage relative rounded-hero bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 shadow-xl px-3 sm:px-8 pt-6 sm:pt-8 pb-4 ${
        fullscreen ? 'flex flex-col justify-center' : ''
      } ${className}`}
    >
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className={`relative mx-auto ${fullscreen ? 'w-full max-w-[min(1200px,calc((100vh-110px)*1.5))]' : 'max-w-5xl'}`}>
        <HTMLFlipBook
          key={bookKey}
          ref={bookRef}
          className="mx-auto"
          style={{}}
          width={PAGE_WIDTH}
          height={PAGE_HEIGHT}
          size="stretch"
          minWidth={260}
          maxWidth={700}
          minHeight={347}
          maxHeight={933}
          startPage={0}
          drawShadow
          maxShadowOpacity={0.45}
          flippingTime={850}
          usePortrait
          startZIndex={0}
          autoSize
          showCover
          mobileScrollSupport
          clickEventForward
          useMouseEvents
          swipeDistance={30}
          showPageCorners
          disableFlipByClick={false}
          onFlip={(e: { data: number }) => setCurrent(e.data)}
          onInit={(e: { data: { page: number; mode: 'portrait' | 'landscape' } }) => setOrientation(e.data.mode)}
          onChangeOrientation={(e: { data: 'portrait' | 'landscape' }) => setOrientation(e.data)}
        >
          {[
            ...pages.map((page, i) => (
              <MagazinePageView
                key={`${i}-${page.image_url || page.heading}`}
                page={page}
                number={i + 1}
                issueTitle={title}
                hard={i === 0}
                eager={i < 4}
              />
            )),
            ...(needsBackCover ? [<MagazineBackCover key="back-cover" issueTitle={title} />] : [])
          ]}
        </HTMLFlipBook>
      </div>

      <div className="relative mt-5 flex items-center justify-center gap-3 text-white">
        <button
          type="button"
          onClick={prev}
          disabled={current === 0}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-white/10 flex items-center justify-center transition-all active:scale-95"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="min-w-[9rem] text-center text-xs font-semibold tracking-wide text-slate-300" aria-live="polite">
          {shown}
        </span>
        <button
          type="button"
          onClick={next}
          disabled={current >= total - 1}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-white/10 flex items-center justify-center transition-all active:scale-95"
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute right-0 w-10 h-10 rounded-full text-slate-300 hover:text-white hover:bg-white/10 hidden sm:flex items-center justify-center transition-colors"
          aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
          title={fullscreen ? 'Exit full screen' : 'Full screen'}
        >
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
