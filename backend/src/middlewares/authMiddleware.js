/**
 * Authentication and Role-Based Access Control (RBAC) Middleware
 * Enforces JWT token validation and role-level authorization ('admin', 'editor', 'author')
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'greenlight-production-secret-key-2026';

/**
 * Validates bearer JWT token on incoming requests
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : (req.query && req.query.token) || req.cookies?.token;

  if (!token) {
    // In dev / test mode, allow fallback admin simulation if header contains x-test-role
    if (process.env.NODE_ENV !== 'production' && req.headers['x-test-role']) {
      req.user = {
        id: 1,
        name: 'Super Admin',
        email: 'admin@greenlight.fsia.in',
        role: req.headers['x-test-role'] || 'admin'
      };
      return next();
    }

    return res.status(401).json({
      status: 401,
      error: 'Unauthorized',
      message: 'Access denied. No bearer authorization token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 401,
        error: 'Token Expired',
        message: 'Your authentication session has expired. Please sign in again.'
      });
    }
    return res.status(403).json({
      status: 403,
      error: 'Forbidden',
      message: 'Invalid authorization token.'
    });
  }
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
 * Helper to generate signed JWT tokens
 */
export const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export default {
  authenticateToken,
  authorizeRole,
  generateToken
};
