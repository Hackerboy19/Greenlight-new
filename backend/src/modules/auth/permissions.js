/**
 * Role-based permissions for the Admin CMS.
 *
 * The role -> permission matrix lives in MySQL (roles, permissions and
 * role_permissions, created by migration 006). It is loaded once the database
 * is reachable; until then, or when MySQL isn't configured, the defaults below
 * apply. They match the rows migration 006 seeds.
 */

import { pool, databaseReady } from '../../config/database.js';

export const ROLES = ['admin', 'editor', 'author'];

export const PERMISSIONS = [
  'article.create',
  'article.edit.own',
  'article.edit.any',
  'article.submit',
  'article.publish',
  'article.delete',
  'article.feature',
  'category.manage',
  'category.delete',
  'author.manage',
  'user.manage',
  'media.upload',
  'analytics.view',
  'settings.manage'
];

const DEFAULT_MATRIX = {
  admin: [...PERMISSIONS],
  editor: [
    'article.create',
    'article.edit.own',
    'article.edit.any',
    'article.submit',
    'article.publish',
    'article.feature',
    'category.manage',
    'media.upload',
    'analytics.view'
  ],
  author: ['article.create', 'article.edit.own', 'article.submit', 'media.upload']
};

function toSets(matrix) {
  return Object.fromEntries(Object.entries(matrix).map(([role, perms]) => [role, new Set(perms)]));
}

let matrix = toSets(DEFAULT_MATRIX);

/**
 * Replaces the defaults with the database's matrix. Keeps the defaults when
 * the tables don't exist yet (migrations not run) or hold no rows.
 */
export async function loadPermissionsFromDatabase() {
  const connected = await databaseReady;
  if (!connected) return false;
  try {
    const [rows] = await pool.query('SELECT role_slug, permission_slug FROM role_permissions');
    if (!rows.length) return false;
    const loaded = {};
    for (const { role_slug: role, permission_slug: permission } of rows) {
      (loaded[role] ||= []).push(permission);
    }
    matrix = toSets(loaded);
    console.log(`[Auth] Loaded role permissions for: ${Object.keys(loaded).join(', ')}`);
    return true;
  } catch (err) {
    console.warn(`[Auth] Using built-in role permissions (${err.message}). Run "npm run db:migrate" to create the RBAC tables.`);
    return false;
  }
}

loadPermissionsFromDatabase();

/** True when the role grants the permission. Unknown roles get nothing. */
export function can(role, permission) {
  const granted = matrix[String(role || '').toLowerCase()];
  return Boolean(granted && granted.has(permission));
}

/** Sorted permission list for a role, for the client to show or hide actions. */
export function permissionsFor(role) {
  const granted = matrix[String(role || '').toLowerCase()];
  return granted ? [...granted].sort() : [];
}

/**
 * Express middleware: allows the request when the signed-in user's role has
 * at least one of the listed permissions. Run after authenticateToken.
 */
export function requirePermission(...permissions) {
  const wanted = permissions.flat();
  return (req, res, next) => {
    const role = req.user && req.user.role;
    if (role && wanted.some((p) => can(role, p))) return next();
    return res.status(403).json({
      status: 403,
      error: 'Forbidden',
      message: `Your role (${role || 'none'}) is not allowed to do this. Needs: ${wanted.join(' or ')}.`
    });
  };
}
