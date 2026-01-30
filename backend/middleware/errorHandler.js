// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e) => e.message);
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  if (err.code === '23505') {
    // PostgreSQL unique violation
    statusCode = 400;
    message = 'Duplicate entry. This value already exists.';
  }

  if (err.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Invalid reference. The related record does not exist.';
  }

  if (err.code === '22P02') {
    // PostgreSQL invalid input syntax
    statusCode = 400;
    message = 'Invalid input format';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  // Handle multer errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large. Maximum size is 5MB.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files. Maximum is 5 files per upload.';
    } else {
      message = err.message;
    }
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Custom error class for API errors
class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'ApiError';
  }
}

// Not found error
class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

// Unauthorized error
class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized access') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

// Forbidden error
class ForbiddenError extends ApiError {
  constructor(message = 'Access forbidden') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

// Bad request error
class BadRequestError extends ApiError {
  constructor(message = 'Bad request', errors = null) {
    super(400, message, errors);
    this.name = 'BadRequestError';
  }
}

module.exports = errorHandler;
module.exports.ApiError = ApiError;
module.exports.NotFoundError = NotFoundError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
module.exports.BadRequestError = BadRequestError;
