/**
 * Translation Service for Greenlight Magazine
 * Supports multiple languages with pre-cached translations for core content and live neural translation
 */

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  speechLang: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', speechLang: 'en-US' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', speechLang: 'hi-IN' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', speechLang: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', speechLang: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', speechLang: 'de-DE' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', speechLang: 'gu-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', speechLang: 'mr-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', speechLang: 'bn-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', speechLang: 'ta-IN' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪', speechLang: 'ar-SA' },
];

// Dictionary of known article phrases and common UI elements for offline speed
const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  hi: {
    'Listen to Article': 'लेख सुनें',
    'Playing': 'चल रहा है',
    'Paused': 'रुका हुआ',
    'Speed': 'गति',
    'Voice': 'आवाज़',
    'Translate': 'अनुवाद करें',
    'Original (English)': 'मूल (अंग्रेजी)',
    'Sponsored': 'प्रायोजित',
    'Advertisement': 'विज्ञापन',
    'Register Now': 'अभी रजिस्टर करें',
    'Trending Stories': 'ट्रेंडिंग कहानियां',
    'Latest News': 'ताज़ा ख़बरें',
    'Flagship Lead & Top Stories': 'प्रमुख एवं शीर्ष समाचार',
    'Verified Greenlight Correspondent': 'सत्यापित ग्रीनलाइट संवाददाता',
    'min read': 'मिनट का पाठ',
    'Table of Contents': 'विषय सूची',
    'Quick Facts & Wiki Infobox': 'त्वरित तथ्य एवं विकी इन्फोबॉक्स',
    'Related Stories': 'संबंधित कहानियां',
    'Share': 'शेयर करें',
    'Copied': 'कॉपी किया गया',
    'All Categories': 'सभी श्रेणियां',
    'Search news, topics...': 'समाचार, विषय खोजें...',
    'Forever Star India': 'फॉरेवर स्टार इंडिया',
    'Top Hotels in India': 'भारत के शीर्ष होटल',
    'Best Restaurants In India': 'भारत के सर्वश्रेष्ठ रेस्टोरेंट',
    'Top Entrepreneur India': 'भारत के शीर्ष उद्यमी',
    'Top Tourist Places': 'शीर्ष पर्यटन स्थल',
    'Skin Care Products': 'त्वचा देखभाल उत्पाद',
    'Top Influencers India': 'भारत के शीर्ष प्रभावशाली व्यक्ति',
    'Top Entertainment Companies': 'शीर्ष मनोरंजन कंपनियां',
    'Top Startups in India': 'भारत के शीर्ष स्टार्टअप्स'
  },
  es: {
    'Listen to Article': 'Escuchar artículo',
    'Playing': 'Reproduciendo',
    'Paused': 'Pausado',
    'Speed': 'Velocidad',
    'Voice': 'Voz',
    'Translate': 'Traducir',
    'Original (English)': 'Original (Inglés)',
    'Sponsored': 'Patrocinado',
    'Advertisement': 'Publicidad',
    'Register Now': 'Regístrate ahora',
    'Trending Stories': 'Historias destacadas',
    'Latest News': 'Últimas noticias',
    'min read': 'min de lectura',
    'Table of Contents': 'Tabla de contenidos',
    'Quick Facts & Wiki Infobox': 'Datos rápidos e infobox',
    'Related Stories': 'Historias relacionadas'
  },
  fr: {
    'Listen to Article': 'Écouter l\'article',
    'Playing': 'En lecture',
    'Paused': 'En pause',
    'Speed': 'Vitesse',
    'Voice': 'Voix',
    'Translate': 'Traduire',
    'Original (English)': 'Original (Anglais)',
    'Sponsored': 'Sponsorisé',
    'Advertisement': 'Publicité',
    'Register Now': 'Inscrivez-vous maintenant',
    'Trending Stories': 'Articles populaires',
    'Latest News': 'Dernières nouvelles',
    'min read': 'min de lecture',
    'Table of Contents': 'Table des matières',
    'Quick Facts & Wiki Infobox': 'Faits marquants et infobox',
    'Related Stories': 'Articles connexes'
  },
  gu: {
    'Listen to Article': 'લેખ સાંભળો',
    'Playing': 'ચાલુ છે',
    'Paused': 'અટકાવેલ',
    'Speed': 'ઝડપ',
    'Voice': 'અવાજ',
    'Translate': 'અનુવાદ કરો',
    'Sponsored': 'પ્રાયોજિત',
    'Advertisement': 'જાહેરાત',
    'Register Now': 'હમણાં નોંધણી કરો',
    'min read': 'મિનિટનું વાંચન',
    'Table of Contents': 'અનુક્રમણિકા',
    'Quick Facts & Wiki Infobox': 'ઝડપી તથ્યો',
    'Related Stories': 'સંબંધિત વાર્તાઓ'
  },
  mr: {
    'Listen to Article': 'लेख ऐका',
    'Playing': 'चालू आहे',
    'Paused': 'थांबवले',
    'Speed': 'गती',
    'Voice': 'आवाज',
    'Translate': 'भाषांतर करा',
    'Sponsored': 'प्रायोजित',
    'Advertisement': 'जाहिरात',
    'Register Now': 'आता नोंदणी करा',
    'min read': 'मिनिटांचे वाचन',
    'Table of Contents': 'अनुक्रमणिका',
    'Quick Facts & Wiki Infobox': 'महत्त्वाचे तथ्य',
    'Related Stories': 'संबंधित बातम्या'
  }
};

