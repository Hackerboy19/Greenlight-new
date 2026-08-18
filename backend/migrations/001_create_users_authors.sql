CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(191)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  full_name     VARCHAR(150)    NOT NULL,
  role          ENUM('admin','editor','writer') NOT NULL DEFAULT 'writer',
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  last_login_at DATETIME        NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS authors (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NULL,
  slug          VARCHAR(120)    NOT NULL,
  display_name  VARCHAR(150)    NOT NULL,
  job_title     VARCHAR(150)    NULL,
  bio           TEXT            NULL,
  avatar_url    VARCHAR(500)    NULL,
  email_public  VARCHAR(191)    NULL,
  social_links  JSON            NULL,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  article_count INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_authors_slug (slug),
  UNIQUE KEY uq_authors_user (user_id),
  CONSTRAINT fk_authors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
