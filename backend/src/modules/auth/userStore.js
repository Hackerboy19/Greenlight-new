/**
 * Looks up CMS accounts for sign-in.
 *
 * Sources, in order:
 *   1. The MySQL `users` table, when the database is reachable.
 *   2. A single bootstrap admin from ADMIN_EMAIL + ADMIN_PASSWORD_HASH, for
 *      deployments that run without MySQL (hash it with
 *      `npx tsx backend/scripts/hash-password.ts`).
 *   3. Outside production only, when neither of the above exists, a local
 *      development admin whose random password is printed to the server log.
 */

import crypto from 'node:crypto';
import { pool, databaseReady, memoryStore } from '../../config/database.js';
import { hashPassword, needsRehash } from './password.js';

// Databases migrated before 006_rbac_roles_permissions still store 'writer' for authors.
const ROLE_ALIASES = { admin: 'admin', editor: 'editor', author: 'author', writer: 'author' };

export function normalizeRole(role) {
  return ROLE_ALIASES[String(role || '').toLowerCase()] || null;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function staffProfileId(email) {
  const author = memoryStore.authors.find((a) => normalizeEmail(a.email) === email);
  return author ? author.id : 0;
}

function envAdmin() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !passwordHash) return null;
  return {
    id: staffProfileId(email),
    email,
    name: process.env.ADMIN_NAME || 'Site Admin',
    role: 'admin',
    passwordHash,
    isActive: true,
    source: 'env'
  };
}

let devAdminPromise = null;

function devAdmin() {
  if (process.env.NODE_ENV === 'production') return null;
  if (!devAdminPromise) {
    const password = crypto.randomBytes(12).toString('base64url');
    devAdminPromise = hashPassword(password).then((passwordHash) => {
      console.log('===========================================================');
      console.log('  [Auth] No user database or ADMIN_EMAIL is configured.');
      console.log('  Development sign-in for the Admin CMS:');
      console.log('    email:    admin@localhost');
      console.log(`    password: ${password}`);
      console.log('  This account exists only outside production and changes on restart.');
      console.log('===========================================================');
      return {
        id: 0,
        email: 'admin@localhost',
        name: 'Local Admin',
        role: 'admin',
        passwordHash,
        isActive: true,
        source: 'dev'
      };
    });
  }
  return devAdminPromise;
}

// Announce the development account at startup so it can be found in the log.
databaseReady.then((connected) => {
  if (!connected && !envAdmin()) devAdmin();
});

async function findDatabaseUser(email) {
  const [rows] = await pool.execute(
    'SELECT id, email, full_name, role, password_hash, is_active FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: Number(row.id),
    email: row.email,
    name: row.full_name,
    role: row.role,
    passwordHash: row.password_hash,
    isActive: Boolean(row.is_active),
    source: 'database'
  };
}

/**
 * Returns the account for an email address, or null when none exists.
 * The returned role is the raw stored role; callers normalize it.
 */
export async function findUserByEmail(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!email) return null;

  const connected = await databaseReady;
  if (connected) {
    try {
      const user = await findDatabaseUser(email);
      if (user) return user;
    } catch (err) {
      // e.g. migrations not run yet; the bootstrap admin below can still sign in.
      console.warn(`[Auth] users table lookup failed: ${err.message}`);
    }
  }

  const bootstrap = envAdmin();
  if (bootstrap) return bootstrap.email === email ? bootstrap : null;

  if (!connected) {
    const dev = await devAdmin();
    if (dev && dev.email === email) return dev;
  }
  return null;
}

/**
 * Records a successful sign-in and upgrades legacy password hashes.
 * Failures are logged, never surfaced: they must not block a valid sign-in.
 */
export async function recordSuccessfulLogin(user, password) {
  if (user.source !== 'database') return;
  try {
    if (needsRehash(user.passwordHash)) {
      const upgraded = await hashPassword(password);
      await pool.execute(
        'UPDATE users SET password_hash = ?, last_login_at = UTC_TIMESTAMP() WHERE id = ?',
        [upgraded, user.id]
      );
    } else {
      await pool.execute('UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?', [user.id]);
    }
  } catch (err) {
    console.warn(`[Auth] Could not record sign-in for user ${user.id}: ${err.message}`);
  }
}

// Short cache so role changes and deactivations apply within seconds
// without a database round trip on every admin request.
const LIVE_ACCOUNT_TTL_MS = 30 * 1000;
const liveAccounts = new Map();

/**
 * Current role and active flag for a database user, or null when the user no
 * longer exists. Throws when the database can't be reached, so callers can
 * decide whether to fail open or closed.
 */
export async function getLiveAccount(id) {
  const cached = liveAccounts.get(id);
  if (cached && cached.expires > Date.now()) return cached.account;

  const [rows] = await pool.execute('SELECT role, is_active FROM users WHERE id = ? LIMIT 1', [id]);
  const row = rows[0];
  const account = row ? { role: normalizeRole(row.role), isActive: Boolean(row.is_active) } : null;
  liveAccounts.set(id, { account, expires: Date.now() + LIVE_ACCOUNT_TTL_MS });
  return account;
}

/** Drops cached account state, e.g. after an admin changes a user's role. */
export function forgetLiveAccount(id) {
  liveAccounts.delete(id);
}
