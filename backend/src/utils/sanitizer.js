/**
 * HTML Sanitizer Utility for WYSIWYG Article Content
 * Employs sanitize-html with whitelist filtering to prevent XSS while preserving rich journalistic styling
 */

import sanitizeHtml from 'sanitize-html';

export const allowedArticleTags = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'span', 'strong', 'em', 'u', 's', 'strike',
  'blockquote', 'q', 'cite', 'pre', 'code',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'a', 'img', 'figure', 'figcaption',
  'hr', 'br', 'sub', 'sup', 'mark', 'del', 'ins',
  'iframe' // Allowed specifically for embed services (YouTube/Vimeo) with host validation
];

export const allowedArticleAttributes = {
  a: ['href', 'name', 'target', 'rel', 'title', 'class'],
  img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'class'],
  iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'class'],
  table: ['class', 'border', 'cellspacing', 'cellpadding'],
  th: ['colspan', 'rowspan', 'scope', 'class'],
  td: ['colspan', 'rowspan', 'class'],
  blockquote: ['cite', 'class'],
  '*': ['class', 'id', 'data-*']
};

export const sanitizeArticleHtml = (dirtyHtml) => {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') {
    return '';
  }

  return sanitizeHtml(dirtyHtml, {
    allowedTags: allowedArticleTags,
    allowedAttributes: allowedArticleAttributes,
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['data', 'http', 'https']
    },
    allowedIframeHostnames: [
      'www.youtube.com',
      'youtube.com',
      'player.vimeo.com',
      'open.spotify.com'
    ],
    transformTags: {
      'a': (tagName, attribs) => {
        // Enforce secure external links
        if (attribs.href && attribs.href.startsWith('http')) {
          attribs.target = '_blank';
          attribs.rel = 'noopener noreferrer nofollow';
        }
        return {
          tagName: 'a',
          attribs
        };
      },
      'img': (tagName, attribs) => {
        // Enable native lazy loading
        if (!attribs.loading) {
          attribs.loading = 'lazy';
        }
        return {
          tagName: 'img',
          attribs
        };
      }
    }
  });
};

/**
 * Strips all HTML to generate clean excerpts or metadata strings
 */
export const stripHtmlToPlainText = (htmlString, maxLength = 200) => {
  if (!htmlString || typeof htmlString !== 'string') return '';
  const clean = sanitizeHtml(htmlString, { allowedTags: [], allowedAttributes: {} });
  const trimmed = clean.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.substring(0, maxLength) + '...';
};

export default {
  sanitizeArticleHtml,
  stripHtmlToPlainText,
  allowedArticleTags,
  allowedArticleAttributes
};
