CREATE TABLE IF NOT EXISTS categories (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id    BIGINT UNSIGNED NULL,
  slug         VARCHAR(120)    NOT NULL,
  name         VARCHAR(120)    NOT NULL,
  description  VARCHAR(500)    NULL,
  color_hex    CHAR(7)         NULL,
  icon         VARCHAR(60)     NULL,
  sort_order   INT             NOT NULL DEFAULT 0,
  show_on_home TINYINT(1)      NOT NULL DEFAULT 1,
  is_active    TINYINT(1)      NOT NULL DEFAULT 1,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug),
  KEY idx_categories_home (show_on_home, is_active, sort_order),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS media (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uploaded_by BIGINT UNSIGNED NULL,
  file_path   VARCHAR(500)    NOT NULL,
  file_url    VARCHAR(700)    NOT NULL,
  mime_type   VARCHAR(100)    NOT NULL,
  file_size   INT UNSIGNED    NOT NULL,
  width       INT UNSIGNED    NULL,
  height      INT UNSIGNED    NULL,
  alt_text    VARCHAR(300)    NULL,
  caption     VARCHAR(500)    NULL,
  credit      VARCHAR(200)    NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_media_created (created_at),
  CONSTRAINT fk_media_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
