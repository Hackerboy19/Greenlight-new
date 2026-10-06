-- Digital magazine (flipbook) issues, built in the Admin CMS "Magazine" tab.
--
-- An issue is an ordered set of pages. Each page is either an image (usually
-- a full-page scan or design uploaded through the media library) or a text
-- page with a heading and plain-text body. The first page is the cover.
-- Readers only see issues whose status is 'published', at /magazine.
--
-- Pages are saved together with their issue: the app deletes and re-inserts
-- an issue's pages in one transaction whenever the issue is saved.

CREATE TABLE IF NOT EXISTS magazine_issues (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title           VARCHAR(200)    NOT NULL,
  slug            VARCHAR(140)    NOT NULL,
  issue_label     VARCHAR(80)     NULL,
  description     VARCHAR(600)    NULL,
  status          ENUM('draft','published') NOT NULL DEFAULT 'draft',
  published_at    DATETIME        NULL,
  created_by      BIGINT UNSIGNED NULL,
  updated_by_name VARCHAR(150)    NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_magazine_issue_slug (slug),
  KEY idx_magazine_issue_status (status, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS magazine_pages (
  id         BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  issue_id   BIGINT UNSIGNED   NOT NULL,
  position   SMALLINT UNSIGNED NOT NULL,
  kind       ENUM('image','text') NOT NULL,
  image_url  VARCHAR(700)      NULL,
  alt_text   VARCHAR(300)      NULL,
  heading    VARCHAR(200)      NULL,
  body       TEXT              NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_magazine_page_position (issue_id, position),
  CONSTRAINT fk_magazine_page_issue FOREIGN KEY (issue_id) REFERENCES magazine_issues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
