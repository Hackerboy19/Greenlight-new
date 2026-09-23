-- Saves the CMS content (articles, categories, authors) in MySQL.
--
-- Until now the app kept articles in memory and lost every edit on restart.
-- The tables from migrations 001-003 are used as they are; this adds the
-- fields the editor has that they lack:
--   cover_image_url / og_image_url  image addresses typed or picked in the editor
--   meta_keywords                   the SEO keywords field
--   extra_json                      anything else the editor stores on a row
-- summary becomes TEXT because excerpts imported from the old site can be long,
-- and meta_description is widened for the same reason.

ALTER TABLE articles
  ADD COLUMN cover_image_url VARCHAR(700) NULL AFTER cover_media_id,
  ADD COLUMN og_image_url    VARCHAR(700) NULL AFTER og_media_id,
  ADD COLUMN meta_keywords   VARCHAR(500) NULL AFTER meta_description,
  ADD COLUMN extra_json      LONGTEXT     NULL,
  MODIFY summary          TEXT         NULL,
  MODIFY meta_description VARCHAR(500) NULL;

ALTER TABLE categories
  ADD COLUMN extra_json LONGTEXT NULL;

ALTER TABLE authors
  ADD COLUMN extra_json LONGTEXT NULL;
