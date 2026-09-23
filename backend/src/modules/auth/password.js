/**
 * Password hashing for CMS users.
 *
 * New hashes use scrypt with a per-password random salt, stored as
 *   scrypt:<N>:<r>:<p>:<salt base64url>:<hash base64url>
 * (colons rather than '$' so the value survives .env files and shells that
 * expand variables).
 * Older rows seeded with an unsalted SHA-256 hex digest still verify, and
 * needsRehash() tells the login flow to upgrade them on the next sign-in.
 */

import crypto from 'node:crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

function scrypt(password, salt, n, r, p, keyLength) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password must be a non-empty string.');
  }
  const salt = crypto.randomBytes(SALT_BYTES);
  const key = await scrypt(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P, KEY_LENGTH);
  return ['scrypt', SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString('base64url'), key.toString('base64url')].join(':');
}

const LEGACY_SHA256 = /^[a-f0-9]{64}$/i;

/**
 * Compares a candidate password with a stored hash in constant time.
 * Returns false for malformed or unknown hash formats instead of throwing.
 */
export async function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string' || !storedHash) {
    return false;
  }

  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 6) return false;
    const [, nRaw, rRaw, pRaw, saltRaw, keyRaw] = parts;
    const n = Number(nRaw);
    const r = Number(rRaw);
    const p = Number(pRaw);
    if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
    const expected = Buffer.from(keyRaw, 'base64url');
    if (expected.length === 0) return false;
    try {
      const actual = await scrypt(password, Buffer.from(saltRaw, 'base64url'), n, r, p, expected.length);
      return crypto.timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  }

  if (LEGACY_SHA256.test(storedHash)) {
    const actual = crypto.createHash('sha256').update(password).digest();
    return crypto.timingSafeEqual(actual, Buffer.from(storedHash, 'hex'));
  }

  return false;
}

/** True when a stored hash uses an older or weaker format than hashPassword() produces. */
export function needsRehash(storedHash) {
  if (typeof storedHash !== 'string' || !storedHash.startsWith('scrypt:')) return true;
  const [, n, r, p] = storedHash.split(':');
  return Number(n) !== SCRYPT_N || Number(r) !== SCRYPT_R || Number(p) !== SCRYPT_P;
}

// A fixed hash to verify against when no account matches, so a wrong email
// and a wrong password take about the same time to reject.
let dummyHashPromise = null;
export function getDummyHash() {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword(crypto.randomBytes(16).toString('hex'));
  }
  return dummyHashPromise;
}
