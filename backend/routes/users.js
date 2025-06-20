const express = require('express');
const { User } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const { validateUserId, validatePagination } = require('../middleware/validation');
const { logger } = require('../config/database');

const router = express.Router();

/**
 * @route GET /users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const user = await User.findByPk(req.userId, {
        attributes: [
          'id', 'email', 'name', 'picture', 'lastLoginAt', 
          'createdAt', 'updatedAt'
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found',
          error: 'USER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          user
        }
      });
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile',
        error: 'PROFILE_FETCH_FAILED'
      });
    }
  })
);

/**
 * @route PUT /users/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { name } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Name is required and cannot be empty',
          error: 'INVALID_NAME'
        });
      }

      const user = await User.findByPk(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }

      await user.update({
        name: name.trim()
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture
          }
        }
      });
    } catch (error) {
      logger.error('Error updating user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: 'PROFILE_UPDATE_FAILED'
      });
    }
  })
);

/**
 * @route GET /users/activity
 * @desc Get user activity summary
 * @access Private
 */
router.get('/activity', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { EmailMetadata } = require('../models');
      const { Op } = require('sequelize');

      // Get various activity metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 7);

      const thisMonth = new Date();
      thisMonth.setDate(1);

      const [
        todayEmails,
        weekEmails,
        monthEmails,
        totalEmails,
        unreadEmails,
        starredEmails
      ] = await Promise.all([
        EmailMetadata.count({
          where: {
            userId: req.userId,
            receivedDate: { [Op.gte]: today }
          }
        }),
        EmailMetadata.count({
          where: {
            userId: req.userId,
            receivedDate: { [Op.gte]: thisWeek }
          }
        }),
        EmailMetadata.count({
          where: {
            userId: req.userId,
            receivedDate: { [Op.gte]: thisMonth }
          }
        }),
        EmailMetadata.count({
          where: { userId: req.userId }
        }),
        EmailMetadata.count({
          where: {
            userId: req.userId,
            isRead: false
          }
        }),
        EmailMetadata.count({
          where: {
            userId: req.userId,
            isStarred: true
          }
        })
      ]);

      // Get user info
      const user = await User.findByPk(req.userId, {
        attributes: ['lastLoginAt', 'createdAt']
      });

      res.json({
        success: true,
        message: 'User activity retrieved successfully',
        data: {
          activity: {
            emailCounts: {
              today: todayEmails,
              thisWeek: weekEmails,
              thisMonth: monthEmails,
              total: totalEmails,
              unread: unreadEmails,
              starred: starredEmails
            },
            accountInfo: {
              lastLogin: user.lastLoginAt,
              memberSince: user.createdAt
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching user activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user activity',
        error: 'ACTIVITY_FETCH_FAILED'
      });
    }
  })
);

/**
 * @route GET /users/preferences
 * @desc Get user preferences (placeholder for future use)
 * @access Private
 */
router.get('/preferences', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      // Placeholder for user preferences
      // In a real app, you'd have a UserPreferences model
      const defaultPreferences = {
        emailsPerPage: 20,
        theme: 'light',
        notifications: {
          email: true,
          browser: false
        },
        privacy: {
          showOnlineStatus: false,
          allowDataCollection: false
        }
      };

      res.json({
        success: true,
        message: 'User preferences retrieved successfully',
        data: {
          preferences: defaultPreferences
        }
      });
    } catch (error) {
      logger.error('Error fetching user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user preferences',
        error: 'PREFERENCES_FETCH_FAILED'
      });
    }
  })
);

/**
 * @route PUT /users/preferences
 * @desc Update user preferences (placeholder for future use)
 * @access Private
 */
router.put('/preferences', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { preferences } = req.body;

      // Validate preferences structure
      if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Valid preferences object is required',
          error: 'INVALID_PREFERENCES'
        });
      }

      // In a real app, you'd save to UserPreferences model
      // For now, just return the received preferences
      
      res.json({
        success: true,
        message: 'User preferences updated successfully',
        data: {
          preferences
        }
      });
    } catch (error) {
      logger.error('Error updating user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user preferences',
        error: 'PREFERENCES_UPDATE_FAILED'
      });
    }
  })
);

module.exports = router;
