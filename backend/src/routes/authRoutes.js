/**
 * CMS Authentication Routes
 *   POST /api/auth/login  exchange email + password for a signed session token
 *   GET  /api/auth/me     return the user behind the presented token
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken, generateToken, getJwtSecret } from '../middlewares/authMiddleware.js';
import { findUserByEmail, normalizeRole, recordSuccessfulLogin } from '../modules/auth/userStore.js';
import { verifyPassword, getDummyHash } from '../modules/auth/password.js';

const router = Router();

// Failed sign-ins per IP. Successful ones do not count against the limit.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Too many failed sign-in attempts. Please wait 15 minutes and try again.'
  }
});

const INVALID_CREDENTIALS = {
  status: 401,
  error: 'Unauthorized',
  message: 'Incorrect email or password.'
};

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({
        status: 400,
        error: 'Bad Request',
        message: 'Email and password are required.'
      });
    }
    // Bound the work a single request can cause in the password hash.
    if (email.length > 191 || password.length > 1024) {
      return res.status(401).json(INVALID_CREDENTIALS);
    }

    if (!getJwtSecret()) {
      return res.status(500).json({
        status: 500,
        error: 'Server Misconfigured',
        message: 'Sign-in is unavailable because JWT_SECRET is not configured on the server.'
      });
    }

    const account = await findUserByEmail(email);
    // Always run one hash comparison so unknown emails are not faster to reject.
    const passwordOk = await verifyPassword(password, account ? account.passwordHash : await getDummyHash());
    const role = account ? normalizeRole(account.role) : null;

    if (!account || !passwordOk || !account.isActive || !role) {
      return res.status(401).json(INVALID_CREDENTIALS);
    }

    await recordSuccessfulLogin(account, password);

    const user = { id: account.id, name: account.name, email: account.email, role };
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Signed in.',
      token,
      user
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticateToken, (req, res) => {
  const { id, name, email, role } = req.user;
  return res.status(200).json({ success: true, user: { id, name, email, role } });
});

export default router;
