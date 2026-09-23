-- Role-based access control for the Admin CMS.
--
-- Roles:  admin  (full access)
--         editor (edit and publish every article)
--         author (write and edit their own drafts, submit them for review)
--
-- users.role becomes a key into the roles table, and the old 'writer' role
-- is renamed 'author'. The permission matrix below is what the API enforces
-- (backend/src/modules/auth/permissions.js loads it at startup); editing the
-- role_permissions rows changes what a role may do without a code change
-- (the server reads them at startup, so restart it after editing).

CREATE TABLE IF NOT EXISTS roles (
  slug        VARCHAR(32)  NOT NULL,
  name        VARCHAR(64)  NOT NULL,
  description VARCHAR(255) NOT NULL,
  rank_order  TINYINT UNSIGNED NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
  slug        VARCHAR(64)  NOT NULL,
  description VARCHAR(255) NOT NULL,
  PRIMARY KEY (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_slug       VARCHAR(32) NOT NULL,
  permission_slug VARCHAR(64) NOT NULL,
  PRIMARY KEY (role_slug, permission_slug),
  KEY idx_role_permissions_permission (permission_slug),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_slug)
    REFERENCES roles(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_slug)
    REFERENCES permissions(slug) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO roles (slug, name, description, rank_order) VALUES
  ('admin',  'Admin',  'Full access, including users and settings.',        3),
  ('editor', 'Editor', 'Edits and publishes every article.',                2),
  ('author', 'Author', 'Writes and edits their own drafts, then submits them for review.', 1);

INSERT IGNORE INTO permissions (slug, description) VALUES
  ('article.create',   'Create new articles'),
  ('article.edit.own', 'Edit your own draft articles'),
  ('article.edit.any', 'Edit any article, whatever its author or status'),
  ('article.submit',   'Submit a draft for editorial review'),
  ('article.publish',  'Publish, schedule or unpublish articles'),
  ('article.delete',   'Delete articles'),
  ('article.feature',  'Feature articles on the homepage'),
  ('category.manage',  'Create, edit and reorder categories'),
  ('category.delete',  'Delete categories'),
  ('author.manage',    'Create, edit and delete author profiles'),
  ('user.manage',      'Create CMS users and change their roles'),
  ('media.upload',     'Upload images to the media library'),
  ('analytics.view',   'View traffic and Search Console reports'),
  ('settings.manage',  'Run syncs and change site settings');

INSERT IGNORE INTO role_permissions (role_slug, permission_slug)
  SELECT 'admin', slug FROM permissions;

INSERT IGNORE INTO role_permissions (role_slug, permission_slug) VALUES
  ('editor', 'article.create'),
  ('editor', 'article.edit.own'),
  ('editor', 'article.edit.any'),
  ('editor', 'article.submit'),
  ('editor', 'article.publish'),
  ('editor', 'article.feature'),
  ('editor', 'category.manage'),
  ('editor', 'media.upload'),
  ('editor', 'analytics.view'),
  ('author', 'article.create'),
  ('author', 'article.edit.own'),
  ('author', 'article.submit'),
  ('author', 'media.upload');

-- users.role: ENUM('admin','editor','writer') -> key into roles.
-- The explicit collation matches roles.slug, which the foreign key requires.
ALTER TABLE users MODIFY role VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  NOT NULL DEFAULT 'author';
UPDATE users SET role = 'author' WHERE role = 'writer';
ALTER TABLE users
  ADD KEY idx_users_role (role),
  ADD CONSTRAINT fk_users_role FOREIGN KEY (role)
    REFERENCES roles(slug) ON UPDATE CASCADE;
