CREATE TABLE IF NOT EXISTS articles (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug             VARCHAR(200)    NOT NULL,
  title            VARCHAR(255)    NOT NULL,
  subtitle         VARCHAR(300)    NULL,
  summary          VARCHAR(500)    NULL,
  body_html        MEDIUMTEXT      NULL,
  body_text        MEDIUMTEXT      NULL,
  toc_json         JSON            NULL,

  author_id        BIGINT UNSIGNED NULL,
  category_id      BIGINT UNSIGNED NULL,
  cover_media_id   BIGINT UNSIGNED NULL,

  status           ENUM('draft','review','scheduled','published','archived') NOT NULL DEFAULT 'draft',
  is_featured      TINYINT(1)      NOT NULL DEFAULT 0,
  featured_rank    INT             NULL,
  is_breaking      TINYINT(1)      NOT NULL DEFAULT 0,

  infobox_title    VARCHAR(200)    NULL,
  infobox_media_id BIGINT UNSIGNED NULL,

  meta_title       VARCHAR(255)    NULL,
  meta_description VARCHAR(320)    NULL,
  canonical_url    VARCHAR(500)    NULL,
  og_media_id      BIGINT UNSIGNED NULL,
  robots_noindex   TINYINT(1)      NOT NULL DEFAULT 0,

  reading_minutes  SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  word_count       INT UNSIGNED    NOT NULL DEFAULT 0,
  view_count       BIGINT UNSIGNED NOT NULL DEFAULT 0,

  published_at     DATETIME        NULL,
  created_by       BIGINT UNSIGNED NULL,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at       DATETIME        NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_articles_slug (slug),
  KEY idx_articles_feed (status, deleted_at, published_at DESC),
  KEY idx_articles_category (category_id, status, published_at DESC),
  KEY idx_articles_author (author_id, status, published_at DESC),
  KEY idx_articles_featured (is_featured, status, featured_rank, published_at DESC),
  KEY idx_articles_scheduled (status, published_at),
  FULLTEXT KEY ft_articles_search (title, subtitle, summary, body_text) WITH PARSER ngram,

  CONSTRAINT fk_articles_author   FOREIGN KEY (author_id)        REFERENCES authors(id)    ON DELETE SET NULL,
  CONSTRAINT fk_articles_category FOREIGN KEY (category_id)      REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_articles_cover    FOREIGN KEY (cover_media_id)   REFERENCES media(id)      ON DELETE SET NULL,
  CONSTRAINT fk_articles_infomed  FOREIGN KEY (infobox_media_id) REFERENCES media(id)      ON DELETE SET NULL,
  CONSTRAINT fk_articles_og       FOREIGN KEY (og_media_id)      REFERENCES media(id)      ON DELETE SET NULL,
  CONSTRAINT fk_articles_creator  FOREIGN KEY (created_by)       REFERENCES users(id)      ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS article_infobox (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  article_id    BIGINT UNSIGNED NOT NULL,
  section_label VARCHAR(120)    NULL,
  field_key     VARCHAR(150)    NOT NULL,
  field_value   TEXT            NOT NULL,
  value_type    ENUM('text','html','url','date','number') NOT NULL DEFAULT 'text',
  display_order INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_infobox_article (article_id, display_order),
  CONSTRAINT fk_infobox_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
