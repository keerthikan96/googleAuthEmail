const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { logger } = require('../config/database');
require('dotenv').config();

class AuthService {
  constructor() {
    // Initialize OAuth2 client with error handling
    try {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
    } catch (error) {
      logger.error('Failed to initialize OAuth2 client:', error);
      throw new Error('OAuth2 configuration error');
    }
  }

  /**
   * Generate OAuth2 authorization URL
   * @returns {string} Authorization URL
   */
  getAuthUrl() {
    try {
      const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/gmail.readonly'
      ];

      return this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent', // Force consent to get refresh token
        include_granted_scopes: true
      });
    } catch (error) {
      logger.error('Error generating auth URL:', error);
      throw new Error('Failed to generate authorization URL');
    }
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from Google
   * @returns {Object} Token information
   */
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      logger.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Get user information from Google using access token
   * @param {string} accessToken - Google access token
   * @returns {Object} User profile information
   */
  async getUserInfo(accessToken) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      
      const oauth2 = google.oauth2({
        auth: this.oauth2Client,
        version: 'v2'
      });

      const { data } = await oauth2.userinfo.get();
      
      return {
        googleId: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
        verified_email: data.verified_email
      };
    } catch (error) {
      logger.error('Error fetching user info:', error);
      throw new Error('Failed to fetch user information from Google');
    }
  }

  /**
   * Create or update user in database
   * @param {Object} userInfo - User information from Google
   * @param {Object} tokens - OAuth2 tokens
   * @returns {Object} User record
   */
  async createOrUpdateUser(userInfo, tokens) {
    try {
      const tokenExpiry = new Date();
      tokenExpiry.setSeconds(tokenExpiry.getSeconds() + (tokens.expiry_date ? 
        Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600));

      const [user, created] = await User.findOrCreate({
        where: { googleId: userInfo.googleId },
        defaults: {
          googleId: userInfo.googleId,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokenExpiry,
          lastLoginAt: new Date()
        }
      });

      // Update existing user
      if (!created) {
        await user.update({
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || user.refreshToken,
          tokenExpiry: tokenExpiry,
          lastLoginAt: new Date()
        });
      }

      logger.info(`User ${created ? 'created' : 'updated'}: ${userInfo.email}`);
      return user;
    } catch (error) {
      logger.error('Error creating/updating user:', error);
      throw new Error('Failed to create or update user');
    }
  }

  /**
   * Generate JWT token for user
   * @param {Object} user - User record
   * @returns {string} JWT token
   */
  generateJWT(user) {
    try {
      const payload = {
        userId: user.id,
        email: user.email,
        googleId: user.googleId
      };

      return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '24h',
        issuer: 'gmail-viewer-app',
        audience: 'gmail-viewer-users'
      });
    } catch (error) {
      logger.error('Error generating JWT:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyJWT(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'gmail-viewer-app',
        audience: 'gmail-viewer-users'
      });
    } catch (error) {
      logger.error('Error verifying JWT:', error);
      throw new Error('Invalid or expired authentication token');
    }
  }
  /**
   * Refresh Google access token
   * @param {Object} user - User record
   * @returns {string} New access token
   */
  async refreshAccessToken(user) {
    try {
      if (!user.refreshToken) {
        throw new Error('No refresh token available for user. Re-authentication required.');
      }

      this.oauth2Client.setCredentials({
        refresh_token: user.refreshToken
      });

      let credentials;
      try {
        const response = await this.oauth2Client.refreshAccessToken();
        credentials = response.credentials;
      } catch (refreshError) {
        logger.error(`OAuth refresh error for user ${user.email}:`, refreshError);
        
        // Handle specific OAuth errors
        if (refreshError.message.includes('invalid_grant')) {
          // Clear invalid tokens from database
          await user.update({
            accessToken: null,
            refreshToken: null,
            tokenExpiry: null
          });
          throw new Error('invalid_grant: Refresh token is invalid, expired, or revoked. User must re-authenticate.');
        }
        
        throw refreshError;
      }
      
      // Update user with new token
      const tokenExpiry = new Date();
      tokenExpiry.setSeconds(tokenExpiry.getSeconds() + (credentials.expiry_date ? 
        Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600));

      await user.update({
        accessToken: credentials.access_token,
        tokenExpiry: tokenExpiry
      });

      logger.info(`Access token refreshed for user: ${user.email}`);
      return credentials.access_token;
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      
      // Re-throw specific authentication errors
      if (error.message.includes('invalid_grant') || error.message.includes('Re-authentication required')) {
        throw error;
      }
      
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Revoke user tokens
   * @param {Object} user - User record
   */
  async revokeTokens(user) {
    try {
      if (user.accessToken) {
        this.oauth2Client.setCredentials({
          access_token: user.accessToken
        });

        await this.oauth2Client.revokeCredentials();
      }

      // Clear tokens from database
      await user.update({
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null
      });

      logger.info(`Tokens revoked for user: ${user.email}`);
    } catch (error) {
      logger.error('Error revoking tokens:', error);
      // Don't throw error as this is cleanup operation
    }
  }
}

module.exports = new AuthService();
