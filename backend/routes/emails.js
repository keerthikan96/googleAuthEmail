const express = require('express');
const gmailService = require('../services/gmailService');
const { EmailMetadata } = require('../models');
const { asyncHandler, emailRateLimit } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateEmailQuery, 
  validateEmailId, 
  validateEmailUpdate,
  validateGmailSync,
  validateSearch,
  validatePagination
} = require('../middleware/validation');
const { logger } = require('../config/database');

const router = express.Router();

/**
 * @swagger
 * /api/emails:
 *   get:
 *     tags: [Emails]
 *     summary: Get user's emails with pagination and filtering
 *     description: Retrieves a paginated list of user's emails with optional filtering and search capabilities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of emails per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for email content
 *       - in: query
 *         name: sender
 *         schema:
 *           type: string
 *         description: Filter by sender email address
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Filter by subject line
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter emails from this date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter emails until this date
 *       - in: query
 *         name: isUnread
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: hasAttachment
 *         schema:
 *           type: boolean
 *         description: Filter emails with attachments
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [receivedDate, subject, sender]
 *           default: receivedDate
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Emails retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         emails:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Email'
 *       401:
 *         description: Authentication required
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
 * @route GET /emails
 * @desc Get user's emails with pagination and filtering
 * @access Private
 */
router.get('/', 
  authenticateToken,
  emailRateLimit,
  validateEmailQuery,
  asyncHandler(async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        sender = '',
        subject = '',
        dateFrom = '',
        dateTo = '',
        isUnread = null,
        hasAttachment = null,
        sort = 'receivedDate',
        order = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const { Op } = require('sequelize');

      // Build where conditions
      const whereConditions = {
        userId: req.userId
      };

      if (search) {
        whereConditions[Op.or] = [
          { subject: { [Op.like]: `%${search}%` } },
          { sender: { [Op.like]: `%${search}%` } },
          { senderName: { [Op.like]: `%${search}%` } },
          { snippet: { [Op.like]: `%${search}%` } }
        ];
      }

      if (sender) {
        whereConditions.sender = { [Op.like]: `%${sender}%` };
      }

      if (subject) {
        whereConditions.subject = { [Op.like]: `%${subject}%` };
      }

      if (dateFrom) {
        whereConditions.receivedDate = {
          ...(whereConditions.receivedDate || {}),
          [Op.gte]: new Date(dateFrom)
        };
      }

      if (dateTo) {
        whereConditions.receivedDate = {
          ...(whereConditions.receivedDate || {}),
          [Op.lte]: new Date(dateTo)
        };
      }

      if (isUnread !== null) {
        whereConditions.isRead = isUnread === 'true' ? false : true;
      }

      if (hasAttachment !== null) {
        whereConditions.hasAttachments = hasAttachment === 'true';
      }

      // Execute query
      const result = await EmailMetadata.findAndCountAll({
        where: whereConditions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort, order]],
        attributes: [
          'id', 'messageId', 'threadId', 'subject', 'sender', 'senderName',
          'snippet', 'receivedDate', 'isRead', 'isStarred', 'hasAttachments',
          'labels', 'priority', 'size', 'createdAt'
        ]
      });

      // Calculate pagination info
      const totalPages = Math.ceil(result.count / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        success: true,
        message: 'Emails retrieved successfully',
        data: {
          emails: result.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount: result.count,
            limit: parseInt(limit),
            hasNextPage,
            hasPrevPage
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching emails:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch emails',
        error: 'EMAIL_FETCH_FAILED'
      });
    }
  })
);

/**
 * @route GET /emails/:emailId
 * @desc Get specific email details
 * @access Private
 */
router.get('/:emailId', 
  authenticateToken,
  validateEmailId,
  asyncHandler(async (req, res) => {
    try {
      const email = await EmailMetadata.findOne({
        where: {
          id: req.params.emailId,
          userId: req.userId
        }
      });

      if (!email) {
        return res.status(404).json({
          success: false,
          message: 'Email not found',
          error: 'EMAIL_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Email retrieved successfully',
        data: {
          email
        }
      });
    } catch (error) {
      logger.error('Error fetching email details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email details',
        error: 'EMAIL_DETAILS_FETCH_FAILED'
      });
    }
  })
);

/**
 * @route PUT /emails/:emailId
 * @desc Update email status (read, starred)
 * @access Private
 */
router.put('/:emailId', 
  authenticateToken,
  validateEmailId,
  validateEmailUpdate,
  asyncHandler(async (req, res) => {
    try {
      const { isRead, isStarred } = req.body;
      
      const email = await EmailMetadata.findOne({
        where: {
          id: req.params.emailId,
          userId: req.userId
        }
      });

      if (!email) {
        return res.status(404).json({
          success: false,
          message: 'Email not found',
          error: 'EMAIL_NOT_FOUND'
        });
      }

      // Update email properties
      const updateData = {};
      if (typeof isRead === 'boolean') {
        updateData.isRead = isRead;
      }
      if (typeof isStarred === 'boolean') {
        updateData.isStarred = isStarred;
      }

      await email.update(updateData);

      res.json({
        success: true,
        message: 'Email updated successfully',
        data: {
          email
        }
      });
    } catch (error) {
      logger.error('Error updating email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update email',
        error: 'EMAIL_UPDATE_FAILED'
      });
    }
  })
);

