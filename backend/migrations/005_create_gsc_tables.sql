CREATE TABLE IF NOT EXISTS gsc_properties (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  property_uri   VARCHAR(255)  NOT NULL,
  property_type  ENUM('domain','url_prefix') NOT NULL DEFAULT 'domain',
  display_name   VARCHAR(150)  NOT NULL,
  primary_host   VARCHAR(255)  NULL,
  is_active      TINYINT(1)    NOT NULL DEFAULT 1,
  last_synced_at DATETIME      NULL,
  earliest_date  DATE          NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gsc_prop (property_uri)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS gsc_pages (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id INT UNSIGNED    NOT NULL,
  url         VARCHAR(1000)   NOT NULL,
  url_hash    BINARY(20)      NOT NULL,
  host        VARCHAR(255)    NOT NULL,
  url_path    VARCHAR(800)    NOT NULL,
  article_id  BIGINT UNSIGNED NULL,
  first_seen  DATE            NOT NULL,
  last_seen   DATE            NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gsc_pages (property_id, url_hash),
  KEY idx_gsc_pages_host (property_id, host),
  KEY idx_gsc_pages_path (property_id, url_path(191)),
  KEY idx_gsc_pages_article (article_id),
  CONSTRAINT fk_gsc_pages_prop FOREIGN KEY (property_id) REFERENCES gsc_properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS gsc_queries (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  query_text VARCHAR(500)    NOT NULL,
  query_hash BINARY(20)      NOT NULL,
  first_seen DATE            NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gsc_queries (query_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS gsc_site_daily (
  property_id INT UNSIGNED NOT NULL,
  search_type ENUM('web','news','googleNews','discover','image','video') NOT NULL DEFAULT 'web',
  date        DATE         NOT NULL,
  clicks      INT UNSIGNED NOT NULL DEFAULT 0,
  impressions INT UNSIGNED NOT NULL DEFAULT 0,
  position    DECIMAL(6,2) NOT NULL DEFAULT 0,
  ctr         DECIMAL(7,6) GENERATED ALWAYS AS (IF(impressions = 0, 0, clicks / impressions)) STORED,
  fetched_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (property_id, search_type, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS gsc_page_daily (
  property_id INT UNSIGNED    NOT NULL,
  search_type ENUM('web','news','googleNews','discover','image','video') NOT NULL DEFAULT 'web',
  date        DATE            NOT NULL,
  page_id     BIGINT UNSIGNED NOT NULL,
  clicks      INT UNSIGNED    NOT NULL DEFAULT 0,
  impressions INT UNSIGNED    NOT NULL DEFAULT 0,
  position    DECIMAL(6,2)    NOT NULL DEFAULT 0,
  ctr         DECIMAL(7,6) GENERATED ALWAYS AS (IF(impressions = 0, 0, clicks / impressions)) STORED,
  PRIMARY KEY (property_id, search_type, date, page_id),
  KEY idx_pd_page_date (page_id, search_type, date),
  KEY idx_pd_top (property_id, search_type, date, clicks DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
PARTITION BY RANGE (TO_DAYS(date)) (
  PARTITION p2025q2 VALUES LESS THAN (TO_DAYS('2025-07-01')),
  PARTITION p2025q3 VALUES LESS THAN (TO_DAYS('2025-10-01')),
  PARTITION p2025q4 VALUES LESS THAN (TO_DAYS('2026-01-01')),
  PARTITION p2026q1 VALUES LESS THAN (TO_DAYS('2026-04-01')),
  PARTITION p2026q2 VALUES LESS THAN (TO_DAYS('2026-07-01')),
  PARTITION p2026q3 VALUES LESS THAN (TO_DAYS('2026-10-01')),
  PARTITION p2026q4 VALUES LESS THAN (TO_DAYS('2027-01-01')),
  PARTITION p2027q1 VALUES LESS THAN (TO_DAYS('2027-04-01')),
  PARTITION pmax    VALUES LESS THAN MAXVALUE
);

CREATE TABLE IF NOT EXISTS gsc_query_daily (
  property_id INT UNSIGNED    NOT NULL,
  search_type ENUM('web','news','image','video') NOT NULL DEFAULT 'web',
  date        DATE            NOT NULL,
  query_id    BIGINT UNSIGNED NOT NULL,
  clicks      INT UNSIGNED    NOT NULL DEFAULT 0,
  impressions INT UNSIGNED    NOT NULL DEFAULT 0,
  position    DECIMAL(6,2)    NOT NULL DEFAULT 0,
  ctr         DECIMAL(7,6) GENERATED ALWAYS AS (IF(impressions = 0, 0, clicks / impressions)) STORED,
  PRIMARY KEY (property_id, search_type, date, query_id),
  KEY idx_qd_query_date (query_id, search_type, date),
  KEY idx_qd_top (property_id, search_type, date, clicks DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
PARTITION BY RANGE (TO_DAYS(date)) (
  PARTITION p2025q2 VALUES LESS THAN (TO_DAYS('2025-07-01')),
  PARTITION p2025q3 VALUES LESS THAN (TO_DAYS('2025-10-01')),
  PARTITION p2025q4 VALUES LESS THAN (TO_DAYS('2026-01-01')),
  PARTITION p2026q1 VALUES LESS THAN (TO_DAYS('2026-04-01')),
  PARTITION p2026q2 VALUES LESS THAN (TO_DAYS('2026-07-01')),
  PARTITION p2026q3 VALUES LESS THAN (TO_DAYS('2026-10-01')),
  PARTITION p2026q4 VALUES LESS THAN (TO_DAYS('2027-01-01')),
  PARTITION p2027q1 VALUES LESS THAN (TO_DAYS('2027-04-01')),
  PARTITION pmax    VALUES LESS THAN MAXVALUE
);

CREATE TABLE IF NOT EXISTS gsc_page_query_daily (
  property_id INT UNSIGNED    NOT NULL,
  search_type ENUM('web','news') NOT NULL DEFAULT 'web',
  date        DATE            NOT NULL,
  page_id     BIGINT UNSIGNED NOT NULL,
  query_id    BIGINT UNSIGNED NOT NULL,
  clicks      INT UNSIGNED    NOT NULL DEFAULT 0,
  impressions INT UNSIGNED    NOT NULL DEFAULT 0,
  position    DECIMAL(6,2)    NOT NULL DEFAULT 0,
  PRIMARY KEY (property_id, search_type, date, page_id, query_id),
  KEY idx_pqd_page (page_id, search_type, date),
  KEY idx_pqd_query (query_id, search_type, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
PARTITION BY RANGE (TO_DAYS(date)) (
  PARTITION p2025q2 VALUES LESS THAN (TO_DAYS('2025-07-01')),
  PARTITION p2025q3 VALUES LESS THAN (TO_DAYS('2025-10-01')),
  PARTITION p2025q4 VALUES LESS THAN (TO_DAYS('2026-01-01')),
  PARTITION p2026q1 VALUES LESS THAN (TO_DAYS('2026-04-01')),
  PARTITION p2026q2 VALUES LESS THAN (TO_DAYS('2026-07-01')),
  PARTITION p2026q3 VALUES LESS THAN (TO_DAYS('2026-10-01')),
  PARTITION p2026q4 VALUES LESS THAN (TO_DAYS('2027-01-01')),
  PARTITION p2027q1 VALUES LESS THAN (TO_DAYS('2027-04-01')),
  PARTITION pmax    VALUES LESS THAN MAXVALUE
);

CREATE TABLE IF NOT EXISTS gsc_sync_runs (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id   INT UNSIGNED    NOT NULL,
  search_type   VARCHAR(20)     NOT NULL,
  dimension_set ENUM('site','page','query','page_query') NOT NULL,
  target_date   DATE            NOT NULL,
  status        ENUM('pending','running','success','partial','failed','skipped') NOT NULL DEFAULT 'pending',
  rows_fetched  INT UNSIGNED    NOT NULL DEFAULT 0,
  rows_written  INT UNSIGNED    NOT NULL DEFAULT 0,
  attempt       SMALLINT        NOT NULL DEFAULT 1,
  error_message TEXT            NULL,
  started_at    DATETIME        NULL,
  finished_at   DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sync (property_id, search_type, dimension_set, target_date, attempt),
  KEY idx_sync_status (status, target_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
