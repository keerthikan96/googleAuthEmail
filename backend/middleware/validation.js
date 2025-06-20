const { body, param, query, validationResult } = require('express-validator');
const { validationErrorHandler } = require('./errorHandler');

/**
 * Middleware to handle validation results
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: validationErrorHandler(errors.array())
    });
  }
  
  next();
};

/**
 * Email query validation
 */
const validateEmailQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search term must be between 1 and 200 characters')
    .trim()
    .escape(),
  
  query('sender')
    .optional()
    .isEmail()
    .withMessage('Sender must be a valid email address')
    .normalizeEmail(),
  
  query('subject')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters')
    .trim()
    .escape(),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO 8601 date'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO 8601 date'),
  
  query('isUnread')
    .optional()
    .isBoolean()
    .withMessage('isUnread must be a boolean'),
  
  query('hasAttachment')
    .optional()
    .isBoolean()
    .withMessage('hasAttachment must be a boolean'),
  
  handleValidationErrors
];

/**
 * Email ID parameter validation
 */
const validateEmailId = [
  param('emailId')
    .isInt({ min: 1 })
    .withMessage('Email ID must be a positive integer'),
  
  handleValidationErrors
];

/**
 * User ID parameter validation
 */
const validateUserId = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  handleValidationErrors
];

/**
 * Email update validation
 */
const validateEmailUpdate = [
  body('isRead')
    .optional()
    .isBoolean()
    .withMessage('isRead must be a boolean'),
  
  body('isStarred')
    .optional()
    .isBoolean()
    .withMessage('isStarred must be a boolean'),
  
  handleValidationErrors
];

/**
 * Gmail sync validation
 */
const validateGmailSync = [
  body('maxResults')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('maxResults must be between 1 and 100'),
  
  body('pageToken')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('pageToken must be between 1 and 500 characters')
    .trim(),
  
  body('query')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Query must be between 1 and 500 characters')
    .trim()
    .escape(),
  
  handleValidationErrors
];

/**
 * Search validation
 */
const validateSearch = [
  body('query')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters')
    .trim()
    .escape(),
  
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object'),
  
  body('filters.sender')
    .optional()
    .isEmail()
    .withMessage('Sender filter must be a valid email address')
    .normalizeEmail(),
  
  body('filters.dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from filter must be a valid ISO 8601 date'),
  
  body('filters.dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to filter must be a valid ISO 8601 date'),
  
  body('pagination')
    .optional()
    .isObject()
    .withMessage('Pagination must be an object'),
  
  body('pagination.page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  body('pagination.limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

/**
 * OAuth callback validation
 */
const validateOAuthCallback = [
  query('code')
    .notEmpty()
    .withMessage('Authorization code is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Authorization code is invalid'),
  
  query('state')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('State parameter is invalid'),
  
  handleValidationErrors
];

/**
 * Generic pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('sort')
    .optional()
    .isIn(['date', 'sender', 'subject', 'size'])
    .withMessage('Sort must be one of: date, sender, subject, size'),
  
  query('order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Order must be ASC or DESC')
    .toUpperCase(),
  
  handleValidationErrors
];

/**
 * Common input sanitization
 */
const sanitizeInput = [
  body('*').trim(),
  query('*').trim()
];

/**
 * File upload validation (for future use)
 */
const validateFileUpload = [
  body('filename')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Filename must be between 1 and 255 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Filename contains invalid characters'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateEmailQuery,
  validateEmailId,
  validateUserId,
  validateEmailUpdate,
  validateGmailSync,
  validateSearch,
  validateOAuthCallback,
  validatePagination,
  sanitizeInput,
  validateFileUpload
};