/**
 * @route POST /emails/sync
 * @desc Sync emails from Gmail
 * @access Private
 */
router.post('/sync', 
  authenticateToken,
  emailRateLimit,
  validateGmailSync,
  asyncHandler(async (req, res) => {
    try {
      const {
        maxResults = 20,
        pageToken = null,
        query = ''
      } = req.body;

      const result = await gmailService.fetchEmails(req.user, {
        maxResults,
        pageToken,
        query
      });      res.json({
        success: true,
        message: 'Emails synced successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error syncing emails:', error);
      
      // Handle authentication errors specifically
      if (error.message.includes('re-authenticate') || 
          error.message.includes('authentication failed') ||
          error.message.includes('invalid_grant')) {
        return res.status(401).json({
          success: false,
          message: 'Gmail authentication expired. Please re-authenticate.',
          error: 'AUTHENTICATION_REQUIRED',
          requiresAuth: true
        });
      }
      
      // Handle API rate limiting
      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          success: false,
          message: 'Gmail API rate limit exceeded. Please try again later.',
          error: 'RATE_LIMIT_EXCEEDED'
        });
      }
      
      // Handle permission errors
      if (error.message.includes('forbidden') || error.message.includes('access forbidden')) {
        return res.status(403).json({
          success: false,
          message: 'Gmail API access forbidden. Check OAuth permissions.',
          error: 'ACCESS_FORBIDDEN'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to sync emails from Gmail',
        error: 'EMAIL_SYNC_FAILED',
        details: error.message
      });
    }
  })
);

/**
 * @route POST /emails/search
 * @desc Advanced email search
 * @access Private
 */
router.post('/search', 
  authenticateToken,
  emailRateLimit,
  validateSearch,
  asyncHandler(async (req, res) => {
    try {
      const {
        query,
        filters = {},
        pagination = { page: 1, limit: 20 }
      } = req.body;

      const searchOptions = {
        query,
        sender: filters.sender || '',
        subject: filters.subject || '',
        dateFrom: filters.dateFrom || '',
        dateTo: filters.dateTo || '',
        hasAttachment: filters.hasAttachment,
        isUnread: filters.isUnread,
        page: pagination.page || 1,
        limit: pagination.limit || 20
      };

      const result = await gmailService.searchEmails(req.user, searchOptions);

      // Calculate pagination info
      const totalPages = Math.ceil(result.count / searchOptions.limit);

      res.json({
        success: true,
        message: 'Email search completed successfully',
        data: {
          emails: result.rows,
          pagination: {
            currentPage: searchOptions.page,
            totalPages,
            totalCount: result.count,
            limit: searchOptions.limit,
            hasNextPage: searchOptions.page < totalPages,
            hasPrevPage: searchOptions.page > 1
          },
          searchQuery: query,
          filters
        }
      });
    } catch (error) {
      logger.error('Error searching emails:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search emails',
        error: 'EMAIL_SEARCH_FAILED'
      });
    }
  })
);

/**
 * @route GET /emails/stats
 * @desc Get email statistics for user
 * @access Private
 */
router.get('/stats/overview', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const stats = await gmailService.getEmailStats(req.user);

      res.json({
        success: true,
        message: 'Email statistics retrieved successfully',
        data: {
          stats
        }
      });
    } catch (error) {
      logger.error('Error fetching email stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email statistics',
        error: 'EMAIL_STATS_FETCH_FAILED'
      });
    }
  })
);

/**
 * @route PUT /emails/bulk
 * @desc Bulk update emails (mark as read, star, etc.)
 * @access Private
 */
router.put('/bulk', 
  authenticateToken,
  emailRateLimit,
  asyncHandler(async (req, res) => {
    try {
      const { emailIds, action, value } = req.body;

      if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Email IDs array is required',
          error: 'INVALID_EMAIL_IDS'
        });
      }

      if (!['isRead', 'isStarred'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be isRead or isStarred',
          error: 'INVALID_ACTION'
        });
      }

      if (typeof value !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Value must be a boolean',
          error: 'INVALID_VALUE'
        });
      }

      // Update emails
      const [updatedCount] = await EmailMetadata.update(
        { [action]: value },
        {
          where: {
            id: emailIds,
            userId: req.userId
          }
        }
      );

      res.json({
        success: true,
        message: `${updatedCount} emails updated successfully`,
        data: {
          updatedCount,
          action,
          value
        }
      });
    } catch (error) {
      logger.error('Error bulk updating emails:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk update emails',
        error: 'BULK_UPDATE_FAILED'
      });
    }
  })
);

module.exports = router;
