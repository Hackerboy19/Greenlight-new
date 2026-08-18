CREATE TABLE IF NOT EXISTS tags (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(120)    NOT NULL,
  name        VARCHAR(120)    NOT NULL,
  usage_count INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tags_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS article_tags (
  article_id BIGINT UNSIGNED NOT NULL,
  tag_id     BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  KEY idx_article_tags_tag (tag_id, article_id),
  CONSTRAINT fk_at_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_at_tag     FOREIGN KEY (tag_id)     REFERENCES tags(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS article_related (
  article_id         BIGINT UNSIGNED NOT NULL,
  related_article_id BIGINT UNSIGNED NOT NULL,
  display_order      INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (article_id, related_article_id),
  CONSTRAINT fk_rel_a FOREIGN KEY (article_id)         REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rel_b FOREIGN KEY (related_article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS article_revisions (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  article_id BIGINT UNSIGNED NOT NULL,
  title      VARCHAR(255)    NOT NULL,
  body_html  MEDIUMTEXT      NULL,
  snapshot   JSON            NULL,
  edited_by  BIGINT UNSIGNED NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rev_article (article_id, created_at DESC),
  CONSTRAINT fk_rev_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rev_user    FOREIGN KEY (edited_by)  REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS redirects (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  from_path   VARCHAR(500)    NOT NULL,
  to_path     VARCHAR(500)    NOT NULL,
  status_code SMALLINT        NOT NULL DEFAULT 301,
  hit_count   BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_redirects_from (from_path(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS settings (
  setting_key   VARCHAR(100) NOT NULL,
  setting_value TEXT         NULL,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
