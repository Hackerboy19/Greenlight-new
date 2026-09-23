-- Editorial activity log for the Admin CMS dashboard ("Recent Activity").
--
-- One row per change a CMS user makes to an article: created, edited,
-- submitted for review, published, unpublished or deleted. The actor's name
-- and role and the article's title are copied into the row, so the feed still
-- reads correctly after a user is renamed or an article is deleted.
--
-- article_id has no foreign key yet: articles are still kept in the app's
-- in-memory store, not in the articles table.

CREATE TABLE IF NOT EXISTS activity_log (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NULL,
  actor_name    VARCHAR(150)    NOT NULL,
  actor_role    VARCHAR(32)     NOT NULL,
  action        VARCHAR(32)     NOT NULL,
  article_id    BIGINT UNSIGNED NULL,
  article_title VARCHAR(255)    NOT NULL DEFAULT '',
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_created (created_at),
  KEY idx_activity_article (article_id),
  KEY idx_activity_actor (actor_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
