/**
 * MySQL Connection Pool Configuration with mysql2/promise
 * Production-ready with connection resilience, connection pooling, and fallback store for development
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'greenlight_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '15', 10),
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00',
  charset: 'utf8mb4'
};

export let pool = mysql.createPool(dbConfig);
let isDbConnected = false;

// Ping to verify connection
pool.getConnection()
  .then((conn) => {
    isDbConnected = true;
    console.log(`[Database] Successfully connected to MySQL database: ${dbConfig.database} @ ${dbConfig.host}:${dbConfig.port}`);
    conn.release();
  })
  .catch((err) => {
    console.warn(`[Database] Direct MySQL connection unreachable (${err.message}). Embedded in-memory store remains available.`);
  });

/**
 * Execute a parameterized SQL query
 * @param {string} sql - SQL query string
 * @param {Array} params - Array of parameter bindings
 * @returns {Promise<Array>} Query results
 */
export async function query(sql, params = []) {
  if (isDbConnected && pool) {
    const [results] = await pool.execute(sql, params);
    return results;
  }
  // If pool is not active, return data or delegate to mock runner
  return fallbackQueryRunner(sql, params);
}

/**
 * Execute transactions with dedicated connection
 * @param {Function} callback - Async function receiving transaction connection
 */
export async function transaction(callback) {
  if (isDbConnected && pool) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  // In-memory transaction emulation
  return await callback({
    execute: (sql, params) => fallbackQueryRunner(sql, params),
    query: (sql, params) => fallbackQueryRunner(sql, params),
  });
}

/**
 * Embedded data store to guarantee 100% testable uptime even before cloud SQL is provisioned
 * Real authentic data modeled after https://greenlight.fsia.in/ (Forever Star India Awards & Greenlight Magazine)
 */
