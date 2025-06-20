const express = require('express');
const authService = require('../services/authService');
const { User } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { authRateLimit } = require('../middleware/errorHandler');
const { validateOAuthCallback } = require('../middleware/validation');
const { authenticateToken, logAuthEvents } = require('../middleware/auth');
const { logger } = require('../config/database');

const router = express.Router();

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     tags: [Authentication]
 *     summary: Get Google OAuth2 authorization URL
 *     description: Returns the Google OAuth2 authorization URL for user authentication
 *     responses:
 *       200:
 *         description: Authorization URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         authUrl:
 *                           type: string
 *                           format: uri
 *                           description: Google OAuth2 authorization URL
 *                           example: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=...'
 *       500:
 *         description: Failed to generate authorization URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @route GET /auth/google
 * @desc Get Google OAuth2 authorization URL
 * @access Public
 */
router.get('/google', authRateLimit, asyncHandler(async (req, res) => {
  try {
    const authUrl = authService.getAuthUrl();
    
    res.json({
      success: true,
      message: 'Authorization URL generated successfully',
      data: {
        authUrl
      }
    });
  } catch (error) {
    logger.error('Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate authorization URL',
      error: 'AUTH_URL_GENERATION_FAILED'
    });
  }
}));

/**
 * @swagger
 * /api/auth/callback:
 *   get:
 *     tags: [Authentication]
 *     summary: Handle Google OAuth2 callback
 *     description: Processes the OAuth2 callback from Google and returns JWT token
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Google OAuth2
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for CSRF protection
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                           description: JWT authentication token
 *                           example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         redirectUrl:
 *                           type: string
 *                           format: uri
 *                           description: Frontend redirect URL
 *                           example: 'http://localhost:3000/dashboard'
 *       400:
 *         description: Missing or invalid authorization code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: OAuth2 authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @route GET /auth/callback
 * @desc Handle Google OAuth2 callback
 * @access Public
 */
router.get('/callback', 
  authRateLimit, 
  validateOAuthCallback,
  logAuthEvents('LOGIN'),
  asyncHandler(async (req, res) => {
    try {
      const { code, error } = req.query;
      
      // Handle OAuth error
      if (error) {
        logger.warn('OAuth error received:', error);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error&message=${encodeURIComponent(error)}`);
      }

      // Exchange code for tokens
      const tokens = await authService.getTokens(code);
      
      // Get user information from Google
      const userInfo = await authService.getUserInfo(tokens.access_token);
      
      // Verify email is verified
      if (!userInfo.verified_email) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=email_not_verified`);
      }

      // Create or update user in database
      const user = await authService.createOrUpdateUser(userInfo, tokens);
      
      // Generate JWT token
      const jwtToken = authService.generateJWT(user);
      
      logger.info(`User authentication successful: ${user.email}`);
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${jwtToken}`);
      
    } catch (error) {
      logger.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed&message=${encodeURIComponent('Authentication failed')}`);
    }
  })
);

/**
 * @route POST /auth/refresh
 * @desc Refresh access token
 * @access Private
 */
router.post('/refresh', 
  authenticateToken,
  logAuthEvents('TOKEN_REFRESH'),
  asyncHandler(async (req, res) => {
    try {
      // Token refresh is handled in authenticateToken middleware
      // If we reach here, token was successfully refreshed
      
      const newJwtToken = authService.generateJWT(req.user);
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newJwtToken,
          user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            picture: req.user.picture
          }
        }
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Failed to refresh token',
        error: 'TOKEN_REFRESH_FAILED'
      });
    }
  })
);

/**
 * @route GET /auth/me
 * @desc Get current user information
 * @access Private
 */
router.get('/me', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const user = await User.findByPk(req.userId, {
        attributes: ['id', 'email', 'name', 'picture', 'lastLoginAt', 'createdAt']
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }
      
      res.json({
        success: true,
        message: 'User information retrieved successfully',
        data: {
          user
        }
      });
    } catch (error) {
      logger.error('Error fetching user info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user information',
        error: 'USER_FETCH_FAILED'
      });
    }
  })
);

/**
 * @route POST /auth/logout
 * @desc Logout user (revoke tokens)
 * @access Private
 */
router.post('/logout', 
  authenticateToken,
  logAuthEvents('LOGOUT'),
  asyncHandler(async (req, res) => {
    try {
      // Revoke Google tokens
      await authService.revokeTokens(req.user);
      
      logger.info(`User logged out: ${req.user.email}`);
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      // Don't fail logout even if token revocation fails
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    }
  })
);

/**
 * @route DELETE /auth/account
 * @desc Delete user account
 * @access Private
 */
router.delete('/account', 
  authenticateToken,
  logAuthEvents('ACCOUNT_DELETION'),
  asyncHandler(async (req, res) => {
    try {
      // Revoke Google tokens
      await authService.revokeTokens(req.user);
      
      // Soft delete user (set inactive)
      await req.user.update({ isActive: false });
      
      logger.info(`User account deleted: ${req.user.email}`);
      
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      logger.error('Account deletion error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete account',
        error: 'ACCOUNT_DELETION_FAILED'
      });
    }
  })
);

/**
 * @route GET /auth/status
 * @desc Check authentication status
 * @access Public
 */
router.get('/status', asyncHandler(async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.json({
        success: true,
        data: {
          authenticated: false
        }
      });
    }
    
    try {
      const decoded = authService.verifyJWT(token);
      const user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'email', 'name', 'isActive']
      });
      
      if (!user || !user.isActive) {
        return res.json({
          success: true,
          data: {
            authenticated: false
          }
        });
      }
      
      res.json({
        success: true,
        data: {
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        }
      });
    } catch (error) {
      res.json({
        success: true,
        data: {
          authenticated: false
        }
      });
    }
  } catch (error) {
    logger.error('Auth status check error:', error);
    res.json({
      success: true,
      data: {
        authenticated: false
      }
    });
  }
}));

module.exports = router;
