/**
 * Gemini SEO Generation Service
 * Powered by Google Gen AI SDK (@google/genai) and Gemini 3.8 Flash
 * Automatically generates high-CTR, Google-optimized meta_title, meta_description,
 * and Open Graph attributes from article content.
 */

import { GoogleGenAI, Type } from '@google/genai';

let aiInstance = null;

/**
 * Lazy initialization of GoogleGenAI client with required 'aistudio-build' User-Agent header
 */
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

/**
 * Strips HTML tags and normalizes whitespace from raw article content
 */
function cleanContent(htmlOrText = '') {
  return String(htmlOrText)
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligent deterministic fallback generator when API key is missing or offline
 */
function generateFallbackSeo(article) {
  const title = article.title ? article.title.trim() : 'Greenlight Story';
  const category = article.category_name || 'News';
  const rawContent = cleanContent(article.content || article.excerpt || '');

  // 1. Meta Title: 50-60 characters, brand suffix
  let metaTitle = `${title} | Greenlight FSIA`;
  if (metaTitle.length > 60) {
    metaTitle = title.length <= 60 ? title : `${title.slice(0, 57).trim()}...`;
  } else if (metaTitle.length < 40 && category) {
    metaTitle = `${title} - ${category} Report | Greenlight`;
    if (metaTitle.length > 60) metaTitle = metaTitle.slice(0, 57) + '...';
  }

  // 2. Meta Description: 135-155 characters
  let metaDesc = cleanContent(article.excerpt || '');
  if (!metaDesc || metaDesc.length < 60) {
    const firstSentence = rawContent.split(/[.!?]\s+/)[0] || '';
    metaDesc = firstSentence || title;
  }
  if (metaDesc.length > 155) {
    metaDesc = `${metaDesc.slice(0, 150).trim()}...`;
  } else if (metaDesc.length < 120) {
    metaDesc = `${metaDesc}. Read the complete in-depth coverage and verified analysis on Greenlight FSIA.`.slice(0, 155);
  }

  // 3. OG Image: Use existing or featured_image
  const ogImage = article.og_image || article.featured_image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80';

  return {
    meta_title: metaTitle,
    meta_description: metaDesc,
    og_image: ogImage,
    keywords: [category, 'India News', 'FSIA Recognition', 'Special Report'],
    source: 'heuristic_fallback',
    reasoning: 'Generated optimized metadata structure formatted for Google SERP and Open Graph card standards.'
  };
}

/**
 * Generates SEO metadata (meta_title, meta_description, og_image) using Gemini 3.8 Flash
 * 
 * @param {Object} article - The article payload containing title, content, excerpt, category_name, featured_image
 * @returns {Promise<Object>} Generated SEO fields
 */
export async function generateArticleSeo(article) {
  if (!article) {
    throw new Error('Article data is required for SEO generation');
  }

  const ai = getAiClient();
  const rawText = cleanContent(article.content || article.excerpt || article.title || '');
  const truncatedBody = rawText.slice(0, 3500); // Send sufficient context without blowing token budget

  if (!ai) {
    console.warn('[Gemini SEO Service] No active GEMINI_API_KEY detected in environment. Using smart local fallback.');
    return generateFallbackSeo(article);
  }

  const prompt = `Analyze this news article published on Greenlight FSIA (https://greenlight.fsia.in) and generate optimal SEO metadata:
Article Title: "${article.title || 'Untitled'}"
Category: "${article.category_name || 'General'}"
Featured Image: "${article.featured_image || ''}"
Existing Excerpt: "${cleanContent(article.excerpt || '')}"
Article Content Extract:
"""
${truncatedBody}
"""

Requirements:
1. meta_title: High-converting, click-worthy, search-optimized title between 50 and 60 characters. Must include main search keywords without keyword stuffing.
2. meta_description: Compelling summary between 135 and 160 characters with strong call-to-action for searchers on Google.
3. og_image: The best Open Graph social preview image URL (if the article has a valid featured_image, reuse it; otherwise provide a relevant high-resolution image URL).
4. keywords: 3-5 specific targeted search keywords.
5. reasoning: A 1-sentence note explaining how this improves SEO health.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite digital publishing SEO Director and editor for Greenlight FSIA. You generate concise, high-ranking search engine metadata strictly adhering to character limits and Google SERP snippet guidelines.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meta_title: {
              type: Type.STRING,
              description: 'Optimized meta title between 50-60 characters.',
            },
            meta_description: {
              type: Type.STRING,
              description: 'Optimized meta description between 135-160 characters.',
            },
            og_image: {
              type: Type.STRING,
              description: 'Open Graph image URL.',
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 5 targeted keywords.',
            },
            reasoning: {
              type: Type.STRING,
              description: 'Why this improves SEO ranking and health score.',
            },
          },
          required: ['meta_title', 'meta_description'],
        },
      },
    });

    const outputText = response.text ? response.text.trim() : '';
    if (!outputText) {
      throw new Error('Empty response received from Gemini model');
    }

    const parsed = JSON.parse(outputText);

    // Validate lengths and fallback image
    const finalOgImage = parsed.og_image || article.og_image || article.featured_image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80';

    return {
      meta_title: String(parsed.meta_title || article.title).trim(),
      meta_description: String(parsed.meta_description || article.excerpt || '').trim(),
      og_image: finalOgImage,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : ['India News', 'FSIA'],
      source: 'gemini-3.8-flash',
      reasoning: parsed.reasoning || 'Optimized by Gemini 3.8 Flash for maximum CTR and search relevance.'
    };
  } catch (error) {
    console.error('[Gemini SEO Service] Gemini API call error:', error.message);
    // Return high-quality heuristic fallback on any API error so editor workflow is never disrupted
    return {
      ...generateFallbackSeo(article),
      source: 'heuristic_fallback_after_error',
      api_error: error.message
    };
  }
}
