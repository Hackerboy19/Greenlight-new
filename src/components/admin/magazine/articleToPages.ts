import type { Article, MagazinePage } from '../../../types';

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

type Block = { kind: 'heading' | 'para'; text: string };

const clean = (text: string) => text.replace(/\s+/g, ' ').trim();

const isBold = (node: Node) => {
  for (let el = node.parentElement; el; el = el.parentElement) {
    if (/^(STRONG|B)$/.test(el.tagName)) return true;
    if (el.tagName === 'P') return false;
  }
  return false;
};

/**
 * A paragraph, split where the editor pressed Enter (<br>). A short line that
 * is all bold is a subhead: the old site's articles mark them that way.
 */
function paragraphBlocks(p: Element): Block[] {
  const blocks: Block[] = [];
  let text = '';
  let allBold = true;
  const end = () => {
    const line = clean(text);
    if (line) blocks.push({ kind: allBold && words(line) <= 15 ? 'heading' : 'para', text: line });
    text = '';
    allBold = true;
  };
  const walker = p.ownerDocument.createTreeWalker(p, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if ((node as Element).tagName === 'BR') end();
    } else if (node.textContent && node.textContent.trim()) {
      text += node.textContent;
      if (!isBold(node)) allBold = false;
    } else if (node.textContent) {
      text += ' ';
    }
  }
  end();
  return blocks;
}

/** The article body as plain headings and paragraphs, in reading order. */
function blocksFromHtml(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  const blocks: Block[] = [];
  const walk = (node: Element) => {
    for (const el of Array.from(node.children)) {
      const tag = el.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) {
        const text = clean(el.textContent || '');
        if (text) blocks.push({ kind: 'heading', text });
      } else if (tag === 'li') {
        const text = clean(el.textContent || '');
        if (text) blocks.push({ kind: 'para', text: `• ${text}` });
      } else if (tag === 'p') {
        blocks.push(...paragraphBlocks(el));
      } else if (tag === 'blockquote' || tag === 'figcaption') {
        const text = clean(el.textContent || '');
        if (text) blocks.push({ kind: 'para', text });
      } else if (['script', 'style', 'img', 'iframe', 'video'].includes(tag)) {
        // nothing to read
      } else if (el.children.length) {
        walk(el);
      } else {
        const text = clean(el.textContent || '');
        if (text) blocks.push({ kind: 'para', text });
      }
    }
  };
  walk(doc.body);
  // Plain text without any tags.
  if (!blocks.length && doc.body.textContent?.trim()) blocks.push({ kind: 'para', text: clean(doc.body.textContent) });
  return blocks;
}

const sentencesOf = (text: string) => (text.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [text]).map((x) => x.trim()).filter(Boolean);

/** The longest prefix of `items` (joined with `sep`) for which `ok` holds: a binary search. */
function longestFit(items: string[], sep: string, ok: (text: string) => boolean): number {
  let lo = 0;
  let hi = items.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ok(items.slice(0, mid).join(sep))) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Says whether a text page's content fits on one flipbook page. */
export type PageFits = (page: MagazinePage) => boolean;

/**
 * Turns a blog article into magazine pages: its cover photo with the headline
 * laid over it, then text pages holding the article in order. Each text page
 * is filled until `fits` says the next sentence would run off the page.
 * Subheadings in the article become "## " lines, printed as subheads.
 */
export function articleToPages(
  article: Pick<Article, 'title' | 'excerpt' | 'content' | 'featured_image'>,
  fits: PageFits
): MagazinePage[] {
  const pages: MagazinePage[] = [];
  const image = article.featured_image && /^(\/[A-Za-z0-9_-]|https:\/\/)/.test(article.featured_image) ? article.featured_image : null;

  if (image) {
    pages.push({
      kind: 'image',
      image_url: image,
      alt_text: article.title,
      heading: article.title.slice(0, 200),
      body: (article.excerpt || '').slice(0, 400)
    });
  }

  let heading = image ? '' : article.title.slice(0, 200);
  let paras: string[] = [];

  const page = (extra: string[] = []): MagazinePage => ({
    kind: 'text',
    image_url: null,
    alt_text: '',
    heading,
    body: [...paras, ...extra].join('\n\n')
  });
  const empty = () => !paras.length && !heading;
  const flush = () => {
    if (!empty()) pages.push(page());
    heading = '';
    paras = [];
  };

  for (const block of blocksFromHtml(article.content)) {
    if (block.kind === 'heading') {
      if (empty()) {
        heading = block.text.slice(0, 200);
        continue;
      }
      // A subhead needs a couple of lines of its section under it on the same page.
      const sub = `## ${block.text}`;
      if (!fits(page([sub, 'Two short lines of text follow the subhead on this page so it is not left alone.']))) flush();
      if (empty()) heading = block.text.slice(0, 200);
      else paras.push(sub);
      continue;
    }

    // Fill the page sentence by sentence, carrying the rest onto the next page.
    let rest = block.text;
    while (rest) {
      if (fits(page([rest]))) {
        paras.push(rest);
        break;
      }
      const sentences = sentencesOf(rest);
      let n = longestFit(sentences, ' ', (t) => fits(page([t])));
      let head = sentences.slice(0, n).join(' ');
      let tail = sentences.slice(n).join(' ');
      if (!n && empty()) {
        // One sentence longer than a whole page: cut it between words.
        const all = rest.split(/\s+/);
        const w = Math.max(1, longestFit(all, ' ', (t) => fits(page([t]))));
        head = all.slice(0, w).join(' ');
        tail = all.slice(w).join(' ');
      }
      if (head) paras.push(head);
      flush();
      rest = tail;
    }
  }
  flush();
  return pages;
}
