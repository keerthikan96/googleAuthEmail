const authService = require('../services/authService');
const { User } = require('../models');
const { logger } = require('../config/database');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'MISSING_TOKEN'
      });
    }

    // Verify JWT token
    const decoded = authService.verifyJWT(token);
    
    // Fetch user from database
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user',
        error: 'INVALID_USER'
      });
    }

    // Check if Google tokens are still valid
    if (user.isTokenExpired()) {
      logger.info(`Token expired for user ${user.email}, attempting refresh`);
      try {
        await authService.refreshAccessToken(user);
        await user.reload();
      } catch (error) {
        logger.error('Failed to refresh token:', error);
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please login again.',
          error: 'TOKEN_REFRESH_FAILED'
        });
      }
    }

    // Add user to request object
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token expired',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication service error',
      error: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Middleware to check if user is authenticated (optional)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = authService.verifyJWT(token);
      const user = await User.findByPk(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user.id;
      }
    }
    
    next();
  } catch (error) {
    // Don't block request for optional auth
    logger.warn('Optional authentication failed:', error);
    next();
  }
};

/**
 * Middleware to validate user ownership of resources
 */
const validateUserOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    try {
      const resourceUserId = req.params[resourceUserIdField] || 
                           req.body[resourceUserIdField] || 
                           req.query[resourceUserIdField];

      if (resourceUserId && parseInt(resourceUserId) !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.',
          error: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    } catch (error) {
      logger.error('Ownership validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error validating resource ownership',
        error: 'OWNERSHIP_VALIDATION_ERROR'
      });
    }
  };
};

/**
 * Middleware to check admin permissions (future use)
 */
const requireAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
        error: 'ADMIN_REQUIRED'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking admin permissions',
      error: 'ADMIN_CHECK_ERROR'
    });
  }
};

/**
 * Middleware to log authentication events
 */
const logAuthEvents = (eventType) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        
        if (parsedData.success) {
          logger.info(`Auth event: ${eventType}`, {
            userId: req.userId,
            userEmail: req.user?.email,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          });
        } else {
          logger.warn(`Auth event failed: ${eventType}`, {
            error: parsedData.error,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        // Don't break the response if logging fails
        logger.error('Error logging auth event:', error);
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  validateUserOwnership,
  requireAdmin,
  logAuthEvents
};
