/**
 * Server-side answers for reader URLs in production.
 *
 * The site is a single-page app, so every page is dist/index.html. This module
 * sends that file with the right <title>, description, canonical and social
 * tags for the page, and the right HTTP status, so Google and link previews
 * see each article as the PHP site served it. It also serves sitemap.xml and
 * robots.txt, and redirects the old site's /<slug> links like the PHP site's
 * .htaccess did.
 */

import fs from 'node:fs';
import path from 'node:path';
import { memoryStore } from '../config/database.js';

const SITE_NAME = 'Greenlight';
const DEFAULT_TITLE = 'Greenlight - International Blog & Magazine Hub | FSIA';
const DEFAULT_DESCRIPTION =
  'Greenlight is an international blog and magazine by Forever Star India Awards (FSIA) featuring talent spotlights, luxury hospitality, business leaders, startups, and culture.';

const siteUrl = () => (process.env.SITE_URL || 'https://greenlight.fsia.in').replace(/\/+$/, '');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function absoluteUrl(url) {
  if (!url) return `${siteUrl()}/logo.svg`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${siteUrl()}/${String(url).replace(/^\/+/, '')}`;
}

function plainText(html, max = 300) {
  const text = String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const published = () => memoryStore.articles.filter((a) => a.status === 'published');

/** The tags a page needs in <head>. */
function headTags({ title, description, canonical, image, type = 'website', noindex = false, article = null }) {
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(absoluteUrl(image))}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(absoluteUrl(image))}" />`
  ];
  if (noindex) tags.push('<meta name="robots" content="noindex" />');
  if (article) {
    if (article.published_at) tags.push(`<meta property="article:published_time" content="${escapeHtml(article.published_at)}" />`);
    if (article.category_name) tags.push(`<meta property="article:section" content="${escapeHtml(article.category_name)}" />`);
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description,
      image: [absoluteUrl(image)],
      datePublished: article.published_at || undefined,
      dateModified: article.updated_at || article.published_at || undefined,
      author: { '@type': 'Organization', name: article.author_name || 'FSIA Editorial Board' },
      publisher: { '@type': 'Organization', name: 'Greenlight', logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.svg') } },
      mainEntityOfPage: canonical
    };
    // "<" is escaped so article text can never close the script tag.
    tags.push(`<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`);
  }
  return tags.join('\n    ');
}

/** Swaps the default head tags in index.html for the page's own. */
function render(template, meta) {
  const stripped = template
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+(name|property)="(description|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi, '');
  return stripped.replace('</head>', `  ${headTags(meta)}\n  </head>`);
}

function sitemap() {
  const base = siteUrl();
  const articles = published().sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
  const lastmod = (d) => (d ? new Date(d).toISOString() : new Date().toISOString());
  const urls = [
    `<url><loc>${base}/</loc><lastmod>${lastmod(articles[0]?.published_at)}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`
  ];
  for (const c of memoryStore.categories) {
    const items = articles.filter((a) => a.category_id === c.id);
    if (!items.length || c.is_active === 0) continue;
    urls.push(
      `<url><loc>${base}/category/${escapeHtml(c.slug)}</loc><lastmod>${lastmod(items[0].published_at)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    );
  }
  for (const a of articles) {
    const image = a.featured_image ? `<image:image><image:loc>${escapeHtml(absoluteUrl(a.featured_image))}</image:loc></image:image>` : '';
    urls.push(
      `<url><loc>${base}/article/${escapeHtml(a.slug)}</loc><lastmod>${lastmod(a.updated_at || a.published_at)}</lastmod><changefreq>monthly</changefreq><priority>${a.is_featured ? '0.9' : '0.7'}</priority>${image}</url>`
    );
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`;
}

/**
 * Adds the reader page routes to an Express app. Call after express.static,
 * so real files (scripts, images) are served first.
 */
export function mountReaderPages(app, distPath) {
  const templatePath = path.join(distPath, 'index.html');
  let template = null;
  const page = () => (template ??= fs.readFileSync(templatePath, 'utf8'));

  const send = (res, status, meta) => {
    res.status(status).type('html').set('Cache-Control', 'no-cache').send(render(page(), meta));
  };
  const notFound = (req, res) =>
    send(res, 404, {
      title: `Page not found | ${SITE_NAME}`,
      description: DEFAULT_DESCRIPTION,
      canonical: `${siteUrl()}${req.path}`,
      noindex: true
    });

  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${siteUrl()}/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(sitemap());
  });

  app.get('/', (req, res) =>
    send(res, 200, { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, canonical: `${siteUrl()}/` })
  );

  app.get(['/admin', '/admin/*'], (req, res) =>
    send(res, 200, { title: `Admin CMS | ${SITE_NAME}`, description: DEFAULT_DESCRIPTION, canonical: `${siteUrl()}/admin`, noindex: true })
  );

  app.get('/article/:slug', (req, res) => {
    const article = published().find((a) => a.slug === req.params.slug);
    if (!article) return notFound(req, res);
    const description = article.meta_description || article.excerpt || plainText(article.content, 160);
    return send(res, 200, {
      title: article.meta_title || `${article.title} | ${SITE_NAME}`,
      description,
      canonical: `${siteUrl()}/article/${article.slug}`,
      image: article.og_image || article.featured_image,
      type: 'article',
      article
    });
  });

  app.get('/category/:slug', (req, res) => {
    const category = memoryStore.categories.find((c) => c.slug === req.params.slug && c.is_active !== 0);
    if (!category) return notFound(req, res);
    return send(res, 200, {
      title: `${category.name} | ${SITE_NAME}`,
      description: category.description || DEFAULT_DESCRIPTION,
      canonical: `${siteUrl()}/category/${category.slug}`
    });
  });

  // The old site linked articles as greenlight.fsia.in/<slug>. A permanent
  // redirect keeps their Google ranking.
  app.get('/:slug', (req, res, next) => {
    const slug = req.params.slug.replace(/\/+$/, '');
    if (!/^[A-Za-z0-9_-]+$/.test(slug)) return next();
    if (published().some((a) => a.slug === slug)) return res.redirect(301, `/article/${slug}`);
    return next();
  });

  app.get('*', notFound);
}
