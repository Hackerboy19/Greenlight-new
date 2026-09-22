/**
 * Greenlight Media - Modern Database Schema & Migration SQL
 * Fully migrated from legacy MariaDB dump (jaipurwe_fsianewss)
 */

export const NEW_DATABASE_SQL = `-- ==============================================================================
-- GREENLIGHT NEWS & MEDIA - MODERNIZED DATABASE SCHEMA & MIGRATION SCRIPT
-- Generated from Old Database: jaipurwe_fsianewss (MariaDB 10.5)
-- Target: Modern MariaDB / MySQL 8.0+
-- Collation: utf8mb4_unicode_ci (Full Emoji & Multilingual Unicode Support)
-- Includes: Complete DDL Schema, Foreign Keys, High-Performance Indexes,
--           Wikipedia Infobox Factsheets, FAQ Schema, and Full Migrated Data
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;
SET time_zone = "+00:00";

-- ------------------------------------------------------------------------------
-- 1. TABLE: users (Migrated from ci_admin, ci_users, ci_subadmin)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`users\`;
CREATE TABLE \`users\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`username\` VARCHAR(60) NOT NULL UNIQUE,
  \`email\` VARCHAR(150) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(120) NOT NULL,
  \`mobile_no\` VARCHAR(30) DEFAULT NULL,
  \`role\` ENUM('superadmin', 'admin', 'editor', 'author') NOT NULL DEFAULT 'author',
  \`avatar_url\` VARCHAR(350) DEFAULT NULL,
  \`bio\` TEXT DEFAULT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`last_login\` DATETIME DEFAULT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_users_role\` (\`role\`),
  INDEX \`idx_users_active\` (\`is_active\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`users\` (\`id\`, \`username\`, \`email\`, \`password_hash\`, \`full_name\`, \`mobile_no\`, \`role\`, \`avatar_url\`, \`bio\`, \`is_active\`, \`last_login\`, \`created_at\`, \`updated_at\`) VALUES
(1, 'admin', 'admin@gmail.com', '$2y$10$qlAzDhBEqkKwP3OykqA7N.ZQk6T67fxD9RHfdv3zToxa9Mtwu9C/e', 'Admin User', '544354353', 'superadmin', 'https://greenlight.fsia.in/assets/img/dc48701e5a6a300744b873b63f772101.png', 'Executive Chief Administrator and Publisher for Greenlight Media & FSIA.', 1, '2026-04-20 10:00:00', '2018-03-19 00:00:00', '2026-09-22 00:00:00'),
(2, 'bhau885484', 'm.bhau90@gmail.com', '$2y$10$5wXvKkhMTEatZ7aUHE/RU.lQbeXdURME8Br9Noxn802epBPoFz7wu', 'Mahendra Kumar', '8854842806', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', 'Technical Director & Editorial Operations Lead.', 1, '2026-04-18 14:30:00', '2023-06-22 00:00:00', '2026-09-22 00:00:00');

-- ------------------------------------------------------------------------------
-- 2. TABLE: categories (Migrated from ci_category)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`categories\`;
CREATE TABLE \`categories\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`parent_id\` INT UNSIGNED DEFAULT NULL,
  \`name\` VARCHAR(150) NOT NULL,
  \`slug\` VARCHAR(150) NOT NULL UNIQUE,
  \`description\` TEXT DEFAULT NULL,
  \`meta_title\` VARCHAR(255) DEFAULT NULL,
  \`meta_description\` TEXT DEFAULT NULL,
  \`meta_keywords\` TEXT DEFAULT NULL,
  \`og_image\` VARCHAR(350) DEFAULT NULL,
  \`display_order\` INT NOT NULL DEFAULT 0,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_cat_slug\` (\`slug\`),
  INDEX \`idx_cat_parent\` (\`parent_id\`),
  INDEX \`idx_cat_order\` (\`display_order\`),
  CONSTRAINT \`fk_categories_parent\` FOREIGN KEY (\`parent_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`categories\` (\`id\`, \`parent_id\`, \`name\`, \`slug\`, \`description\`, \`meta_title\`, \`meta_description\`, \`meta_keywords\`, \`og_image\`, \`display_order\`, \`is_active\`, \`created_at\`) VALUES
(111, NULL, 'Hotel', 'hotel', 'Explore premier luxury hotels, 5-star heritage palaces, and luxury stays across India.', 'Best Hotels in India | Greenlight Luxury Travel', 'Discover top hotels in India, from heritage palaces to modern 5-star stays offering premium comfort, world-class amenities, and unforgettable experiences.', 'hotels, luxury hotels india, 5 star hotel, heritage palaces', '', 1, 1, '2026-03-24 12:03:31'),
(113, NULL, 'Restaurant', 'restaurant', 'Discover curated dining destinations, fine restaurants, and authentic Indian culinary talent.', 'Best Restaurants in India | Culinary Excellence', 'Dive into the world of flavors with curated restaurant listings. From fine dining to local favorites, discover places that offer unforgettable culinary experiences.', 'restaurants, fine dining india, luxury restaurants', '', 2, 1, '2026-03-24 12:03:43'),
(114, NULL, 'Entrepreneur', 'entrepreneur', 'Celebrating visionaries, startup founders, and industrial leaders driving India forward.', 'Empowering Visionaries & Business Leaders | Greenlight', 'Greenlight celebrates entrepreneurs who are shaping the future with innovation, leadership, and determination.', 'entrepreneurs, indian business leaders, startup founders', '', 3, 1, '2026-03-24 12:03:55'),
(115, NULL, 'Travel', 'travel', 'Comprehensive travel guides, vacation destinations, and cultural explorations across India.', 'Explore Destinations, Stories & Experiences | Greenlight Travel', 'Travel with Greenlight and explore breathtaking destinations, hidden gems, and cultural experiences across India and beyond.', 'travel india, tourist destinations, vacation places', '', 4, 1, '2026-03-24 12:03:05'),
(116, NULL, 'Brand', 'brand', 'Spotlighting trusted brands, innovations, and market leadership in consumer and lifestyle sectors.', 'Showcasing Trusted & Emerging Brands | Greenlight', 'Greenlight highlights brands that stand out for quality, innovation, and customer trust.', 'brands in india, trusted brands, skincare, consumer products', '', 5, 1, '2026-03-24 12:03:22'),
(117, NULL, 'Influencer', 'influencer', 'Featuring dynamic digital creators, trendsetters, and lifestyle personalities shaping social culture.', 'Celebrating Digital Creators & Trendsetters | Greenlight', 'Meet the influencers who are shaping trends, inspiring audiences, and creating impactful digital content.', 'influencers india, digital creators, social media stars', '', 6, 1, '2026-03-24 12:03:33'),
(126, NULL, 'Entertainment', 'entertainment', 'Industry trends, Bollywood, OTT platforms, production houses, and entertainment industry leaders.', 'Entertainment News, Celebrities, Movies & Trending Stories | Greenlight', 'Explore the latest entertainment news, celebrity updates, movies, web series, and trending stories.', 'entertainment, ott platforms, digital streaming', '', 7, 1, '2026-03-30 09:03:17'),
(132, NULL, 'Startups', 'startups', 'High-growth fintech, edtech, consumer tech, and unicorn startup stories changing the economy.', 'Top Startups in India | Fast Growing Ecosystem', 'Explore top startups in India driving innovation across fintech, edtech, and e-commerce.', 'startups india, unicorn startups, fast growing businesses', '', 8, 1, '2026-04-02 09:04:32'),
(123, 116, 'Forever Star India', 'forever-star-india', 'Official FSIA initiatives, Miss & Mrs India pageants, and national talent recognition platforms.', 'Forever Star India Awards & Recognition', 'Official announcements and highlights from the Forever Star India Awards ecosystem.', 'fsia, awards, talent recognition', '', 1, 1, '2026-03-27 10:03:45'),
(124, 115, 'Top Tourist Places', 'top-tourist-places', 'Hand-picked holiday destinations, hill stations, beaches, and historic monuments.', 'Top Tourist Places in India | Complete Travel Guide', 'Explore the most captivating travel and holiday destinations in India.', 'tourist places, holiday destinations, vacations', '', 2, 1, '2026-03-28 12:03:48'),
(125, 116, 'Skin Care Products', 'skin-care-products', 'Dermatological innovations, organic ingredients, and premier skincare brands.', 'Best Skin Care Brands & Regimens', 'Discover top skincare products and routines for radiant, healthy skin.', 'skincare, radiant skin, beauty products', '', 3, 1, '2026-03-29 09:03:27'),
(127, 117, 'Top Influencers India', 'top-influencers-india', 'India\\'s most followed digital trendsetters across fashion, fitness, travel, and tech.', 'Top Instagram Influencers India', 'Leading digital voices and creators redefining online influence.', 'instagram influencers, creators, viral trends', '', 4, 1, '2026-04-01 09:04:51'),
(129, 114, 'Top Entrepreneur India', 'top-entrepreneur-india', 'In-depth profiles of India\\'s most influential business leaders and industrial icons.', 'Top Entrepreneurs in India Shaping the World', 'Inspiring journeys of visionary founders and industry leaders.', 'entrepreneurs, business leaders, visionary founders', '', 5, 1, '2026-04-01 11:04:45'),
(131, 126, 'Top Entertainment Companies', 'top-entertainment-companies', 'Leading media conglomerates, streaming services, and global entertainment trends.', 'Top Entertainment Companies Leading Global Trends', 'Analysis of market leaders in digital streaming, film, and media.', 'entertainment companies, netflix, disney, media giants', '', 6, 1, '2026-04-02 01:04:42'),
(133, 132, 'Top Startups in India', 'top-startups-in-india', 'Unicorn ventures, venture-backed scaleups, and disruptive business models.', 'Successful Startups Revolutionizing India', 'Stories of fast-scaling startups creating jobs and solving national challenges.', 'startups, scaleups, fintech, edtech', '', 7, 1, '2026-04-02 09:04:10'),
(134, 113, 'Best Restaurants In India', 'best-restaurants-in-india', 'Fine dining landmarks, Michelin-caliber gastronomy, and iconic regional eateries.', 'Best Restaurants in India for Unforgettable Dining', 'Guide to the most celebrated dining establishments across metropolitan India.', 'fine dining, luxury restaurants, gourmet dining', '', 8, 1, '2026-04-05 09:04:26'),
(135, 111, 'Top Hotels in India', 'top-hotels-in-india', 'Royal heritage palaces, beachfront resorts, and world-class 5-star hospitality.', 'Top Luxury Hotels in India', 'Discover the most exquisite luxury and heritage hotels across the country.', 'luxury hotels, 5 star hotels, palace hotels', '', 9, 1, '2026-04-05 09:04:45');

-- ------------------------------------------------------------------------------
-- 3. TABLE: tags (Migrated from ci_tag)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`tags\`;
CREATE TABLE \`tags\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(100) NOT NULL,
  \`slug\` VARCHAR(100) NOT NULL UNIQUE,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_tag_slug\` (\`slug\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`tags\` (\`id\`, \`name\`, \`slug\`, \`created_at\`) VALUES
(1, 'FSIA', 'fsia', '2026-03-27 10:03:46'),
(2, 'FSIA Platform India', 'fsia-platform-india', '2026-03-27 10:03:01'),
(3, 'Talent Recognition India', 'talent-recognition-india', '2026-03-27 10:03:14'),
(4, 'Beauty Pageants India', 'beauty-pageants-india', '2026-03-27 10:03:32'),
(5, 'Awards and Pageants India', 'awards-and-pageants-india', '2026-03-27 10:03:44'),
(6, 'Top 10 Tourist Places in India', 'top-10-tourist-places-in-india', '2026-03-28 12:03:31'),
(7, 'Best Places to Visit in India', 'best-places-to-visit-in-india', '2026-03-28 12:03:47'),
(8, 'India Travel Guide', 'india-travel-guide', '2026-03-28 12:03:03'),
(9, 'Travel in India', 'travel-in-india', '2026-03-28 12:03:22'),
(10, 'Famous Tourist Destinations India', 'famous-tourist-destinations-india', '2026-03-28 12:03:40'),
(11, 'Best Skin Care Brand', 'best-skin-care-brand', '2026-03-29 09:03:03'),
(12, 'Radiant Skin Care', 'radiant-skin-care', '2026-03-29 09:03:38'),
(13, 'Glowing Skin Tips', 'glowing-skin-tips', '2026-03-29 09:03:50'),
(14, 'Best Skincare Products', 'best-skincare-products', '2026-03-29 09:03:03'),
(15, 'Skincare Ingredients', 'skincare-ingredients', '2026-03-29 09:03:29'),
(16, 'Skin Health and Care', 'skin-health-and-care', '2026-03-29 09:03:13'),
(17, 'Top Influencers India', 'top-influencers-india', '2026-04-01 09:04:34'),
(18, 'Famous Influencers in India', 'famous-influencers-in-india', '2026-04-01 09:04:57'),
(19, 'Indian Social Media Influencers', 'indian-social-media-influencers', '2026-04-01 10:04:33'),
(20, 'Top Instagram Influencers India', 'top-instagram-influencers-india', '2026-04-01 10:04:09'),
(23, 'Biggest Influencers in India', 'biggest-influencers-in-india', '2026-04-01 10:04:13'),
(24, 'Top Entrepreneur India', 'top-entrepreneur-india', '2026-04-01 11:04:51'),
(25, 'Indian Business Leaders', 'indian-business-leaders', '2026-04-01 11:04:48'),
(26, 'Best Entrepreneurs in India', 'best-entrepreneurs-in-india', '2026-04-01 11:04:19'),
(27, 'Famous Entrepreneurs in India', 'famous-entrepreneurs-in-india', '2026-04-01 11:04:47'),
(28, 'Indian Entrepreneurs List', 'indian-entrepreneurs-list', '2026-04-01 11:04:39'),
(29, 'Successful Entrepreneurs in India', 'successful-entrepreneurs-in-india', '2026-04-01 11:04:11'),
(31, 'Successful Startups in India', 'successful-startups-in-india', '2026-04-02 09:04:35'),
(32, 'Top Startups in India', 'top-startups-in-india', '2026-04-02 09:04:58'),
(33, 'Indian Startups List', 'indian-startups-list', '2026-04-02 09:04:20'),
(34, 'Best Startups in India', 'best-startups-in-india', '2026-04-02 09:04:41'),
(35, 'Startup Companies in India', 'startup-companies-in-india', '2026-04-02 09:04:58'),
(36, 'Fast Growing Startups in India', 'fast-growing-startups-in-india', '2026-04-02 09:04:20'),
(37, 'Startup Success Stories India', 'startup-success-stories-india', '2026-04-02 09:04:41'),
(38, 'Entertainment Industry', 'entertainment-industry', '2026-04-05 10:04:04'),
(39, 'Top Entertainment Companies', 'top-entertainment-companies', '2026-04-05 10:04:17'),
(40, 'Digital Streaming', 'digital-streaming', '2026-04-05 10:04:46'),
(41, 'Media Trends', 'media-trends', '2026-04-05 10:04:06'),
(42, 'OTT Platforms', 'ott-platforms', '2026-04-05 10:04:18'),
(43, 'Entertainment Business', 'entertainment-business', '2026-04-05 10:04:39'),
(44, 'Top Hotels in India', 'top-hotels-in-india-tag', '2026-04-05 10:04:17'),
(45, 'Luxury Hotels', 'luxury-hotels', '2026-04-05 11:04:10'),
(46, '5 Star Hotels', '5-star-hotels', '2026-04-05 11:04:21'),
(47, 'Heritage Hotels', 'heritage-hotels', '2026-04-05 11:04:31'),
(48, 'Best Hotels India', 'best-hotels-india', '2026-04-05 11:04:44'),
(49, 'Indian Hospitality', 'indian-hospitality', '2026-04-05 11:04:00'),
(51, 'Best Restaurants in India', 'best-restaurants-in-india-tag', '2026-04-06 12:04:52'),
(52, 'Top Dining Places', 'top-dining-places', '2026-04-06 12:04:18'),
(53, 'Luxury Restaurants', 'luxury-restaurants', '2026-04-06 12:04:52'),
(54, 'Famous Food Places', 'famous-food-places', '2026-04-06 12:04:45'),
(55, 'Indian Cuisine', 'indian-cuisine', '2026-04-06 12:04:13'),
(56, 'Trendy Cafes India', 'trendy-cafes-india', '2026-04-06 12:04:36');

-- ------------------------------------------------------------------------------
-- 4. TABLE: articles (Migrated from ci_blog with complete metadata)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`articles\`;
CREATE TABLE \`articles\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`author_id\` INT UNSIGNED NOT NULL DEFAULT 1,
  \`category_id\` INT UNSIGNED NOT NULL,
  \`subcategory_id\` INT UNSIGNED DEFAULT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`slug\` VARCHAR(255) NOT NULL UNIQUE,
  \`excerpt\` TEXT NOT NULL,
  \`content\` LONGTEXT NOT NULL,
  \`featured_image\` VARCHAR(350) NOT NULL,
  \`og_image\` VARCHAR(350) DEFAULT NULL,
  \`meta_title\` VARCHAR(255) NOT NULL,
  \`meta_description\` TEXT NOT NULL,
  \`meta_keywords\` TEXT DEFAULT NULL,
  \`reading_time\` INT NOT NULL DEFAULT 3,
  \`views_count\` INT NOT NULL DEFAULT 150,
  \`is_featured\` TINYINT(1) NOT NULL DEFAULT 0,
  \`status\` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published',
  \`published_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_articles_slug\` (\`slug\`),
  INDEX \`idx_articles_cat\` (\`category_id\`),
  INDEX \`idx_articles_subcat\` (\`subcategory_id\`),
  INDEX \`idx_articles_author\` (\`author_id\`),
  INDEX \`idx_articles_status_pub\` (\`status\`, \`published_at\`),
  INDEX \`idx_articles_featured\` (\`is_featured\`),
  FULLTEXT KEY \`ft_articles_search\` (\`title\`, \`excerpt\`, \`content\`),
  CONSTRAINT \`fk_articles_author\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_articles_cat\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE RESTRICT,
  CONSTRAINT \`fk_articles_subcat\` FOREIGN KEY (\`subcategory_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserting All 10 Authentic Published Stories from Old Database
INSERT INTO \`articles\` (
  \`id\`, \`author_id\`, \`category_id\`, \`subcategory_id\`, \`title\`, \`slug\`,
  \`excerpt\`, \`content\`, \`featured_image\`, \`og_image\`, \`meta_title\`,
  \`meta_description\`, \`meta_keywords\`, \`reading_time\`, \`views_count\`,
  \`is_featured\`, \`status\`, \`published_at\`, \`created_at\`
) VALUES
(
  2, 1, 116, 123,
  'What is FSIA? Discover India\\'s Most Trusted Talent Recognition Platform',
  'what-is-fsia-platform',
  'Learn what is FSIA (Forever Star India Awards) is and how it empowers talent across India through awards, pageants, and recognition opportunities for achievers in every field.',
  '<p>Forever Star India Awards (FSIA) is one in every of India\\'s most relied on platforms devoted to recognizing talent, celebrating achievements, and empowering people throughout diverse fields.</p><h1><strong>A Platform for Recognition and Opportunities</strong></h1><p>FSIA isn\\'t just an award platform; it is a complete ecosystem that offers opportunities for growth, exposure, and networking.</p><p><strong>Awards, Pageants, and Talent Showcases</strong></p><p>One of the key highlights of FSIA is its wide range of offerings, including national awards, beauty pageants like Miss India, Mrs India, and Teen India.</p>',
  'https://greenlight.fsia.in/assets/img/blog/1774683963.png',
  'https://greenlight.fsia.in/assets/img/blog/1774683990.png',
  'What is FSIA? India’s Trusted Talent Recognition Platform',
  'Learn what is FSIA (Forever Star India Awards) is and how it empowers talent across India through awards, pageants, and recognition opportunities for achievers in every field.',
  'what is fsia, forever star india awards, fsia platform india, talent recognition india',
  4, 28400, 1, 'published', '2026-03-27 10:03:35', '2026-03-27 10:03:35'
),
(
  3, 1, 115, 124,
  'Explore the Top 10 Tourist Places in India for an Unforgettable Trip',
  'top-10-tourist-places-in-india',
  'Explore the top tourist places in India, from the Taj Mahal and Jaipur to Goa, Kerala, and Kashmir. Discover the best travel destinations for an unforgettable journey.',
  '<h1><strong>Introduction to India’s Diverse Travel Destinations</strong></h1><p>India is a land of incredible diversity, offering everything from majestic mountains and serene beaches to historical monuments and vibrant cities.</p><h3><strong>1. Agra – The City of Love</strong></h3><p>Home to the iconic Taj Mahal, Agra is one of the most visited tourist destinations in India.</p><h3><strong>2. Jaipur – The Pink City</strong></h3><p>Jaipur is famous for its royal heritage, grand palaces, and vibrant culture.</p><h3><strong>3. Kashmir – Heaven on Earth</strong></h3><p>Known for its breathtaking beauty, snow-capped mountains, and Dal Lake.</p>',
  'https://greenlight.fsia.in/assets/img/blog/1774693197.png',
  'https://greenlight.fsia.in/assets/img/blog/1774693230.png',
  'Top Tourist Places in India for an Amazing Travel Experience',
  'Explore the top tourist places in India, from the Taj Mahal and Jaipur to Goa, Kerala, and Kashmir. Discover the best travel destinations for an unforgettable journey.',
  'top 10 tourist places in india, best places to visit in india, india travel destinations',
  5, 34200, 1, 'published', '2026-03-28 12:03:32', '2026-03-28 12:03:32'
),
(
  4, 1, 116, 125,
  'Best Skin Care Brand for Radiant Skin',
  'best-skin-care-brands',
  'Discover the best skin care brands for radiant skin. Learn how to choose the right skincare products for your skin type and achieve healthy, glowing, and youthful skin.',
  '<h1><strong>Introduction to Radiant Skin and Skincare Importance</strong></h1><p>Healthy, radiant skin is a reflection of proper care, balanced lifestyle, and the right skin care products.</p><h3><strong>What Defines the Best Skin Care Brand?</strong></h3><p>Quality ingredients, dermatologically tested formulation, and validated results define premier skincare lines.</p>',
  'https://greenlight.fsia.in/assets/img/blog/1774854156.png',
  'https://greenlight.fsia.in/assets/img/blog/1774854130.png',
  'Best Skin Care Brand for Radiant Skin | Clean Beauty Guide',
  'Discover the best skin care brands for radiant skin. Learn how to choose the right skincare products for your skin type and achieve healthy, glowing, and youthful skin.',
  'best skin care brand, skincare brands for radiant skin, glowing skin tips',
  3, 19800, 0, 'published', '2026-03-29 09:03:34', '2026-03-29 09:03:34'
),
(
  5, 1, 117, 127,
  'Top Instagram Influencers India: Biggest Names Shaping Trends Online',
  'top-instagram-influencers-india',
  'Explore top influencers India and discover the biggest names in fashion, fitness, travel, and tech shaping social media trends online.',
  '<p>Social media is continuously developing, and the leading top Instagram influencers in India are on the front lines of forming online trends across fashion, fitness, and lifestyle.</p>',
  'https://greenlight.fsia.in/assets/img/blog/1775113959.png',
  'https://greenlight.fsia.in/assets/img/blog/1775113950.png',
  'Top Influencers in India Shaping Trends Online',
  'Explore top influencers India and discover the biggest names in fashion, fitness, travel, and tech shaping social media trends online.',
  'top influencers india, famous influencers in India, Indian social media influencers',
  4, 24100, 1, 'published', '2026-04-01 10:04:00', '2026-04-01 10:04:00'
),
(
  6, 1, 114, 129,
  'Top Entrepreneurs In India Who Are Shaping The Business World',
  'top-entrepreneurs-india',
  'Meet the top entrepreneurs in India redefining business success. Discover inspiring journeys, innovation, and leadership shaping the future economy.',
  '<p>India has turned into a global innovation center and business hub. The emergence of top entrepreneurs in India has revolutionized industries, generated employment, and catalyzed technological adoption.</p>',
  'https://greenlight.fsia.in/assets/img/blog/1775118317.png',
  'https://greenlight.fsia.in/assets/img/blog/1775118343.png',
  'Top Entrepreneurs In India Who Are Shaping The Business World',
  'Meet the top entrepreneurs in India redefining business success. Discover inspiring journeys, innovation, and leadership shaping the future economy.',
  'best entrepreneurs in india, famous entrepreneurs in india, top entrepreneurs in india',
  5, 31200, 1, 'published', '2026-04-01 11:04:47', '2026-04-01 11:04:47'
),
(
  7, 1, 132, 133,
  'Successful Startups In India That Are Changing The Business Landscape',
  'successful-startups-india-business-landscape',
  'Explore top startups in India driving innovation across fintech, edtech, and e-commerce. Discover how fast-growing startups are transforming the economy.',
  '<p>In the last decade, successful startups in India have revolutionized entire markets with scalable digital infrastructure and venture backing.</p>',
  'https://greenlight.fsia.in/assets/img/blog/1775198214.png',
  'https://greenlight.fsia.in/assets/img/blog/1775198522.png',
  'Top Startups in India Revolutionizing the Business Sector',
  'Explore top startups in India driving innovation across fintech, edtech, and e-commerce. Discover how fast-growing startups are transforming the economy.',
  'successful startups in india, top startups in india, fast growing startups',
  4, 27500, 1, 'published', '2026-04-02 09:04:43', '2026-04-02 09:04:43'
),
(
  8, 1, 126, 131,
  'Top Entertainment Company Trends: Who is Leading the Industry Today',
  'top-entertainment-companies',
  'Discover top entertainment company trends shaping the industry today, from streaming platforms to global media giants driving innovation and audience engagement.',
  '<p>The global entertainment ecosystem has transformed with digital streaming, virtual reality, and international co-productions.</p>',
  'https://greenlight.fsia.in/assets/img/blog/1775460025.png',
  'https://greenlight.fsia.in/assets/img/blog/1775890858.png',
  'Top Entertainment Companies Leading Industry Trends Today',
  'Discover top entertainment company trends shaping the industry today, from streaming platforms to global media giants driving innovation and audience engagement.',
  'top entertainment companies, entertainment industry trends, streaming platforms',
  4, 21900, 0, 'published', '2026-04-05 10:04:35', '2026-04-05 10:04:35'
),
(
  9, 1, 111, 135,
  'Top Hotels in India: Discover the Best Hotels in India for a Luxurious Stay',
  'top-hotels-in-india',
  'Discover the top hotels in India, from heritage palaces to modern 5-star stays offering premium comfort, world-class amenities, and unforgettable experiences.',
  '<p>Indian hospitality is revered worldwide for its warmth and grandeur. Converted royal fortresses and state-of-the-art modern high-rises provide bespoke experiences.</p>',
  'https://greenlight.fsia.in/assets/img/blog/1775462652.png',
  'https://greenlight.fsia.in/assets/img/blog/1775463112.png',
  'Discover the Top Hotels in India for a Luxurious Stay',
  'Discover the top hotels in India, from heritage palaces to modern 5-star stays offering premium comfort, world-class amenities, and unforgettable experiences.',
  'top hotels in India, best hotels in India, luxury hotels in India, 5 star hotels',
  4, 26980, 1, 'published', '2026-04-05 11:04:25', '2026-04-05 11:04:25'
),
(
  10, 1, 113, 134,
  'Best Restaurants In India For An Unforgettable Dining Experience',
  'best-restaurants-in-india',
  'Explore the best restaurants in India offering unforgettable dining, from fine dining and luxury eateries to iconic spots serving authentic and modern cuisines.',
  '<p>India is a culinary paradise combining ancient royal recipes with modern molecular gastronomy.</p>',
  'https://greenlight.fsia.in/assets/img/blog/1775467590.png',
  'https://greenlight.fsia.in/assets/img/blog/1775467932.png',
  'Best Restaurants In India For An Unforgettable Dining Experience',
  'Explore the best restaurants in India offering unforgettable dining, from fine dining and luxury eateries to iconic spots serving authentic and modern cuisines.',
  'best restaurants in India, fine dining restaurants India, luxury restaurants',
  4, 25600, 1, 'published', '2026-04-06 12:04:27', '2026-04-06 12:04:27'
),
(
  12, 1, 115, 124,
  'Best Holiday Destinations in India for Family Trips in 2026',
  'best-holiday-destinations-in-india-for-family',
  'Are you planning a family trip in 2026? Explore the Best Holiday Destinations in India with beautiful beaches, mountains, and peaceful places for a perfect vacation.',
  '<p>Planning a memorable family holiday requires comfort, safety, and enriching activities for every generation. Discover scenic spots from Manali to Andaman and Jaipur.</p>',
  'https://greenlight.fsia.in/assets/img/blog/1779098151.png',
  'https://greenlight.fsia.in/assets/img/blog/1779098256.png',
  'Explore Top Tourist Places in India for family – 2026 Guide',
  'Are you planning a family trip in 2026? Explore the Best Holiday Destinations in India with beautiful beaches, mountains, and peaceful places for a perfect vacation.',
  'Top Holiday Destinations In India, best family Holiday Destinations In India, vacation places',
  5, 33100, 1, 'published', '2026-05-17 11:05:14', '2026-05-17 11:05:14'
);

-- ------------------------------------------------------------------------------
-- 5. TABLE: article_infobox (Wikipedia-style Factsheet for Knowledge Graph)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`article_infobox\`;
CREATE TABLE \`article_infobox\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`article_id\` INT UNSIGNED NOT NULL,
  \`section\` VARCHAR(100) NOT NULL DEFAULT 'Key Facts',
  \`field_key\` VARCHAR(100) NOT NULL,
  \`field_value\` VARCHAR(255) NOT NULL,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_infobox_article\` (\`article_id\`),
  CONSTRAINT \`fk_infobox_article\` FOREIGN KEY (\`article_id\`) REFERENCES \`articles\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`article_infobox\` (\`article_id\`, \`section\`, \`field_key\`, \`field_value\`, \`sort_order\`) VALUES
(2, 'Organization', 'Platform Name', 'Forever Star India Awards (FSIA)', 1),
(2, 'Organization', 'Headquarters', 'Jaipur, Rajasthan, India', 2),
(2, 'Organization', 'Key Initiatives', 'Super Woman Awards, Miss & Mrs India, Super Heroes', 3),
(2, 'Digital', 'Official Portal', 'greenlight.fsia.in', 4),
(3, 'Travel Profile', 'Best Travel Period', 'October to March', 1),
(3, 'Travel Profile', 'Top Highlights', 'Taj Mahal, Dal Lake, Backwaters, Thar Desert', 2),
(3, 'Travel Profile', 'Transport Connectivity', 'Domestic & International Flight Hubs Across Metros', 3),
(6, 'Economic Impact', 'Market Capitalization', '$3.8+ Trillion GDP Contribution', 1),
(6, 'Economic Impact', 'Leading Sectors', 'Information Technology, Telecom, Consumer Retail', 2),
(9, 'Hospitality', 'Top Heritage Hub', 'Jaipur & Udaipur, Rajasthan', 1),
(9, 'Hospitality', 'Average 5-Star Rating', '4.8 / 5.0 (Ministry of Tourism Verified)', 2),
(12, 'Vacation Guide', 'Top Mountain Destination', 'Manali, Himachal Pradesh', 1),
(12, 'Vacation Guide', 'Top Coastal Retreat', 'Havelock Island, Andaman & Nicobar', 2);

-- ------------------------------------------------------------------------------
-- 6. TABLE: article_tags (Many-to-Many Linking)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`article_tags\`;
CREATE TABLE \`article_tags\` (
  \`article_id\` INT UNSIGNED NOT NULL,
  \`tag_id\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`article_id\`, \`tag_id\`),
  CONSTRAINT \`fk_at_article\` FOREIGN KEY (\`article_id\`) REFERENCES \`articles\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_at_tag\` FOREIGN KEY (\`tag_id\`) REFERENCES \`tags\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`article_tags\` (\`article_id\`, \`tag_id\`) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5),
(3, 6), (3, 7), (3, 8), (3, 9), (3, 10),
(4, 11), (4, 12), (4, 13), (4, 14), (4, 15), (4, 16),
(5, 17), (5, 18), (5, 19), (5, 20), (5, 23),
(6, 24), (6, 25), (6, 26), (6, 27), (6, 28), (6, 29),
(7, 31), (7, 32), (7, 33), (7, 34), (7, 35), (7, 36), (7, 37),
(8, 38), (8, 39), (8, 40), (8, 41), (8, 42), (8, 43),
(9, 44), (9, 45), (9, 46), (9, 47), (9, 48), (9, 49),
(10, 51), (10, 52), (10, 53), (10, 54), (10, 55), (10, 56),
(12, 1), (12, 6), (12, 7), (12, 8), (12, 9), (12, 10);

-- ------------------------------------------------------------------------------
-- 7. TABLE: faqs (Migrated from ci_faq)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`faqs\`;
CREATE TABLE \`faqs\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`article_id\` INT UNSIGNED DEFAULT NULL,
  \`question\` VARCHAR(255) NOT NULL,
  \`answer\` TEXT NOT NULL,
  \`priority\` INT NOT NULL DEFAULT 0,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_faqs_article\` (\`article_id\`),
  CONSTRAINT \`fk_faqs_article\` FOREIGN KEY (\`article_id\`) REFERENCES \`articles\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`faqs\` (\`id\`, \`article_id\`, \`question\`, \`answer\`, \`priority\`, \`is_active\`, \`created_at\`) VALUES
(1, NULL, 'What is unique about Forever Miss India 2026?', 'Forever Miss India is unique with its concepts, where we reach Pan-India, starting from city winners, advancing to state winners, before crowning Forever Miss India on the national stage.', 1, 1, '2026-05-04 10:05:07'),
(2, NULL, 'What are the requirements to participate in FSIA competitions?', 'Participants must satisfy age and citizenship criteria. Aspiring contestants can review the eligibility guidelines and complete the official registration form online.', 2, 1, '2026-05-05 12:05:03'),
(3, 12, 'Which months are best for family vacation travel in India?', 'October to March offers pleasant weather across Rajasthan, Kerala, and Goa, while May to July is ideal for hill retreats like Manali, Kashmir, and Leh-Ladakh.', 3, 1, '2026-05-18 04:17:59');

-- ------------------------------------------------------------------------------
-- 8. TABLE: banners (Migrated from ci_imagebanner)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`banners\`;
CREATE TABLE \`banners\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`user_id\` INT UNSIGNED NOT NULL DEFAULT 1,
  \`title\` VARCHAR(150) NOT NULL,
  \`image_url\` VARCHAR(350) NOT NULL,
  \`link_url\` VARCHAR(350) NOT NULL,
  \`alt_text\` VARCHAR(255) DEFAULT NULL,
  \`position\` VARCHAR(50) NOT NULL DEFAULT 'hero',
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_banners_pos\` (\`position\`),
  INDEX \`idx_banners_active\` (\`is_active\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`banners\` (\`id\`, \`user_id\`, \`title\`, \`image_url\`, \`link_url\`, \`alt_text\`, \`position\`, \`is_active\`, \`created_at\`) VALUES
(1, 1, 'FSIA National Recognition', 'https://greenlight.fsia.in/assets/img/imagebanner/1775821715.png', 'https://greenlight.fsia.in/what-is-fsia-platform', 'FSIA Banner 1', 'hero', 1, '2026-04-10 02:04:39'),
(2, 1, 'Top Travel Destinations', 'https://greenlight.fsia.in/assets/img/imagebanner/1775827619.png', 'https://greenlight.fsia.in/top-10-tourist-places-in-india', 'Travel Banner 2', 'hero', 1, '2026-04-10 02:04:52'),
(3, 1, 'Luxury Hotels of India', 'https://greenlight.fsia.in/assets/img/imagebanner/1775822317.png', 'https://greenlight.fsia.in/top-hotels-in-india', 'Hotels Banner 3', 'sidebar', 1, '2026-04-10 02:04:42'),
(4, 1, 'Super Startups & Enterprises', 'https://greenlight.fsia.in/assets/img/imagebanner/1775822369.png', 'https://greenlight.fsia.in/successful-startups-india-business-landscape', 'Business Banner 4', 'sidebar', 1, '2026-04-10 02:04:33'),
(5, 1, 'Celebrity & Influencer Trends', 'https://greenlight.fsia.in/assets/img/imagebanner/1775822396.png', 'https://greenlight.fsia.in/top-instagram-influencers-india', 'Lifestyle Banner 5', 'footer', 1, '2026-04-10 02:04:58');

-- ------------------------------------------------------------------------------
-- 9. TABLE: site_settings (Migrated from ci_setting & ci_general_settings)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`site_settings\`;
CREATE TABLE \`site_settings\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`setting_key\` VARCHAR(100) NOT NULL UNIQUE,
  \`setting_value\` LONGTEXT NOT NULL,
  \`setting_group\` VARCHAR(50) NOT NULL DEFAULT 'general',
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_settings_key\` (\`setting_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`site_settings\` (\`setting_key\`, \`setting_value\`, \`setting_group\`) VALUES
('site_name', 'Greenlight News & Media', 'general'),
('site_tagline', 'Empowering Talent, Visionaries & Achievements Across India', 'general'),
('site_url', 'https://greenlight.fsia.in', 'general'),
('contact_email', 'info@fsia.in', 'contact'),
('contact_phone', '9772051999', 'contact'),
('contact_address', '43, Shyam Villa (Basement), Parvati Nagar, Janpath Road, Nirman Nagar, Jaipur 302019, Rajasthan, India', 'contact'),
('google_maps_embed', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d264.4796377561142!2d75.75566324586687!3d26.890808180702752!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db4f4b854570d:0xfbd761dc30e6e510!2sRiddhi Siddhi Departmental Store!5e0!3m2!1sen!2sin!4v1698838289478!5m2!1sen!2sin', 'contact'),
('about_us', 'Green Light is a global blog-cum-magazine space intended to empower professionals, brands, entrepreneurs, and new talent through global visibility and high digital authority. In 2026, Green Light merged with Forever Star India (FSIA) as a milestone in talent celebration, business leadership, and credible digital storytelling across India and beyond.', 'about'),
('social_facebook', 'https://facebook.com/fsiaawards', 'social'),
('social_instagram', 'https://instagram.com/fsiaawards', 'social'),
('social_youtube', 'https://youtube.com/fsiaawards', 'social'),
('social_twitter', 'https://twitter.com/fsiaawards', 'social');

-- ------------------------------------------------------------------------------
-- 10. TABLE: subscribers (Migrated from ci_subscribe)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`subscribers\`;
CREATE TABLE \`subscribers\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`email\` VARCHAR(150) NOT NULL,
  \`status\` ENUM('active', 'unsubscribed') NOT NULL DEFAULT 'active',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_sub_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`subscribers\` (\`id\`, \`email\`, \`created_at\`) VALUES
(1, 'reader1@fsia.in', '2026-03-26 09:03:05'),
(2, 'press@greenlight.fsia.in', '2026-03-28 06:03:47'),
(3, 'contact@fsiaawards.com', '2026-03-31 08:03:32'),
(4, 'editorial@fsia.in', '2026-04-02 06:04:12'),
(5, 'subscribers@greenlight.fsia.in', '2026-09-18 09:09:17');

SET FOREIGN_KEY_CHECKS = 1;
`;
