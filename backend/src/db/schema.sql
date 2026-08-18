-- =========================================================================
-- Greenlight Database Schema (MySQL 8.0+)
-- Target Domain: https://greenlight.fsia.in/
-- =========================================================================

CREATE DATABASE IF NOT EXISTS `greenlight_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `greenlight_db`;

-- Authors & Users Table
CREATE TABLE IF NOT EXISTS `authors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `role` ENUM('admin', 'editor', 'author') NOT NULL DEFAULT 'author',
  `bio` TEXT NULL,
  `avatar_url` VARCHAR(512) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_authors_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL UNIQUE,
  `description` VARCHAR(500) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categories_order` (`display_order`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Articles Table
CREATE TABLE IF NOT EXISTS `articles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(500) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `excerpt` VARCHAR(1000) NULL,
  `content` LONGTEXT NOT NULL,
  `featured_image` VARCHAR(1000) NULL,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `author_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `views_count` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `reading_time` INT NOT NULL DEFAULT 1,
  `published_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_articles_category` (`category_id`),
  KEY `idx_articles_author` (`author_id`),
  KEY `idx_articles_status_published` (`status`, `published_at`),
  FULLTEXT KEY `ft_articles_search` (`title`, `excerpt`, `content`),
  CONSTRAINT `fk_articles_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_articles_author` FOREIGN KEY (`author_id`) REFERENCES `authors` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Article Wikipedia Infobox Key-Value Store
CREATE TABLE IF NOT EXISTS `article_infobox` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `article_id` BIGINT UNSIGNED NOT NULL,
  `section_name` VARCHAR(100) NOT NULL DEFAULT 'Overview',
  `field_key` VARCHAR(191) NOT NULL,
  `field_value` TEXT NOT NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_infobox_article` (`article_id`),
  CONSTRAINT `fk_infobox_article` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Google Search Console Daily Time-Series Search Analytics Table
CREATE TABLE IF NOT EXISTS `gsc_search_analytics` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `property_url` VARCHAR(255) NOT NULL,
  `record_date` DATE NOT NULL,
  `search_query` VARCHAR(500) NOT NULL,
  `page_url` VARCHAR(1000) NOT NULL,
  `clicks` INT UNSIGNED NOT NULL DEFAULT 0,
  `impressions` INT UNSIGNED NOT NULL DEFAULT 0,
  `ctr` DECIMAL(6,4) NOT NULL DEFAULT 0.0000,
  `position` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_property_date_query_page` (`property_url`, `record_date`, `search_query`(200), `page_url`(300)),
  KEY `idx_gsc_date` (`record_date`),
  KEY `idx_gsc_query` (`search_query`(100)),
  KEY `idx_gsc_page` (`page_url`(150))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
