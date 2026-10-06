import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { MagazinePage } from '../../../types';
import { MagazinePageView } from '../../magazine/MagazinePageView';

// The flipbook's page shape (3:4). Page text is sized as a share of the page
// width, so a page that fits here fits at any size. The height is trimmed by
// 5% to leave room for line breaks falling differently on other screens.
const WIDTH = 450;
const HEIGHT = Math.round(600 * 0.95);

/**
 * Lays text pages out off-screen, exactly as the flipbook draws them, to tell
 * whether their text fits. Call dispose() when done.
 */
export function createPageMeasurer(issueTitle: string) {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${WIDTH}px;height:${HEIGHT}px;visibility:hidden;pointer-events:none;`;
  document.body.appendChild(host);
  const root = createRoot(host);

  const fits = (page: MagazinePage) => {
    flushSync(() => root.render(<MagazinePageView page={page} number={1} issueTitle={issueTitle || 'Greenlight'} />));
    // In the flipbook, page-flip gives each page its size.
    const leaf = host.firstElementChild as HTMLElement | null;
    if (leaf) leaf.style.cssText = 'width:100%;height:100%;';
    const body = host.querySelector<HTMLElement>('.magazine-page .flex-1');
    return !body || body.scrollHeight <= body.clientHeight + 1;
  };

  const dispose = () => {
    root.unmount();
    host.remove();
  };

  return { fits, dispose };
}
