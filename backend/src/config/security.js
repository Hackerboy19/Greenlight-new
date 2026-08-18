/**
 * Security Middleware Configuration
 * Implements Helmet with strict CSP, CORS restricted to https://greenlight.fsia.in, and Rate Limiting
 */

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const ALLOWED_ORIGINS = [
  'https://greenlight.fsia.in',
  'https://ais-dev-gl3kbnl5eamfrw63gd3ubu-401466752044.asia-southeast1.run.app',
  'https://ais-pre-gl3kbnl5eamfrw63gd3ubu-401466752044.asia-southeast1.run.app',
  process.env.APP_URL,
  process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : null,
  'http://localhost:3000',
  'http://localhost:5173'
].flat().filter(Boolean);

/**
 * Configure Helmet with comprehensive Content Security Policy (CSP)
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Allowed for modern UI script hydration
        "'unsafe-eval'",
        "https://apis.google.com",
        "https://www.google-analytics.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "data:",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://images.unsplash.com",
        "https://greenlight.fsia.in",
        "https://lh3.googleusercontent.com",
        "https://avatars.githubusercontent.com"
      ],
      connectSrc: [
        "'self'",
        "https://greenlight.fsia.in",
        "https://www.googleapis.com",
        "https://apis.google.com",
        "https://generativelanguage.googleapis.com",
        "https://*"
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

/**
 * Configure Strict CORS Policy
 */
export const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. mobile apps, curl, or same-origin SSR)
    if (!origin) return callback(null, true);

    const isAllowed = ALLOWED_ORIGINS.some((allowed) => {
      if (allowed === origin) return true;
      if (typeof allowed === 'string' && allowed.includes('*')) {
        const pattern = new RegExp(`^${allowed.replace(/\*/g, '.*')}$`);
        return pattern.test(origin);
      }
      return false;
    });

    if (isAllowed || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key'
  ],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 86400 // 24 hours
});

/**
 * Standard Global API Rate Limiter
 * 150 requests per minute per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Too many requests created from this IP, please try again after 60 seconds.'
  }
});

/**
 * Stricter Rate Limiter for Authentication & Admin Actions
 * 10 requests per minute per IP
 */
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Exceeded authentication attempts rate limit. Please try again after 60 seconds.'
  }
});

export default {
  helmetMiddleware,
  corsMiddleware,
  apiLimiter,
  authLimiter
};