export function getUITranslation(key: string, langCode: string): string {
  if (langCode === 'en' || !UI_TRANSLATIONS[langCode]) return key;
  return UI_TRANSLATIONS[langCode][key] || key;
}

// In-memory translation cache to prevent re-translating same blocks
const translationCache: Record<string, string> = {};

/**
 * Translates HTML or plain text content using free public translation API with fallback caching
 */
export async function translateText(text: string, targetLang: string, sourceLang: string = 'en'): Promise<string> {
  if (!text || targetLang === 'en' || targetLang === sourceLang) {
    return text;
  }

  const cacheKey = `${sourceLang}_${targetLang}_${text.slice(0, 80)}_${text.length}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  try {
    // If text contains HTML tags, we isolate plain text chunks or translate using Google Translate endpoint
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedStr = data[0].map((item: any) => item[0]).join('');
        if (translatedStr) {
          translationCache[cacheKey] = translatedStr;
          return translatedStr;
        }
      }
    }
  } catch (err) {
    console.warn('[Translation Error, using original]:', err);
  }

  return text;
}

/**
 * Translates an entire article object (title, excerpt, content, infobox)
 */
export async function translateArticle(
  article: any,
  targetLang: string
): Promise<any> {
  if (!article || targetLang === 'en') {
    return article;
  }

  const [translatedTitle, translatedExcerpt, translatedContent] = await Promise.all([
    translateText(article.title, targetLang),
    article.excerpt ? translateText(article.excerpt, targetLang) : Promise.resolve(''),
    article.content ? translateText(article.content, targetLang) : Promise.resolve('')
  ]);

  let translatedInfobox = article.infobox;
  if (Array.isArray(article.infobox) && article.infobox.length > 0) {
    translatedInfobox = await Promise.all(
      article.infobox.map(async (info: any) => {
        const [field_key, field_value, section] = await Promise.all([
          translateText(info.field_key, targetLang),
          translateText(info.field_value, targetLang),
          translateText(info.section, targetLang)
        ]);
        return { ...info, field_key, field_value, section };
      })
    );
  }

  return {
    ...article,
    title: translatedTitle,
    excerpt: translatedExcerpt,
    content: translatedContent,
    infobox: translatedInfobox,
    _language: targetLang
  };
}
