const { google } = require('googleapis');
const imaps = require('imap-simple');
const { EmailMetadata } = require('../models');
const { logger } = require('../config/database');
const authService = require('./authService');

class GmailService {
  constructor() {
    this.gmail = null;
    this.oauth2Client = null;
  }
  /**
   * Initialize Gmail API client with user credentials
   * @param {Object} user - User record with tokens
   */
  async initializeClient(user) {
    try {
      // Validate required environment variables
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
        throw new Error('Missing Google OAuth configuration in environment variables');
      }

      // Validate user tokens
      if (!user.accessToken && !user.refreshToken) {
        throw new Error('User has no valid OAuth tokens. Re-authentication required.');
      }

      // Check if token is expired and refresh if needed
      if (user.isTokenExpired()) {
        logger.info(`Token expired for user ${user.email}, attempting refresh...`);
        
        if (!user.refreshToken) {
          throw new Error('Refresh token not available. User needs to re-authenticate.');
        }

        try {
          await authService.refreshAccessToken(user);
          // Reload user to get updated token
          await user.reload();
          logger.info(`Token refreshed successfully for user ${user.email}`);
        } catch (refreshError) {
          logger.error(`Failed to refresh token for user ${user.email}:`, refreshError);
          
          // Handle specific OAuth errors
          if (refreshError.message.includes('invalid_grant')) {
            throw new Error('Refresh token is invalid or expired. User needs to re-authenticate.');
          }
          throw new Error('Failed to refresh access token. Please re-authenticate.');
        }
      }

      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      this.oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken
      });

      this.gmail = google.gmail({
        version: 'v1',
        auth: this.oauth2Client
      });

      logger.info(`Gmail client initialized for user: ${user.email}`);
    } catch (error) {
      logger.error('Error initializing Gmail client:', error);
      
      // Re-throw with more specific error message
      if (error.message.includes('re-authenticate')) {
        throw error; // Pass through authentication errors as-is
      }
      throw new Error(`Failed to initialize Gmail connection: ${error.message}`);
    }
  }
  /**
   * Fetch emails from Gmail API with pagination
   * @param {Object} user - User record
   * @param {Object} options - Fetch options
   * @returns {Object} Emails data with pagination info
   */
  async fetchEmails(user, options = {}) {
    try {
      await this.initializeClient(user);

      const {
        maxResults = 20,
        pageToken = null,
        query = '',
        labelIds = ['INBOX']
      } = options;

      // Build Gmail API query
      let searchQuery = query;
      if (labelIds.includes('INBOX')) {
        searchQuery = searchQuery ? `in:inbox ${searchQuery}` : 'in:inbox';
      }

      // Fetch message list with proper error handling
      let listResponse;
      try {
        listResponse = await this.gmail.users.messages.list({
          userId: 'me',
          maxResults,
          pageToken,
          q: searchQuery,
          labelIds
        });
      } catch (apiError) {
        logger.error('Gmail API error while listing messages:', apiError);
        
        // Handle specific API errors
        if (apiError.code === 401) {
          throw new Error('Gmail API authentication failed. User needs to re-authenticate.');
        } else if (apiError.code === 403) {
          throw new Error('Gmail API access forbidden. Check OAuth scopes and permissions.');
        } else if (apiError.code === 429) {
          throw new Error('Gmail API rate limit exceeded. Please try again later.');
        }
        
        throw new Error(`Gmail API error: ${apiError.message || 'Unknown error'}`);
      }

      if (!listResponse.data.messages) {
        return {
          emails: [],
          nextPageToken: null,
          totalCount: 0
        };
      }

      // Fetch detailed message data in batches for performance
      const emailPromises = listResponse.data.messages.map(async (message) => {
        try {
          const messageResponse = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata',
            metadataHeaders: ['Date', 'From', 'Subject', 'To', 'Message-ID']
          });

          return this.parseEmailMessage(messageResponse.data, user.id);
        } catch (error) {
          logger.error(`Error fetching message ${message.id}:`, error);
          return null;
        }
      });

      const emailResults = await Promise.all(emailPromises);
      const emails = emailResults.filter(email => email !== null);

      // Store/update emails in database
      await this.storeEmails(emails);

      // Get stored emails with additional metadata
      const storedEmails = await EmailMetadata.findByUser(user.id, {
        limit: maxResults,
        where: {
          gmailMessageId: emails.map(email => email.gmailMessageId)
        }
      });

      return {
        emails: storedEmails.rows,
        nextPageToken: listResponse.data.nextPageToken || null,
        totalCount: storedEmails.count
      };
    } catch (error) {
      logger.error('Error fetching emails:', error);
      
      // Provide more specific error messages
      if (error.message.includes('re-authenticate') || error.message.includes('authentication failed')) {
        throw error; // Pass through authentication errors
      }
      
      throw new Error(`Failed to fetch emails from Gmail: ${error.message}`);
    }
  }

  /**
   * Parse Gmail message data
   * @param {Object} messageData - Raw Gmail message data
   * @param {number} userId - User ID
   * @returns {Object} Parsed email data
   */
  parseEmailMessage(messageData, userId) {
    try {
      const headers = messageData.payload.headers;
      const getHeader = (name) => {
        const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : '';
      };

      // Parse sender information
      const fromHeader = getHeader('From');
      const senderMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$|^(.+)$/);
      const senderName = senderMatch ? (senderMatch[1] || '').trim() : '';
      const senderEmail = senderMatch ? (senderMatch[2] || senderMatch[3] || '').trim() : fromHeader;

      // Parse date
      const dateStr = getHeader('Date');
      const receivedDate = dateStr ? new Date(dateStr) : new Date();

      // Get email body snippet
      const snippet = messageData.snippet || '';

      // Check for attachments
      const hasAttachments = this.checkForAttachments(messageData.payload);

      // Parse labels and determine priority
      const labels = messageData.labelIds || [];
      const priority = this.determinePriority(labels, headers);

      return {
        userId,
        messageId: getHeader('Message-ID') || messageData.id,
        threadId: messageData.threadId,
        subject: getHeader('Subject') || '(No Subject)',
        sender: senderEmail,
        senderName,
        recipient: getHeader('To'),
        snippet,
        bodyPreview: snippet.substring(0, 200),
        receivedDate,
        isRead: !labels.includes('UNREAD'),
        isStarred: labels.includes('STARRED'),
        hasAttachments,
        labels,
        priority,
        size: messageData.sizeEstimate || 0,
        gmailMessageId: messageData.id
      };
    } catch (error) {
      logger.error('Error parsing email message:', error);
      throw new Error('Failed to parse email message');
    }
  }

  /**
   * Check if email has attachments
   * @param {Object} payload - Email payload
   * @returns {boolean} Has attachments
   */
  checkForAttachments(payload) {
    try {
      if (payload.parts) {
        return payload.parts.some(part => 
          part.filename && part.filename.length > 0 ||
          part.body.attachmentId
        );
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Determine email priority based on labels and headers
   * @param {Array} labels - Gmail labels
   * @param {Array} headers - Email headers
   * @returns {string} Priority level
   */
  determinePriority(labels, headers) {
    try {
      // Check for high priority indicators
      if (labels.includes('IMPORTANT') || labels.includes('CATEGORY_PROMOTIONS')) {
        return 'high';
      }

      // Check X-Priority header
      const priorityHeader = headers.find(h => 
        h.name.toLowerCase() === 'x-priority' || 
        h.name.toLowerCase() === 'priority'
      );

      if (priorityHeader) {
        const priority = priorityHeader.value.toLowerCase();
        if (priority.includes('high') || priority === '1') return 'high';
        if (priority.includes('low') || priority === '5') return 'low';
      }

      return 'medium';
    } catch (error) {
      return 'medium';
    }
  }

  /**
   * Store emails in database
   * @param {Array} emails - Array of email objects
   */
  async storeEmails(emails) {
    try {
      const operations = emails.map(async (emailData) => {
        try {
          await EmailMetadata.findOrCreate({
            where: {
              userId: emailData.userId,
              messageId: emailData.messageId
            },
            defaults: emailData
          });
        } catch (error) {
          logger.error(`Error storing email ${emailData.messageId}:`, error);
        }
      });

      await Promise.all(operations);
      logger.info(`Stored ${emails.length} emails in database`);
    } catch (error) {
      logger.error('Error storing emails:', error);
      // Don't throw error as this shouldn't break the flow
    }
  }

  /**
   * Search emails with various criteria
   * @param {Object} user - User record
   * @param {Object} searchOptions - Search parameters
   * @returns {Object} Search results
   */
  async searchEmails(user, searchOptions = {}) {
    try {
      const {
        query = '',
        sender = '',
        subject = '',
        dateFrom = '',
        dateTo = '',
        hasAttachment = null,
        isUnread = null,
        page = 1,
        limit = 20
      } = searchOptions;

      // Build Gmail search query
      let gmailQuery = [];
      
      if (query) gmailQuery.push(query);
      if (sender) gmailQuery.push(`from:${sender}`);
      if (subject) gmailQuery.push(`subject:${subject}`);
      if (dateFrom) gmailQuery.push(`after:${dateFrom}`);
      if (dateTo) gmailQuery.push(`before:${dateTo}`);
      if (hasAttachment === true) gmailQuery.push('has:attachment');
      if (isUnread === true) gmailQuery.push('is:unread');

      const searchQuery = gmailQuery.join(' ');
      
      // Calculate pagination
      const offset = (page - 1) * limit;

      // First try to search in local database
      const localResults = await EmailMetadata.searchEmails(user.id, query, {
        limit,
        offset
      });

      // If we don't have enough results, fetch from Gmail
      if (localResults.count < limit && searchQuery) {
        await this.fetchEmails(user, {
          query: searchQuery,
          maxResults: limit
        });

        // Search again in updated database
        return await EmailMetadata.searchEmails(user.id, query, {
          limit,
          offset
        });
      }

      return localResults;
    } catch (error) {
      logger.error('Error searching emails:', error);
      throw new Error('Failed to search emails');
    }
  }

  /**
   * Get email statistics for user
   * @param {Object} user - User record
   * @returns {Object} Email statistics
   */
  async getEmailStats(user) {
    try {
      const { Op } = require('sequelize');
      
      const totalCount = await EmailMetadata.count({
        where: { userId: user.id }
      });

      const unreadCount = await EmailMetadata.getUnreadCount(user.id);

      const starredCount = await EmailMetadata.count({
        where: {
          userId: user.id,
          isStarred: true
        }
      });

      const todayCount = await EmailMetadata.count({
        where: {
          userId: user.id,
          receivedDate: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      return {
        total: totalCount,
        unread: unreadCount,
        starred: starredCount,
        today: todayCount
      };
    } catch (error) {
      logger.error('Error getting email stats:', error);
      throw new Error('Failed to get email statistics');
    }
  }
}

module.exports = new GmailService();
