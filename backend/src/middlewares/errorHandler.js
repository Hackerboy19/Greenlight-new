/**
 * Global Express Error Handling Middleware
 * Catch-all centralized handler for operational and server errors
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Route Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Resource endpoint not found: ${req.method} ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Central Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message || 'Internal Server Error';
  error.statusCode = err.statusCode || 500;

  // Handle MySQL connection & constraint errors
  if (err.code === 'ER_DUP_ENTRY') {
    error.statusCode = 409;
    error.message = 'Duplicate entry conflict: A record with this unique value already exists.';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error.statusCode = 400;
    error.message = 'Foreign key constraint failed: Referenced entity does not exist.';
  } else if (err.code === 'ECONNREFUSED') {
    error.statusCode = 503;
    error.message = 'Database service temporarily unavailable.';
  }

  // Handle Validation errors (e.g., from Joi, Zod, or custom)
  if (err.name === 'ValidationError') {
    error.statusCode = 400;
    error.message = err.message;
  }

  // Log non-operational errors in non-test environments
  if (error.statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error('[Unhandled Server Error]', {
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
      errorName: err.name,
      errorMessage: err.message,
      stack: err.stack
    });
  }

  return res.status(error.statusCode).json({
    status: error.statusCode,
    success: false,
    error: error.statusCode >= 500 ? 'Server Error' : 'Request Error',
    message: error.message,
    details: error.details || undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default {
  AppError,
  notFoundHandler,
  errorHandler
};
