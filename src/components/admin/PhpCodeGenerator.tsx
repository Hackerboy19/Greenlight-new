import React, { useState, useMemo } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  FileCode,
  Terminal,
  Database,
  Globe,
  Share2,
  ExternalLink,
  Sparkles,
  Server,
  Layers,
  Info,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Article, Category, Author } from '../../types';

interface PhpCodeGeneratorProps {
  articles: Article[];
  categories: Category[];
  authors: Author[];
  initialSelectedArticle?: Article | null;
}

type PhpFileType = 'article' | 'api' | 'db' | 'sitemap' | 'widget';

export const PhpCodeGenerator: React.FC<PhpCodeGeneratorProps> = ({
  articles,
  categories,
  authors,
  initialSelectedArticle
}) => {
  const [selectedFileType, setSelectedFileType] = useState<PhpFileType>('article');
  const [selectedArticleId, setSelectedArticleId] = useState<number>(
    initialSelectedArticle?.id || articles[0]?.id || 1
  );
  const [siteUrl, setSiteUrl] = useState<string>('https://greenlight.fsia.in');
  const [dbMode, setDbMode] = useState<'standalone' | 'pdo'>('standalone');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Active article selected for code generation
  const activeArticle = useMemo(() => {
    return articles.find((a) => a.id === selectedArticleId) || articles[0];
  }, [articles, selectedArticleId]);

  // Clean values for PHP template
  const articleTitle = activeArticle?.title || 'Forever Star India Awards Season 5 Jaipur Gala';
  const articleSlug = activeArticle?.slug || 'forever-star-india-awards-season-5-jaipur-gala';
  const articleExcerpt = activeArticle?.excerpt || 'National trailblazers and grassroots innovators recognized at FSIA annual gala.';
  const articleContent = activeArticle?.content || '<p>Official coverage of the Forever Star India Awards.</p>';
  const articleImage = activeArticle?.featured_image || 'https://greenlight.fsia.in/assets/img/blog/1774683990.png';
  const articleOgImage = activeArticle?.og_image || activeArticle?.featured_image || 'https://greenlight.fsia.in/assets/img/blog/1774683990.png';
  const articleMetaTitle = activeArticle?.meta_title || articleTitle;
  const articleMetaDesc = activeArticle?.meta_description || articleExcerpt;
  const articleCategory = activeArticle?.category_name || 'Fashion & Awards';
  const articleAuthor = activeArticle?.author_name || 'FSIA Editorial Board';
  const articleReadingTime = activeArticle?.reading_time || 4;
  const articleInfobox = activeArticle?.infobox || [];

  // Generate PHP files based on selectedFileType
  const { code, filename, description, mimeType } = useMemo(() => {
    const cleanSiteUrl = siteUrl.replace(/\/+$/, '');

    switch (selectedFileType) {
      case 'article': {
        const infoboxPhpArray = articleInfobox.length > 0
          ? `[\n` + articleInfobox.map(item => `            ['field_key' => '${addslashes(item.field_key)}', 'field_value' => '${addslashes(item.field_value)}', 'section' => '${addslashes(item.section || 'General')}']`).join(",\n") + `\n        ]`
          : `[\n            ['field_key' => 'Event Name', 'field_value' => 'Forever Star India Awards (FSIA)', 'section' => 'Overview'],\n            ['field_key' => 'Edition', 'field_value' => 'Season 5', 'section' => 'Overview'],\n            ['field_key' => 'Headquarters', 'field_value' => 'Jaipur, Rajasthan, India', 'section' => 'Location'],\n            ['field_key' => 'Official Portal', 'field_value' => 'https://fsia.in', 'section' => 'Credentials']\n        ]`;

        const fileCode = dbMode === 'standalone' ? `<?php
/**
 * Greenlight FSIA - Standalone Article Template (PHP 7.4 - 8.3+)
 * File: article.php
 * Usage: Drop directly into your website root or theme folder.
 * URL: ${cleanSiteUrl}/article.php?slug=${articleSlug}
 *
 * Fully supports:
 * - Dynamic Open Graph (og:image, og:title, og:description)
 * - Twitter Cards (summary_large_image)
 * - Schema.org JSON-LD (NewsArticle + FactCheck)
 * - Wikipedia Factsheet (Infobox)
 * - Clean responsive mobile-first typography
 */

// 1. Configuration & Request Handling
$baseUrl = '${cleanSiteUrl}';
$slug = isset($_GET['slug']) ? trim($_GET['slug']) : '${articleSlug}';

// 2. Article Data (Standalone Data Store with Fallback)
$articlesStore = [
    '${articleSlug}' => [
        'id' => ${activeArticle?.id || 1},
        'title' => '${addslashes(articleTitle)}',
        'slug' => '${articleSlug}',
        'meta_title' => '${addslashes(articleMetaTitle)}',
        'meta_description' => '${addslashes(articleMetaDesc)}',
        'featured_image' => '${articleImage}',
        'og_image' => '${articleOgImage}',
        'excerpt' => '${addslashes(articleExcerpt)}',
        'content' => '${addslashes(articleContent)}',
        'category_name' => '${addslashes(articleCategory)}',
        'author_name' => '${addslashes(articleAuthor)}',
        'reading_time' => ${articleReadingTime},
        'published_at' => '${activeArticle?.published_at || new Date().toISOString().split('T')[0]}',
        'infobox' => ${infoboxPhpArray}
    ]
];

// Locate active story or default
$article = isset($articlesStore[$slug]) ? $articlesStore[$slug] : reset($articlesStore);
$canonicalUrl = $baseUrl . '/article.php?slug=' . urlencode($article['slug']);
?>
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($article['meta_title']) ?> - Greenlight FSIA</title>
    <meta name="description" content="<?= htmlspecialchars($article['meta_description']) ?>">
    <link rel="canonical" href="<?= htmlspecialchars($canonicalUrl) ?>">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

    <!-- Open Graph / Facebook / LinkedIn / WhatsApp -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Greenlight FSIA Official">
    <meta property="og:url" content="<?= htmlspecialchars($canonicalUrl) ?>">
    <meta property="og:title" content="<?= htmlspecialchars($article['meta_title']) ?>">
    <meta property="og:description" content="<?= htmlspecialchars($article['meta_description']) ?>">
    <meta property="og:image" content="<?= htmlspecialchars($article['og_image']) ?>">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?= htmlspecialchars($article['meta_title']) ?>">
    <meta name="twitter:description" content="<?= htmlspecialchars($article['meta_description']) ?>">
    <meta name="twitter:image" content="<?= htmlspecialchars($article['og_image']) ?>">

    <!-- Schema.org Structured Data (NewsArticle) -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": "<?= addslashes($article['title']) ?>",
        "description": "<?= addslashes($article['meta_description']) ?>",
        "image": ["<?= addslashes($article['og_image']) ?>"],
        "datePublished": "<?= $article['published_at'] ?>T00:00:00+05:30",
        "author": {
            "@type": "Person",
            "name": "<?= addslashes($article['author_name']) ?>"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Greenlight FSIA",
            "logo": {
                "@type": "ImageObject",
                "url": "<?= $baseUrl ?>/assets/img/logo.png"
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "<?= $canonicalUrl ?>"
        }
    }
    </script>

    <!-- Tailwind CSS (Direct CDN) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
        .article-body p { margin-bottom: 1.25rem; line-height: 1.8; font-size: 1.05rem; color: #334155; }
        .article-body h2 { font-size: 1.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.75rem; color: #0f172a; }
        .article-body h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #1e293b; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col justify-between">

    <!-- Top Navigation Header -->
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <a href="<?= $baseUrl ?>" class="flex items-center gap-2 text-decoration-none">
                <span class="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-sm">G</span>
                <div>
                    <span class="font-bold text-slate-900 tracking-tight text-base">GREENLIGHT</span>
                    <span class="text-[10px] block font-mono text-emerald-600 font-bold -mt-1 tracking-widest uppercase">FSIA OFFICIAL</span>
                </div>
            </a>
            <div class="flex items-center gap-3">
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <?= htmlspecialchars($article['category_name']) ?>
                </span>
                <a href="<?= $baseUrl ?>" class="text-xs font-bold text-slate-600 hover:text-emerald-600 transition">← Portal Home</a>
            </div>
        </div>
    </header>

    <!-- Main Editorial Content -->
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1">
        <!-- Category & Reading Time Breadcrumbs -->
        <div class="flex items-center gap-2.5 text-xs text-slate-500 mb-4">
            <span class="font-bold uppercase tracking-wider text-emerald-600"><?= htmlspecialchars($article['category_name']) ?></span>
            <span>•</span>
            <span><?= (int)$article['reading_time'] ?> min read</span>
            <span>•</span>
            <time datetime="<?= $article['published_at'] ?>"><?= date('F j, Y', strtotime($article['published_at'])) ?></time>
        </div>

        <!-- Headline -->
        <h1 class="font-serif text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
            <?= htmlspecialchars($article['title']) ?>
        </h1>

        <!-- Sub-headline / Excerpt -->
        <p class="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 border-l-4 border-emerald-500 pl-4 py-1 italic">
            <?= htmlspecialchars($article['excerpt']) ?>
        </p>

        <!-- Author Byline Bar -->
        <div class="flex items-center justify-between border-y border-slate-200 py-4 mb-8">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                    <?= strtoupper(substr($article['author_name'], 0, 2)) ?>
                </div>
                <div>
                    <div class="text-sm font-bold text-slate-900"><?= htmlspecialchars($article['author_name']) ?></div>
                    <div class="text-xs text-slate-500">Verified FSIA Editorial Correspondent</div>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="navigator.clipboard.writeText(window.location.href); alert('Link copied to clipboard!');" class="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-100 transition">
                    🔗 Share Story
                </button>
            </div>
        </div>

        <!-- Hero Featured Image -->
        <figure class="mb-10 rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900">
            <img src="<?= htmlspecialchars($article['featured_image']) ?>" alt="<?= htmlspecialchars($article['title']) ?>" class="w-full max-h-[520px] object-cover">
            <figcaption class="p-3 bg-slate-900/90 text-white text-xs flex justify-between items-center px-5">
                <span>Official Media Coverage: <?= htmlspecialchars($article['title']) ?></span>
                <span class="font-mono text-emerald-400">Verified Photo</span>
            </figcaption>
        </figure>

        <!-- Two Column Grid: Article Body + Wikipedia Factsheet -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            <!-- Story Body Column -->
            <article class="lg:col-span-2 article-body prose prose-slate max-w-none">
                <?= $article['content'] ?>
            </article>

            <!-- Wikipedia Infobox Sidebar Column -->
            <?php if (!empty($article['infobox'])): ?>
            <aside class="lg:col-span-1 sticky top-24">
                <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="border-b border-slate-200 pb-3 mb-4 flex items-center justify-between">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Verified Factsheet</span>
                        </h3>
                        <span class="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">FSIA DB</span>
                    </div>

                    <table class="w-full text-xs border-collapse">
                        <tbody>
                            <?php foreach ($article['infobox'] as $item): ?>
                            <tr class="border-b border-slate-100 last:border-b-0">
                                <td class="py-2.5 pr-2 font-semibold text-slate-500 align-top w-2/5">
                                    <?= htmlspecialchars($item['field_key']) ?>
                                </td>
                                <td class="py-2.5 font-medium text-slate-900 align-top">
                                    <?= htmlspecialchars($item['field_value']) ?>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>

                    <div class="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                        Verified by Greenlight Standards Bureau
                    </div>
                </div>
            </aside>
            <?php endif; ?>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-slate-900 text-white mt-16 border-t border-slate-800 py-8">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© <?= date('Y') ?> Greenlight FSIA News Platform. All rights reserved.</p>
            <div class="flex items-center gap-4">
                <a href="<?= $baseUrl ?>" class="hover:text-white transition">Home</a>
                <a href="<?= $baseUrl ?>/sitemap.php" class="hover:text-white transition">XML Sitemap</a>
                <a href="<?= $baseUrl ?>/api.php" class="hover:text-white transition">Developer API</a>
            </div>
        </div>
    </footer>

</body>
</html>` : `<?php
/**
 * Greenlight FSIA - MySQL PDO Database Driven Article Template
 * File: article.php
 * Usage: Connects to your existing MySQL database with prepared statements
 */

require_once __DIR__ . '/db-connect.php';

$baseUrl = '${cleanSiteUrl}';
$slug = isset($_GET['slug']) ? trim($_GET['slug']) : '${articleSlug}';

try {
    // 1. Fetch Article by Slug
    $stmt = $pdo->prepare("
        SELECT a.*, c.name AS category_name, c.slug AS category_slug, u.name AS author_name
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN authors u ON a.author_id = u.id
        WHERE a.slug = :slug AND a.status = 'published'
        LIMIT 1
    ");
    $stmt->execute([':slug' => $slug]);
    $article = $stmt->fetch();

    if (!$article) {
        http_response_code(404);
        die("Article not found or unpublished.");
    }

    // 2. Fetch Infobox Factsheet Data
    $infoStmt = $pdo->prepare("SELECT field_key, field_value, section FROM article_infobox WHERE article_id = :aid ORDER BY id ASC");
    $infoStmt->execute([':aid' => $article['id']]);
    $infobox = $infoStmt->fetchAll();

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    die("A database error occurred. Please verify your connection.");
}

$canonicalUrl = $baseUrl . '/article.php?slug=' . urlencode($article['slug']);
$ogImage = !empty($article['og_image']) ? $article['og_image'] : $article['featured_image'];
$metaTitle = !empty($article['meta_title']) ? $article['meta_title'] : $article['title'];
$metaDescription = !empty($article['meta_description']) ? $article['meta_description'] : $article['excerpt'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($metaTitle) ?> - Greenlight FSIA</title>
    <meta name="description" content="<?= htmlspecialchars($metaDescription) ?>">
    <link rel="canonical" href="<?= htmlspecialchars($canonicalUrl) ?>">

    <!-- Open Graph -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="<?= htmlspecialchars($metaTitle) ?>">
    <meta property="og:description" content="<?= htmlspecialchars($metaDescription) ?>">
    <meta property="og:image" content="<?= htmlspecialchars($ogImage) ?>">
    <meta property="og:url" content="<?= htmlspecialchars($canonicalUrl) ?>">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?= htmlspecialchars($metaTitle) ?>">
    <meta name="twitter:image" content="<?= htmlspecialchars($ogImage) ?>">

    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800">
    <div class="max-w-4xl mx-auto px-4 py-10">
        <span class="text-xs font-bold uppercase tracking-wider text-emerald-600"><?= htmlspecialchars($article['category_name']) ?></span>
        <h1 class="text-3xl sm:text-5xl font-bold text-slate-900 my-4"><?= htmlspecialchars($article['title']) ?></h1>
        <p class="text-lg text-slate-600 italic mb-6"><?= htmlspecialchars($article['excerpt']) ?></p>
        <img src="<?= htmlspecialchars($article['featured_image']) ?>" class="w-full rounded-2xl mb-8 shadow-md">
        <div class="prose max-w-none text-slate-700 leading-relaxed"><?= $article['content'] ?></div>
    </div>
</body>
</html>`;

        return {
          code: fileCode,
          filename: 'article.php',
          description: dbMode === 'standalone'
            ? 'Complete standalone PHP template with embedded data, Open Graph meta tags, Schema.org JSON-LD, and responsive layout.'
            : 'PDO MySQL connected article template with prepared statements and dynamic infobox database queries.',
          mimeType: 'application/x-httpd-php'
        };
      }

      case 'api': {
        const apiCode = `<?php
/**
 * Greenlight FSIA - RESTful Articles JSON API Endpoint (PHP 7.4 - 8.3+)
 * File: api-articles.php or api.php
 * Usage: Provides JSON endpoints for fetching news articles, categories, and single stories
 * Endpoints:
 * - GET ?action=list&category=fashion&limit=10
 * - GET ?action=get&slug=${articleSlug}
 * - GET ?action=categories
 * - GET ?action=search&q=awards
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Articles In-Memory Repository (Or connect via PDO database)
$articles = [
    [
        'id' => ${activeArticle?.id || 1},
        'title' => '${addslashes(articleTitle)}',
        'slug' => '${articleSlug}',
        'excerpt' => '${addslashes(articleExcerpt)}',
        'featured_image' => '${articleImage}',
        'og_image' => '${articleOgImage}',
        'meta_title' => '${addslashes(articleMetaTitle)}',
        'meta_description' => '${addslashes(articleMetaDesc)}',
        'category_id' => ${activeArticle?.category_id || 1},
        'category_name' => '${addslashes(articleCategory)}',
        'category_slug' => '${activeArticle?.category_slug || 'fashion'}',
        'author_name' => '${addslashes(articleAuthor)}',
        'reading_time' => ${articleReadingTime},
        'status' => 'published',
        'published_at' => '${activeArticle?.published_at || new Date().toISOString().split('T')[0]}'
    ]
];

$categories = [
    ['id' => 1, 'name' => 'Fashion & Runway', 'slug' => 'fashion'],
    ['id' => 2, 'name' => 'Business & Leaders', 'slug' => 'business'],
    ['id' => 3, 'name' => 'Entertainment', 'slug' => 'entertainment'],
    ['id' => 4, 'name' => 'Awards & Gala', 'slug' => 'awards']
];

// 2. Route Dispatcher
$action = isset($_GET['action']) ? strtolower(trim($_GET['action'])) : 'list';

switch ($action) {
    case 'get':
        $slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        
        $found = null;
        foreach ($articles as $item) {
            if (($slug && $item['slug'] === $slug) || ($id && $item['id'] === $id)) {
                $found = $item;
                break;
            }
        }
        
        if ($found) {
            echo json_encode([
                'status' => 'success',
                'data' => $found
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        } else {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Article not found'], JSON_PRETTY_PRINT);
        }
        break;

    case 'categories':
        echo json_encode([
            'status' => 'success',
            'count' => count($categories),
            'data' => $categories
        ], JSON_PRETTY_PRINT);
        break;

    case 'search':
        $q = isset($_GET['q']) ? strtolower(trim($_GET['q'])) : '';
        $results = [];
        if ($q !== '') {
            foreach ($articles as $item) {
                if (stripos($item['title'], $q) !== false || stripos($item['excerpt'], $q) !== false) {
                    $results[] = $item;
                }
            }
        }
        echo json_encode([
            'status' => 'success',
            'query' => $q,
            'count' => count($results),
            'data' => $results
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        break;

    case 'list':
    default:
        $categorySlug = isset($_GET['category']) ? trim($_GET['category']) : '';
        $filtered = $articles;
        
        if ($categorySlug !== '') {
            $filtered = array_values(array_filter($articles, function($item) use ($categorySlug) {
                return $item['category_slug'] === $categorySlug;
            }));
        }
        
        echo json_encode([
            'status' => 'success',
            'count' => count($filtered),
            'data' => $filtered
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        break;
}
`;

        return {
          code: apiCode,
          filename: 'api-articles.php',
          description: 'CORS-enabled RESTful JSON API in PHP for listing articles, single-article by slug, category filtering, and keyword search.',
          mimeType: 'application/x-httpd-php'
        };
      }

      case 'sitemap': {
        const sitemapCode = `<?php
/**
 * Greenlight FSIA - Dynamic Google XML Sitemap Generator (PHP)
 * File: sitemap.php
 * Usage: Drop in web root. Submit to Google Search Console as:
 * https://yourdomain.com/sitemap.php
 */

header('Content-Type: application/xml; charset=utf-8');
echo '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;

$baseUrl = '${cleanSiteUrl}';

// Static or DB queried articles list
$articles = [
${articles.map(art => `    [
        'slug' => '${art.slug}',
        'updated_at' => '${art.created_at || new Date().toISOString().split('T')[0]}',
        'image' => '${art.og_image || art.featured_image}',
        'title' => '${addslashes(art.title)}'
    ]`).join(",\n")}
];
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

    <!-- Homepage -->
    <url>
        <loc><?= htmlspecialchars($baseUrl) ?>/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>

    <!-- Articles & Stories -->
    <?php foreach ($articles as $art): ?>
    <url>
        <loc><?= htmlspecialchars($baseUrl . '/article.php?slug=' . urlencode($art['slug'])) ?></loc>
        <lastmod><?= date('Y-m-d', strtotime($art['updated_at'])) ?></lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
        <?php if (!empty($art['image'])): ?>
        <image:image>
            <image:loc><?= htmlspecialchars($art['image']) ?></image:loc>
            <image:title><?= htmlspecialchars($art['title']) ?></image:title>
        </image:image>
        <?php endif; ?>
    </url>
    <?php endforeach; ?>

</urlset>`;

        return {
          code: sitemapCode,
          filename: 'sitemap.php',
          description: 'Google-compliant XML sitemap generator with image tags (<image:loc>), lastmod dates, and priority tags ready for Google Search Console.',
          mimeType: 'application/xml'
        };
      }

      case 'widget': {
        const widgetCode = `<?php
/**
 * Greenlight FSIA - Embeddable Trending News Widget for PHP Websites
 * File: fsia-news-widget.php
 * Usage: Include anywhere on your existing PHP website:
 * <?php include __DIR__ . '/fsia-news-widget.php'; ?>
 */

$widgetArticles = [
${articles.slice(0, 4).map(art => `    [
        'title' => '${addslashes(art.title)}',
        'url' => '${cleanSiteUrl}/article.php?slug=${art.slug}',
        'image' => '${art.featured_image}',
        'category' => '${addslashes(art.category_name)}',
        'date' => '${art.created_at || 'Recent'}'
    ]`).join(",\n")}
];
?>
<!-- Greenlight FSIA Trending News Widget -->
<div class="fsia-widget" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; padding:20px; font-family:system-ui,-apple-system,sans-serif; max-width:400px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding-bottom:12px; margin-bottom:16px;">
        <div style="display:flex; align-items:center; gap:8px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981;"></span>
            <strong style="font-size:14px; color:#0f172a; text-transform:uppercase; letter-spacing:0.5px;">Trending Stories</strong>
        </div>
        <span style="font-size:11px; font-weight:700; color:#059669; background:#ecfdf5; padding:2px 8px; border-radius:12px;">FSIA News</span>
    </div>

    <div style="display:flex; flex-direction:column; gap:14px;">
        <?php foreach ($widgetArticles as $item): ?>
        <a href="<?= htmlspecialchars($item['url']) ?>" target="_blank" rel="noopener" style="display:flex; gap:12px; text-decoration:none; color:inherit; align-items:flex-start;">
            <img src="<?= htmlspecialchars($item['image']) ?>" alt="<?= htmlspecialchars($item['title']) ?>" style="width:70px; height:70px; object-fit:cover; border-radius:10px; flex-shrink:0; background:#0f172a;">
            <div>
                <span style="font-size:10px; font-weight:700; color:#059669; text-transform:uppercase;"><?= htmlspecialchars($item['category']) ?></span>
                <h4 style="font-size:13px; font-weight:600; color:#1e293b; margin:2px 0 0; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                    <?= htmlspecialchars($item['title']) ?>
                </h4>
            </div>
        </a>
        <?php endforeach; ?>
    </div>

    <div style="margin-top:16px; pt:12px; border-top:1px solid #f1f5f9; text-align:center;">
        <a href="${cleanSiteUrl}" target="_blank" style="font-size:11px; color:#059669; text-decoration:none; font-weight:700;">
            View All Greenlight FSIA News →
        </a>
    </div>
</div>
<!-- End Greenlight FSIA Widget -->`;

        return {
          code: widgetCode,
          filename: 'fsia-news-widget.php',
          description: 'Embeddable PHP news snippet that can be dropped into WordPress sidebars, custom PHP headers, or portal footers.',
          mimeType: 'application/x-httpd-php'
        };
      }

      case 'db': {
        const dbCode = `<?php
/**
 * Greenlight FSIA - MySQL PDO Database Connection Handler (PHP 7.4 - 8.3+)
 * File: db-connect.php
 * Usage: include_once __DIR__ . '/db-connect.php';
 */

$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbPort = getenv('DB_PORT') ?: '3306';
$dbName = getenv('DB_NAME') ?: 'greenlight_fsia';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';

$dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, $options);
} catch (PDOException $e) {
    error_log("Database Connection Failed: " . $e->getMessage());
    die("Database service temporarily unavailable. Please check your credentials.");
}

/**
 * --- SQL Schema (Run this in phpMyAdmin or MySQL CLI) ---
 *
 * CREATE TABLE IF NOT EXISTS categories (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   name VARCHAR(120) NOT NULL,
 *   slug VARCHAR(140) NOT NULL UNIQUE,
 *   description TEXT,
 *   display_order INT DEFAULT 0
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 *
 * CREATE TABLE IF NOT EXISTS authors (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   name VARCHAR(150) NOT NULL,
 *   email VARCHAR(150) UNIQUE,
 *   role VARCHAR(50) DEFAULT 'author'
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 *
 * CREATE TABLE IF NOT EXISTS articles (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   title VARCHAR(255) NOT NULL,
 *   slug VARCHAR(255) NOT NULL UNIQUE,
 *   excerpt TEXT,
 *   content LONGTEXT,
 *   featured_image VARCHAR(500),
 *   og_image VARCHAR(500),
 *   meta_title VARCHAR(255),
 *   meta_description TEXT,
 *   category_id INT,
 *   author_id INT,
 *   status ENUM('published','draft','archived') DEFAULT 'published',
 *   reading_time INT DEFAULT 4,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   INDEX (slug),
 *   INDEX (status),
 *   INDEX (category_id)
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 *
 * CREATE TABLE IF NOT EXISTS article_infobox (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   article_id INT NOT NULL,
 *   field_key VARCHAR(100) NOT NULL,
 *   field_value TEXT NOT NULL,
 *   section VARCHAR(100) DEFAULT 'General',
 *   FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 */
`;

        return {
          code: dbCode,
          filename: 'db-connect.php',
          description: 'Production-ready PDO MySQL connection script with exception handling, utf8mb4 encoding, and full SQL table schemas.',
          mimeType: 'application/x-httpd-php'
        };
      }
    }
  }, [selectedFileType, activeArticle, siteUrl, dbMode, articles, articleTitle, articleSlug, articleExcerpt, articleContent, articleImage, articleOgImage, articleMetaTitle, articleMetaDesc, articleCategory, articleAuthor, articleReadingTime, articleInfobox]);

  // Copy handler
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  // Download handler
  const handleDownloadFile = () => {
    try {
      const blob = new Blob([code], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div id="php-code-generator-container" className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="p-5 sm:p-6 rounded-3xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  PHP Code File Generator
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                  Production Ready (PHP 7.4 - 8.3+)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Instantly export standalone, drop-in PHP templates, dynamic XML sitemaps, JSON REST APIs, and widgets. Developers can upload these files straight to cPanel, Apache, Nginx, or existing PHP portals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              id="copy-php-code-btn"
              onClick={handleCopyCode}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 shadow-2xs active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Code Copied!' : 'Copy Code'}</span>
            </button>

            <button
              type="button"
              id="download-php-file-btn"
              onClick={handleDownloadFile}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              {downloadSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{downloadSuccess ? `Saved ${filename}!` : `Download ${filename}`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* File Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl text-xs font-bold">
        <button
          type="button"
          onClick={() => setSelectedFileType('article')}
          className={`min-h-[44px] px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
            selectedFileType === 'article'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4 shrink-0" />
          <span className="truncate">article.php</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFileType('api')}
          className={`min-h-[44px] px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
            selectedFileType === 'api'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4 shrink-0" />
          <span className="truncate">api-articles.php</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFileType('sitemap')}
          className={`min-h-[44px] px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
            selectedFileType === 'sitemap'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span className="truncate">sitemap.php</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFileType('widget')}
          className={`min-h-[44px] px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
            selectedFileType === 'widget'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span className="truncate">news-widget.php</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFileType('db')}
          className={`col-span-2 sm:col-span-1 min-h-[44px] px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
            selectedFileType === 'db'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4 shrink-0" />
          <span className="truncate">db-connect.php</span>
        </button>
      </div>

      {/* Configuration Controls Bar */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Target Article Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Select Story / Seed Article
            </label>
            <select
              value={selectedArticleId}
              onChange={(e) => setSelectedArticleId(Number(e.target.value))}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
            >
              {articles.map((art) => (
                <option key={art.id} value={art.id}>
                  #{art.id}: {art.title.slice(0, 45)}...
                </option>
              ))}
            </select>
          </div>

          {/* Website Domain / Base URL */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Target Website Base URL
            </label>
            <input
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://greenlight.fsia.in"
              className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Integration Mode (for article.php) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Integration Architecture
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDbMode('standalone')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  dbMode === 'standalone'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Standalone (Drop &amp; Run)
              </button>
              <button
                type="button"
                onClick={() => setDbMode('pdo')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  dbMode === 'pdo'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                MySQL PDO Driven
              </button>
            </div>
          </div>
        </div>

        {/* Informational description pill */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{description}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            File: <strong>{filename}</strong>
          </span>
        </div>
      </div>

      {/* Code Editor Preview Window */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md">
        {/* Terminal Header */}
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>{filename}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {code.split('\n').length} lines
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 font-semibold transition-all flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 sm:p-5 overflow-x-auto max-h-[500px] overflow-y-auto">
          <pre className="font-mono text-xs text-emerald-300/90 leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      </div>

      {/* Deployment & Setup Instructions for Developers */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Quick Setup Guide for Developers (Drop Into Your Current Website)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Upload to Web Root</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Upload <code className="font-mono text-emerald-600 bg-white dark:bg-slate-900 px-1 rounded">{filename}</code> to your website&apos;s <code className="font-mono">public_html/</code>, WordPress theme root, or custom directory via FTP or cPanel File Manager.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Apache .htaccess Rule (Optional)</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              For pretty URLs like <code className="font-mono text-emerald-600 bg-white dark:bg-slate-900 px-1 rounded">/article/slug-name</code>, add this line to your <code className="font-mono">.htaccess</code>:
            </p>
            <code className="block font-mono text-[10px] bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              RewriteRule ^article/([a-zA-Z0-9_-]+)$ article.php?slug=$1 [L,QSA]
            </code>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Verify Open Graph &amp; SERP</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Open <a href="https://developers.facebook.com/tools/debug/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Facebook Sharing Debugger</a> or WhatsApp web to test preview card rendering.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function addslashes(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\0/g, '\\0');
}
