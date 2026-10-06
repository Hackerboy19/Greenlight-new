import React from 'react';
import type { MagazinePage } from '../../types';

export interface MagazinePageViewProps {
  page: MagazinePage;
  /** 1-based page number printed in the footer. */
  number: number;
  issueTitle: string;
  /** Covers are drawn as stiff pages by the flipbook. */
  hard?: boolean;
  /** Load the image straight away (the pages near the start). */
  eager?: boolean;
}

/**
 * One leaf of the flipbook. react-pageflip needs each page to be a DOM element
 * it can take a ref to, so this forwards its ref to the outer div.
 */
export const MagazinePageView = React.forwardRef<HTMLDivElement, MagazinePageViewProps>(
  ({ page, number, issueTitle, hard, eager }, ref) => (
    <div ref={ref} className="magazine-page" data-density={hard ? 'hard' : 'soft'}>
      {page.kind === 'image' && page.image_url ? (
        <div className="relative w-full h-full bg-slate-900">
          <img
            src={page.image_url}
            alt={page.alt_text || `${issueTitle}, page ${number}`}
            loading={eager ? 'eager' : 'lazy'}
            draggable={false}
            className="w-full h-full object-cover select-none"
          />
          {(page.heading || page.body) && (
            <div className="absolute inset-x-0 bottom-0 pt-24 pb-[8%] px-[8%] bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent text-white">
              <span className="block w-10 h-1 rounded-full bg-emerald-500 mb-3" aria-hidden="true" />
              {page.heading && <h2 className="font-serif text-[6.2cqw] font-bold leading-tight">{page.heading}</h2>}
              {page.body && <p className="mt-2 text-[2.9cqw] text-slate-200 line-clamp-4">{page.body}</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex flex-col bg-[#fbfaf7] text-slate-800 px-[9%] pt-[10%] pb-[7%]">
          <div className="flex items-center gap-2 text-[2.1cqw] font-semibold tracking-[0.2em] uppercase text-emerald-700">
            <span className="w-5 h-px bg-emerald-600" aria-hidden="true" />
            <span className="truncate">{issueTitle}</span>
          </div>
          {page.heading && (
            <h2 className="mt-4 font-serif text-[5.8cqw] font-bold leading-tight text-slate-900">{page.heading}</h2>
          )}
          <div className="mt-4 flex-1 overflow-hidden font-serif text-[3.1cqw] leading-relaxed text-slate-700 space-y-3">
            {page.body
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((para, i) =>
                para.startsWith('## ') ? (
                  <h3 key={i} className="pt-1 font-serif text-[1.15em] font-bold leading-snug text-slate-900">
                    {para.slice(3)}
                  </h3>
                ) : (
                <p key={i} className={i === 0 && page.heading ? 'first-letter:float-left first-letter:mr-1.5 first-letter:font-bold first-letter:text-emerald-700 first-letter:text-[2.6em] first-letter:leading-[0.9]' : ''}>
                  {para.split('\n').map((line, j, lines) => (
                    <React.Fragment key={j}>
                      {line}
                      {j < lines.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
                )
              )}
          </div>
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[2.1cqw] font-semibold text-slate-400">
            <span>Greenlight</span>
            <span>{number}</span>
          </div>
        </div>
      )}
    </div>
  )
);
MagazinePageView.displayName = 'MagazinePageView';

/** The plain back cover added when an issue has an odd number of pages, so the book closes. */
export const MagazineBackCover = React.forwardRef<HTMLDivElement, { issueTitle: string }>(({ issueTitle }, ref) => (
  <div ref={ref} className="magazine-page" data-density="hard">
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 text-white text-center px-8">
      <span className="w-10 h-1 rounded-full bg-emerald-500" aria-hidden="true" />
      <div className="font-serif text-2xl font-bold">Greenlight</div>
      <div className="text-[11px] tracking-[0.2em] uppercase text-emerald-300">{issueTitle}</div>
      <div className="text-[11px] text-slate-400">greenlight.fsia.in</div>
    </div>
  </div>
));
MagazineBackCover.displayName = 'MagazineBackCover';
