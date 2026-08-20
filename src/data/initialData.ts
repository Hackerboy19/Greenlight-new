import { Article, Category, Author } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: "FSIA Awards", slug: "fsia-awards", description: "Forever Star India Awards, Super Woman Awards, and National Talent Spotlights", display_order: 1, is_active: 1 },
  { id: 2, name: "Business & Leadership", slug: "business-leadership", description: "Corporate titans, women leaders, and visionary entrepreneurs", display_order: 2, is_active: 1 },
  { id: 3, name: "Entertainment & Fashion", slug: "entertainment-fashion", description: "Pageantry, crowning galas, runway highlights, and celebrity icons", display_order: 3, is_active: 1 },
  { id: 4, name: "Startups & Innovation", slug: "startups-innovation", description: "Homegrown D2C brands, venture funding, and technological disruption", display_order: 4, is_active: 1 },
  { id: 5, name: "Travel & Heritage", slug: "travel-heritage", description: "Jaipur cultural renaissance, luxury hospitality, and tourism guides", display_order: 5, is_active: 1 },
  { id: 6, name: "Technology & AI", slug: "technology-ai", description: "DeepTech, Digital Public Infrastructure, AI and Space Exploration", display_order: 6, is_active: 1 }
];

export const INITIAL_AUTHORS: Author[] = [
  { id: 1, name: "Rajesh Sharma", email: "rajesh@fsia.in", role: "admin", bio: "Founder & Managing Director, Forever Star India Awards (FSIA) & Greenlight Magazine Hub.", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" },
  { id: 2, name: "Pooja Agarwal", email: "pooja@greenlight.fsia.in", role: "editor", bio: "Fashion, Pageantry & Women Leadership Senior Editor at Greenlight.", avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80" },
  { id: 3, name: "Vikram Malhotra", email: "vikram@greenlight.fsia.in", role: "editor", bio: "Chief Economics & Startups Correspondent covering Indian enterprise.", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80" }
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 1,
    title: "What is FSIA? Discover India's Most Trusted Talent Recognition & Awards Platform",
    slug: "what-is-fsia-discover-indias-most-trusted-talent-recognition-platform",
    excerpt: "Forever Star India Awards (FSIA) has emerged as India's foremost socio-cultural and professional meritocracy platform, organizing national awards, beauty pageants, and entrepreneur summits.",
    content: `<h2>Understanding Forever Star India Awards (FSIA)</h2>
<p><strong>Forever Star India Awards (FSIA)</strong> is an esteemed socio-economic and talent acknowledgment platform that celebrates achievers across entertainment, business, education, medicine, science, and community development.</p>
<h3>Core Verticals of FSIA</h3>
<ul>
  <li><strong>Forever Star India Awards:</strong> Annual national gala honoring entrepreneurs, healthcare heroes, artists, and leaders.</li>
  <li><strong>The Real Super Woman Awards:</strong> An exclusive celebration of women innovators, social workers, and creators.</li>
  <li><strong>Forever Miss, Mrs & Miss Teen India:</strong> India's transparent, talent-first beauty pageantry network.</li>
  <li><strong>Greenlight Magazine:</strong> International digital publication delivering verified journalism, business reviews, and talent highlights.</li>
</ul>
<h3>Global Reach & Verification Standards</h3>
<p>Every nomination undergoes rigorous verification by an independent advisory jury, ensuring pure merit and credibility for every awardee.</p>`,
    featured_image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
    meta_title: "What is FSIA? | Forever Star India Awards Official Guide",
    meta_description: "Explore the legacy, vision, and national programs of Forever Star India Awards (FSIA), India's premier merit platform.",
    status: "published",
    is_featured: 1,
    category_id: 1,
    category_name: "FSIA Awards",
    category_slug: "fsia-awards",
    author_id: 1,
    author_name: "Rajesh Sharma",
    author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    views_count: 24500,
    reading_time: 5,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    infobox: [
      { section: "Entity Information", field_key: "Full Name", field_value: "Forever Star India Awards (FSIA)" },
      { section: "Entity Information", field_key: "Headquarters", field_value: "Jaipur, Rajasthan, India" },
      { section: "Entity Information", field_key: "Founder & MD", field_value: "Rajesh Sharma" },
      { section: "Operations", field_key: "Flagship Vertical", field_value: "Greenlight International Magazine" },
      { section: "Operations", field_key: "Official Portal", field_value: "greenlight.fsia.in" }
    ]
  },
  {
    id: 2,
    title: "Forever Star India Awards Season 5: Grand Gala in Jaipur Celebrates Over 250 National Achievers",
    slug: "forever-star-india-awards-season-5-jaipur-grand-celebration",
    excerpt: "The majestic Pink City of Jaipur hosted the 5th edition of the Forever Star India Awards, bringing together celebrities, entrepreneurs, healthcare visionaries, and social reformers.",
    content: `<h2>A Star-Studded Celebration of Excellence</h2>
<p>The 5th Season of the <strong>Forever Star India Awards</strong> concluded with monumental splendor in Jaipur, gathering over 250 distinguished honorees from across 28 Indian states.</p>
<h3>Distinguished Categories & Honorees</h3>
<p>Awards were conferred across multiple categories including Lifetime Achievement in Public Health, Youth Leadership in AI, Woman Entrepreneur of the Year, and Grassroots Community Champions.</p>`,
    featured_image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
    meta_title: "FSIA Season 5 Jaipur Gala | Forever Star India Awards Highlights",
    meta_description: "Highlights and honoree list from the 5th Forever Star India Awards Gala held in Jaipur, Rajasthan.",
    status: "published",
    is_featured: 1,
    category_id: 1,
    category_name: "FSIA Awards",
    category_slug: "fsia-awards",
    author_id: 1,
    author_name: "Rajesh Sharma",
    author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    views_count: 18920,
    reading_time: 4,
    published_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    infobox: [
      { section: "Event Overview", field_key: "Edition", field_value: "Season 5" },
      { section: "Event Overview", field_key: "Host City", field_value: "Jaipur, India" },
      { section: "Event Overview", field_key: "Honorees", field_value: "250+ National Awardees" },
      { section: "Media", field_key: "Broadcaster", field_value: "FSIA Live Streaming & Greenlight" }
    ]
  },
  {
    id: 3,
    title: "The Real Super Woman Awards 2026: Honoring Resilient Women Leaders Driving Grassroots Transformation",
    slug: "the-real-super-woman-awards-honoring-resilient-women-leaders",
    excerpt: "Celebrating the courage and conviction of women changemakers across India who are breaking barriers in entrepreneurship, education, and social service.",
    content: `<h2>Empowering the Unsung Heroes of Modern India</h2>
<p><strong>The Real Super Woman Awards</strong> represents FSIA's dedicated initiative to shine a national spotlight on women whose determination and leadership are reshaping communities.</p>`,
    featured_image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&auto=format&fit=crop&q=80",
    meta_title: "The Real Super Woman Awards 2026 | FSIA Women Empowerment",
    meta_description: "Discover the stories of resilience and leadership celebrated at The Real Super Woman Awards 2026.",
    status: "published",
    is_featured: 1,
    category_id: 2,
    category_name: "Business & Leadership",
    category_slug: "business-leadership",
    author_id: 2,
    author_name: "Pooja Agarwal",
    author_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    views_count: 15400,
    reading_time: 4,
    published_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    infobox: [
      { section: "Initiative", field_key: "Program", field_value: "The Real Super Woman Awards" },
      { section: "Initiative", field_key: "Focus Areas", field_value: "Women Leadership, Social Impact, Innovation" },
      { section: "Recognition", field_key: "Trophy & Citation", field_value: "FSIA Certified National Medal" }
    ]
  },
  {
    id: 4,
    title: "Forever Miss and Mrs India 2026: Redefining Beauty Pageantry with Talent, Intelligence & Social Purpose",
    slug: "forever-miss-and-mrs-india-2026-redefining-pageantry-talent-purpose",
    excerpt: "How FSIA's national pageantry platform is creating a safe, empowering space for aspiring models and professionals from Tier 2 and Tier 3 cities.",
    content: `<h2>Beyond Conventional Beauty Pageants</h2>
<p><strong>Forever Miss India & Forever Mrs India</strong> has revolutionized the Indian pageantry landscape by emphasizing personality, intellect, communication, and philanthropic vision.</p>`,
    featured_image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&auto=format&fit=crop&q=80",
    meta_title: "Forever Miss & Mrs India 2026 | National Pageant Registration & Highlights",
    meta_description: "Read about the transformative journey of contestants in Forever Miss, Mrs and Miss Teen India 2026.",
    status: "published",
    is_featured: 0,
    category_id: 3,
    category_name: "Entertainment & Fashion",
    category_slug: "entertainment-fashion",
    author_id: 2,
    author_name: "Pooja Agarwal",
    author_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    views_count: 13200,
    reading_time: 3,
    published_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    infobox: [
      { section: "Pageant", field_key: "Title", field_value: "Forever Miss & Mrs India" },
      { section: "Pageant", field_key: "Auditions", field_value: "All States & Union Territories" },
      { section: "Pageant", field_key: "Grooming", field_value: "International Mentors & Jury" }
    ]
  },
  {
    id: 5,
    title: "India's D2C Brand Revolution: How Homegrown Startups in Tier 2 Markets Are Scaling Globally",
    slug: "indias-d2c-brand-revolution-homegrown-startups-tier-2-markets",
    excerpt: "An in-depth analysis of supply chain innovations, digital marketing, and consumer trust powering direct-to-consumer enterprises in India.",
    content: `<h2>The Rise of Non-Metro Entrepreneurship</h2>
<p>India is witnessing a golden age of Direct-to-Consumer (D2C) innovation, where founders from Jaipur, Surat, Indore, and Coimbatore are building globally competitive brands.</p>`,
    featured_image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80",
    meta_title: "India D2C Revolution 2026 | Greenlight Business Analysis",
    meta_description: "Explore how Indian D2C startups are achieving profitability and scale across tier 2 and tier 3 markets.",
    status: "published",
    is_featured: 0,
    category_id: 4,
    category_name: "Startups & Innovation",
    category_slug: "startups-innovation",
    author_id: 3,
    author_name: "Vikram Malhotra",
    author_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    views_count: 11400,
    reading_time: 4,
    published_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    infobox: [
      { section: "Market Insights", field_key: "Sector", field_value: "Direct-to-Consumer (D2C)" },
      { section: "Market Insights", field_key: "Key Drivers", field_value: "UPI, Quick Commerce, Local Manufacturing" }
    ]
  },
  {
    id: 6,
    title: "Jaipur Cultural Renaissance: Why Rajasthan's Heritage Hub Is the New Epicenter of Creative Conclaves",
    slug: "jaipur-cultural-renaissance-heritage-hub-creative-conclaves",
    excerpt: "From royal palaces to modern convention centers, Jaipur is the preferred destination for national awards, literature festivals, and luxury summits.",
    content: `<h2>The Allure of the Pink City</h2>
<p>Jaipur seamlessly blends timeless Rajput architecture with state-of-the-art convention facilities, making it the supreme choice for prestigious national gatherings like the Forever Star India Awards.</p>`,
    featured_image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200&auto=format&fit=crop&q=80",
    meta_title: "Jaipur Cultural Renaissance | Heritage Travel & Events Guide",
    meta_description: "Why Jaipur is India's most sought-after destination for grand conclaves, awards ceremonies, and luxury tourism.",
    status: "published",
    is_featured: 0,
    category_id: 5,
    category_name: "Travel & Heritage",
    category_slug: "travel-heritage",
    author_id: 1,
    author_name: "Rajesh Sharma",
    author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    views_count: 9800,
    reading_time: 3,
    published_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    infobox: [
      { section: "Destination", field_key: "City", field_value: "Jaipur, Rajasthan" },
      { section: "Destination", field_key: "Known As", field_value: "The Pink City" }
    ]
  }
];
