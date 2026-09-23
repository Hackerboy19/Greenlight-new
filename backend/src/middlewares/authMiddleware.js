/**
 * Authentication and Role-Based Access Control (RBAC) Middleware
 * Enforces JWT token validation and role-level authorization ('admin', 'editor', 'author')
 */

import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { getLiveAccount } from '../modules/auth/userStore.js';

const JWT_ALGORITHM = 'HS256';
const DEFAULT_TOKEN_LIFETIME = '12h';

// Development-only signing key, generated per process so no shared default
// secret ever lives in source. Tokens signed with it stop working on restart.
let devSecret = null;

/**
 * Returns the JWT signing secret. In production JWT_SECRET must be set; there
 * is deliberately no fallback, because a known default lets anyone forge an
 * admin token.
 */
export function getJwtSecret() {
  const configured = process.env.JWT_SECRET;
  if (configured && configured.length > 0) return configured;
  if (process.env.NODE_ENV === 'production') return null;
  if (!devSecret) {
    devSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[Auth] JWT_SECRET is not set. Using a temporary development key; sign-ins reset when the server restarts.');
  }
  return devSecret;
}

function missingSecretResponse(res) {
  return res.status(500).json({
    status: 500,
    error: 'Server Misconfigured',
    message: 'Sign-in is unavailable because JWT_SECRET is not configured on the server.'
  });
}

/**
 * Validates bearer JWT token on incoming requests
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null;

  if (!token) {
    return res.status(401).json({
      status: 401,
      error: 'Unauthorized',
      message: 'Access denied. No bearer authorization token provided.'
    });
  }

  const secret = getJwtSecret();
  if (!secret) return missingSecretResponse(res);

  let decoded;
  try {
    decoded = jwt.verify(token, secret, { algorithms: [JWT_ALGORITHM] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 401,
        error: 'Token Expired',
        message: 'Your authentication session has expired. Please sign in again.'
      });
    }
    return res.status(401).json({
      status: 401,
      error: 'Unauthorized',
      message: 'Invalid authorization token. Please sign in again.'
    });
  }

  req.user = {
    id: /^\d+$/.test(String(decoded.sub)) ? Number(decoded.sub) : decoded.sub,
    name: decoded.name,
    email: decoded.email,
    role: decoded.role
  };

  // Accounts from the users table are re-checked, so a disabled account or a
  // changed role takes effect without waiting for the token to expire.
  if (decoded.src !== 'database') return next();
  getLiveAccount(req.user.id)
    .then((account) => {
      if (!account || !account.isActive || !account.role) {
        return res.status(401).json({
          status: 401,
          error: 'Unauthorized',
          message: 'This account has been disabled. Please contact an admin.'
        });
      }
      req.user.role = account.role;
      next();
    })
    .catch((err) => {
      console.error(`[Auth] Could not re-check user ${req.user.id}: ${err.message}`);
      res.status(503).json({
        status: 503,
        error: 'Service Unavailable',
        message: 'Could not confirm your account right now. Please try again.'
      });
    });
};

/**
 * Role-Based Access Control (RBAC) hierarchy
 * Hierarchy: admin > editor > author
 */
const ROLE_HIERARCHY = {
  admin: ['admin', 'editor', 'author'],
  editor: ['editor', 'author'],
  author: ['author']
};

/**
 * Middleware factory to authorize specific roles
 * @param {string|Array<string>} requiredRoles - Minimum role required or list of permitted roles
 */
export const authorizeRole = (...requiredRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        status: 403,
        error: 'Forbidden',
        message: 'No authenticated user role context present.'
      });
    }

    const userRole = req.user.role.toLowerCase();
    const userPermissions = ROLE_HIERARCHY[userRole] || [userRole];

    const hasPermission = requiredRoles.flat().some(role => 
      userPermissions.includes(role.toLowerCase())
    );

    if (!hasPermission) {
      return res.status(403).json({
        status: 403,
        error: 'Forbidden',
        message: `Role '${userRole}' lacks required permissions (${requiredRoles.join(', ')}).`
      });
    }

    next();
  };
};

/**
 * Signs a session token for a CMS user. Throws when no signing secret is
 * available (production without JWT_SECRET).
 * @param {{ id: number|string, name: string, email: string, role: string, source?: string }} user
 */
export const generateToken = (user, expiresIn = process.env.JWT_EXPIRES_IN || DEFAULT_TOKEN_LIFETIME) => {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return jwt.sign(
    { name: user.name, email: user.email, role: user.role, src: user.source },
    secret,
    { algorithm: JWT_ALGORITHM, expiresIn, subject: String(user.id) }
  );
};

export default {
  getJwtSecret,
  authenticateToken,
  authorizeRole,
  generateToken
};