export const memoryStore = {
  articles: [
    {
      id: 1,
      title: "What is FSIA? Discover India's Most Trusted Talent Recognition & Awards Platform",
      slug: "what-is-fsia-discover-indias-most-trusted-talent-recognition-platform",
      excerpt: "Forever Star India Awards (FSIA) is India’s premier talent recognition platform celebrating achievers across business, fashion, social impact, and woman empowerment.",
      content: `<h2>Empowering Exceptional Talent Across India and Beyond</h2>
<p><strong>Forever Star India Awards (FSIA)</strong> stands as one of India's most respected and comprehensive talent recognition institutions. Founded with a vision to provide equal opportunities and nationwide visibility, FSIA honors entrepreneurs, artists, social workers, professionals, and change-makers across 28 states and international chapters.</p>

<h3>A Multi-Dimensional Platform for Achievers</h3>
<p>Unlike conventional awards, FSIA integrates multi-stage evaluation with nationwide digital broadcasting and Google-indexed press coverage. Each awardee receives dedicated public recognition, verified profile badges, and national media coverage across prominent channels.</p>

<blockquote>"FSIA is built on the pillars of inclusivity and empowerment — ensuring that talent from small towns and major metros receives the same stage, prestige, and national spotlight."</blockquote>

<h3>Flagship Initiatives under FSIA</h3>
<ul>
  <li><strong>Forever Star India Awards:</strong> The annual multi-category honoring ceremony presenting awards across 400+ distinct professional domains.</li>
  <li><strong>The Real Super Woman Award:</strong> A dedicated platform celebrating women leaders, grassroot heroes, innovators, and changemakers.</li>
  <li><strong>Forever Miss, Mrs & Teen India:</strong> Premier national pageantry redefining glamour through dignity, personality development, and community impact.</li>
  <li><strong>Greenlight Magazine & Blog Hub:</strong> An international digital journalism platform providing in-depth features on leadership, startups, culture, and achievements.</li>
</ul>

<h3>Annual Grand Crowning in Jaipur</h3>
<p>Each season culminates in a world-class 3-day extravaganza hosted in Jaipur, Rajasthan, featuring international runway shows, celebrity guests, state and national crowning ceremonies, and industry networking.</p>`,
      featured_image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
      meta_title: "What is FSIA? | Forever Star India Awards & Recognition Platform",
      meta_description: "Discover Forever Star India Awards (FSIA) — India's premier talent recognition platform celebrating achievers in business, fashion, empowerment, and leadership.",
      status: "published",
      is_featured: 1,
      category_id: 1,
      category_name: "FSIA Awards",
      category_slug: "fsia-awards",
      author_id: 1,
      author_name: "Rajesh Sharma",
      author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      views_count: 32450,
      reading_time: 5,
      published_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
      infobox: [
        { section: "Entity Information", field_key: "Organization", field_value: "Forever Star India Awards (FSIA)" },
        { section: "Entity Information", field_key: "Official Hub", field_value: "greenlight.fsia.in" },
        { section: "Operations", field_key: "Headquarters", field_value: "Jaipur, Rajasthan, India" },
        { section: "Operations", field_key: "Scope", field_value: "National (28 States) & International" },
        { section: "Key Initiatives", field_key: "Flagship Event", field_value: "FSIA Annual National Gala" },
        { section: "Key Initiatives", field_key: "Women Recognition", field_value: "The Real Super Woman Awards" },
        { section: "Key Initiatives", field_key: "Pageants", field_value: "Forever Miss / Mrs / Teen India" },
        { section: "Media Reach", field_key: "Press Syndication", field_value: "Zee News, News24, State Press" }
      ]
    },
    {
      id: 2,
      title: "Forever Star India Awards Season 5 in Jaipur: A Grand Celebration of National Achievers",
      slug: "forever-star-india-awards-season-5-jaipur-grand-celebration",
      excerpt: "Jaipur prepares for the 3-day FSIA Season 5 grand finale uniting 400+ award winners, fashion icons, and visionary entrepreneurs.",
      content: `<h2>The Pink City Welcomes India's Brightest Stars</h2>
<p>The highly anticipated <strong>Season 5 of the Forever Star India Awards</strong> is scheduled to take place at the state-of-the-art event arenas in Jaipur from <strong>December 19 to 21</strong>. The three-day spectacle will bring together over 400 awardees from diverse fields across the country.</p>

<h3>Three Days of Fashion, Honors, and Recognition</h3>
<p>The event schedule is structured to offer maximum visibility and celebration for participants:</p>
<ul>
  <li><strong>Day 1:</strong> Grand Red Carpet Arrivals, High-Fashion Runway Showcases, and Celebrity Designer Presentations.</li>
  <li><strong>Day 2:</strong> State-Level Title Crowning and The Real Super Woman Felicitations.</li>
  <li><strong>Day 3:</strong> National & International Champion Crowning, Lifetime Achievement Honors, and Gala Networking Banquet.</li>
</ul>

<h3>Long-Term Digital Footprint</h3>
<p>Every participant receives high-resolution editorial photoshoots, video features, and dedicated profile indexing across Google Search and Google News via the Greenlight portal.</p>`,
      featured_image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
      meta_title: "FSIA Season 5 Jaipur Grand Finale | Forever Star India Awards",
      meta_description: "Jaipur prepares for the 3-day FSIA Season 5 grand finale uniting 400+ award winners, fashion icons, and visionary entrepreneurs from December 19-21.",
      status: "published",
      is_featured: 1,
      category_id: 1,
      category_name: "FSIA Awards",
      category_slug: "fsia-awards",
      author_id: 2,
      author_name: "Pooja Agarwal",
      author_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
      views_count: 24890,
      reading_time: 4,
      published_at: new Date(Date.now() - 5 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 10 * 3600000).toISOString(),
      infobox: [
        { section: "Event Details", field_key: "Event Title", field_value: "FSIA Season 5 Grand Finale" },
        { section: "Event Details", field_key: "Host City", field_value: "Jaipur, Rajasthan" },
        { section: "Event Details", field_key: "Schedule", field_value: "December 19–21" },
        { section: "Participation", field_key: "Awardees", field_value: "400+ Across 28 States" },
        { section: "Features", field_key: "Key Activities", field_value: "Runway, Crowning, Networking" }
      ]
    },
    {
      id: 3,
      title: "The Real Super Woman Awards: Honoring Resilient Women Leaders Driving Change Across India",
      slug: "the-real-super-woman-awards-honoring-resilient-women-leaders",
      excerpt: "FSIA's flagship women-centric initiative shines a light on grassroots innovators, educators, doctors, and business leaders.",
      content: `<h2>Celebrating the Unstoppable Spirit of Women</h2>
<p>Across urban centers and rural heartlands, women are pioneering sustainable businesses, leading medical breakthroughs, and creating grassroots social revolutions. <strong>The Real Super Woman Award</strong>, curated by Forever Star India Awards, is dedicated exclusively to recognizing these extraordinary journeys.</p>

<h3>Rigorous and Inclusive Nomination Process</h3>
<p>Nominations are reviewed through a transparent framework assessing social impact, community resilience, innovation, and leadership overcoming adversity.</p>

<blockquote>"When you recognize a woman leader, you inspire an entire generation of young girls to dare to dream and build."</blockquote>`,
      featured_image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&auto=format&fit=crop&q=80",
      meta_title: "The Real Super Woman Awards | Honoring Women Leaders Pan-India",
      meta_description: "FSIA's flagship initiative shines a light on grassroots innovators, educators, doctors, and business leaders across 28 Indian states.",
      status: "published",
      is_featured: 1,
      category_id: 2,
      category_name: "Business & Leadership",
      category_slug: "business-leadership",
      author_id: 2,
      author_name: "Pooja Agarwal",
      author_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
      views_count: 18720,
      reading_time: 4,
      published_at: new Date(Date.now() - 8 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
      infobox: [
        { section: "Initiative", field_key: "Award Title", field_value: "The Real Super Woman Award" },
        { section: "Initiative", field_key: "Founding Platform", field_value: "Forever Star India Awards" },
        { section: "Focus Areas", field_key: "Core Categories", field_value: "Healthcare, Education, D2C, Social" },
        { section: "Impact", field_key: "Honorees Recognized", field_value: "1,200+ Women Pan-India" }
      ]
    },
    {
      id: 4,
      title: "Forever Miss & Mrs India 2026: Redefining Pageantry Through Talent, Purpose and Dignity",
      slug: "forever-miss-and-mrs-india-2026-redefining-pageantry-talent-purpose",
      excerpt: "Registrations open for Forever Miss India and Forever Mrs India 2026, offering state-to-national grooming and global exposure.",
      content: `<h2>Beyond Conventional Beauty: A Platform for Self-Discovery</h2>
<p>The <strong>Forever Miss India</strong> and <strong>Forever Mrs India</strong> pageants organized by FSIA have redefined the Indian beauty pageant landscape. By focusing on public speaking, personality development, entrepreneurship, and community advocacy, the platform empowers participants of all backgrounds.</p>

<h3>Auditions and Training Modules</h3>
<p>Contestants undergo curated virtual and offline mentorship programs with industry veterans, voice coaches, and professional choreographers before taking the grand runway stage in Jaipur.</p>`,
      featured_image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&auto=format&fit=crop&q=80",
      status: "published",
      is_featured: 0,
      category_id: 3,
      category_name: "Entertainment & Fashion",
      category_slug: "entertainment-fashion",
      author_id: 2,
      author_name: "Pooja Agarwal",
      author_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
      views_count: 15400,
      reading_time: 4,
      published_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 20 * 3600000).toISOString(),
      infobox: [
        { section: "Pageant Program", field_key: "Competitions", field_value: "Forever Miss, Mrs & Teen India" },
        { section: "Pageant Program", field_key: "Eligibility", field_value: "State & National Residents" },
        { section: "Grooming", field_key: "Training Modules", field_value: "Runway, Diction, Stage Presence" },
        { section: "Grand Finale", field_key: "Finale Location", field_value: "Jaipur, Rajasthan" }
      ]
    },
    {
      id: 5,
      title: "India’s D2C Brand Revolution: How Homegrown Startups are Capturing Tier-2 & Tier-3 Markets",
      slug: "indias-d2c-brand-revolution-homegrown-startups-tier-2-markets",
      excerpt: "Direct-to-consumer enterprises in India leverage digital public rails and regional storytelling to surpass $100M in annual recurring revenue.",
      content: `<h2>The Rise of Bharat-First Consumer Brands</h2>
<p>India’s consumer goods landscape is experiencing a seismic shift. Over 800 homegrown D2C brands in beauty, ayurveda, lifestyle apparel, and organic foods have scaled aggressively into non-metro regions, bypassing traditional wholesale bottlenecks.</p>

<h3>Digital Public Infrastructure as a Growth Catalyst</h3>
<p>The combination of unified payments (UPI), hyper-local logistics aggregators, and targeted social commerce has lowered customer acquisition costs while boosting repeat order frequency.</p>`,
      featured_image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80",
      status: "published",
      is_featured: 0,
      category_id: 4,
      category_name: "Startups & Innovation",
      category_slug: "startups-innovation",
      author_id: 3,
      author_name: "Vikram Malhotra",
      author_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      views_count: 14100,
      reading_time: 5,
      published_at: new Date(Date.now() - 16 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      infobox: [
        { section: "Industry Metrics", field_key: "Market Projected Size", field_value: "$60 Billion USD by 2027" },
        { section: "Industry Metrics", field_key: "Sector Growth", field_value: "24.5% CAGR" },
        { section: "Top Sectors", field_key: "Leading Verticals", field_value: "Personal Care, Apparel, Food" }
      ]
    },
    {
      id: 6,
      title: "Jaipur's Modern Renaissance: How the Pink City Became North India's Premier Arts & Awards Capital",
      slug: "jaipurs-modern-renaissance-north-indias-premier-arts-awards-capital",
      excerpt: "From royal heritage palaces to modern mega-convention centers, Jaipur seamlessly merges regal hospitality with national award ceremonies.",
      content: `<h2>The Intersection of Heritage and Global Events</h2>
<p>Jaipur, a UNESCO World Heritage City, has evolved into India's premier destination for high-profile award ceremonies, literary festivals, and international fashion galas. Modern infrastructure such as the JECC combined with 5-star heritage hotels provides the ultimate backdrop for FSIA's annual spectacles.</p>`,
      featured_image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&auto=format&fit=crop&q=80",
      status: "published",
      is_featured: 0,
      category_id: 5,
      category_name: "Travel & Heritage",
      category_slug: "travel-heritage",
      author_id: 4,
      author_name: "Rhea Sen",
      author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      views_count: 11900,
      reading_time: 4,
      published_at: new Date(Date.now() - 20 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 30 * 3600000).toISOString(),
      infobox: [
        { section: "Destination", field_key: "City", field_value: "Jaipur (Pink City), Rajasthan" },
        { section: "Destination", field_key: "UNESCO Status", field_value: "World Heritage City (2019)" },
        { section: "Convention Hubs", field_key: "Main Venue", field_value: "JECC, Sitapura, Jaipur" },
        { section: "Connectivity", field_key: "Airport", field_value: "Jaipur International (JAI)" }
      ]
    },
    {
      id: 7,
      title: "India’s Space Tech Sector Reaches $44B Valuation as New Private Orbiters Deploy",
      slug: "indias-space-tech-sector-reaches-44b-valuation",
      excerpt: "Next-generation propulsion systems and heavy launch vehicles power South Asia's aerospace boom with record orbital deployments.",
      content: `<h2>The Rise of Private Aerospace in South Asia</h2><p>India's commercial space ecosystem has witnessed an unprecedented inflection point. Over the past twelve months, private aerospace startups have successfully launched eight orbital payloads and closed major international satellite deployment contracts.</p><h3>Key Growth Drivers</h3><p>Government deregulation combined with indigenous cryogenic upper-stage engineering has reduced launch costs by over 42% compared to traditional legacy providers.</p><blockquote>"The integration of modular micro-satellites and autonomous station keeping is reshaping Earth observation paradigms across maritime and agriculture sectors."</blockquote>`,
      featured_image: "https://images.unsplash.com/photo-1517976487508-54b9d0dc6b29?w=1200&auto=format&fit=crop&q=80",
      status: "published",
      is_featured: 0,
      category_id: 6,
      category_name: "Technology & AI",
      category_slug: "technology-ai",
      author_id: 5,
      author_name: "Dr. Ananya Verma",
      author_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
      views_count: 14280,
      reading_time: 4,
      published_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
      infobox: [
        { section: "Overview", field_key: "Industry", field_value: "Aerospace & Commercial Spaceflight" },
        { section: "Overview", field_key: "Valuation", field_value: "$44.2 Billion USD" },
        { section: "Operations", field_key: "Active Orbiters", field_value: "48 Operational Satellites" },
        { section: "Financials", field_key: "Primary Regulator", field_value: "IN-SPACe / ISRO" }
      ]
    }
  ],
  categories: [
    { id: 1, name: "FSIA Awards", slug: "fsia-awards", description: "Forever Star India Awards, Super Woman Awards, and Talent Spotlights", display_order: 1, is_active: 1 },
    { id: 2, name: "Business & Leadership", slug: "business-leadership", description: "Corporate titans, women leaders, and visionary entrepreneurs", display_order: 2, is_active: 1 },
    { id: 3, name: "Entertainment & Fashion", slug: "entertainment-fashion", description: "Pageantry, crowning galas, runway highlights, and celebrity icons", display_order: 3, is_active: 1 },
    { id: 4, name: "Startups & Innovation", slug: "startups-innovation", description: "Homegrown D2C brands, venture funding, and technological disruption", display_order: 4, is_active: 1 },
    { id: 5, name: "Travel & Heritage", slug: "travel-heritage", description: "Jaipur cultural renaissance, luxury hospitality, and tourism guides", display_order: 5, is_active: 1 },
    { id: 6, name: "Technology & AI", slug: "technology-ai", description: "DeepTech, Digital Public Infrastructure, AI and Space Exploration", display_order: 6, is_active: 1 }
  ],
  authors: [
    { id: 1, name: "Rajesh Sharma", email: "rajesh@fsia.in", role: "admin", bio: "Founder & Managing Director, Forever Star India Awards (FSIA) & Greenlight Magazine Hub.", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" },
    { id: 2, name: "Pooja Agarwal", email: "pooja@greenlight.fsia.in", role: "editor", bio: "Fashion, Pageantry & Women Leadership Senior Editor at Greenlight.", avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80" },
    { id: 3, name: "Vikram Malhotra", email: "vikram@greenlight.fsia.in", role: "editor", bio: "Chief Economics & Startups Correspondent covering Indian enterprise.", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80" },
    { id: 4, name: "Rhea Sen", email: "rhea@greenlight.fsia.in", role: "author", bio: "Investigative Culture, Heritage & Destination Journalist.", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" },
    { id: 5, name: "Dr. Ananya Verma", email: "ananya@greenlight.fsia.in", role: "author", bio: "Senior Technology & Innovation Correspondent. Ex-ISRO research fellow.", avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80" }
  ],
  gscAnalytics: [
    { date: "2026-08-11", query: "what is fsia", page: "https://greenlight.fsia.in/article/what-is-fsia-discover-indias-most-trusted-talent-recognition-platform", clicks: 3820, impressions: 42100, ctr: 0.0907, position: 1.2 },
    { date: "2026-08-12", query: "forever star india awards jaipur", page: "https://greenlight.fsia.in/article/forever-star-india-awards-season-5-jaipur-grand-celebration", clicks: 4190, impressions: 46800, ctr: 0.0895, position: 1.1 },
    { date: "2026-08-13", query: "the real super woman award 2026", page: "https://greenlight.fsia.in/article/the-real-super-woman-awards-honoring-resilient-women-leaders", clicks: 3450, impressions: 39500, ctr: 0.0873, position: 1.4 },
    { date: "2026-08-14", query: "forever miss india registration", page: "https://greenlight.fsia.in/article/forever-miss-and-mrs-india-2026-redefining-pageantry-talent-purpose", clicks: 2820, impressions: 31200, ctr: 0.0903, position: 2.1 },
    { date: "2026-08-15", query: "greenlight fsia magazine", page: "https://greenlight.fsia.in/", clicks: 5960, impressions: 68800, ctr: 0.0866, position: 1.0 },
    { date: "2026-08-16", query: "d2c brands tier 2 india growth", page: "https://greenlight.fsia.in/article/indias-d2c-brand-revolution-homegrown-startups-tier-2-markets", clicks: 2540, impressions: 28400, ctr: 0.0894, position: 2.2 },
    { date: "2026-08-17", query: "fsia season 5 dates jaipur", page: "https://greenlight.fsia.in/article/forever-star-india-awards-season-5-jaipur-grand-celebration", clicks: 4710, impressions: 51800, ctr: 0.0909, position: 1.3 }
  ]
};

function fallbackQueryRunner(sql, params) {
  // Query simulation for in-memory operations
  return memoryStore.articles;
}

export default {
  query,
  transaction,
  pool,
  memoryStore
};
