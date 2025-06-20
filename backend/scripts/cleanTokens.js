/**
 * Clean up invalid/hashed tokens from the database
 * This script should be run after fixing the token hashing issue
 */

const { User } = require('../models');
const { logger } = require('../config/database');
require('dotenv').config();

async function cleanInvalidTokens() {
  try {
    logger.info('Starting token cleanup...');
    
    // Update all users to clear potentially hashed tokens
    // Since the issue affects all stored tokens, clear all tokens to force re-authentication
    const [affectedRows] = await User.update({
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null
    }, {
      where: {} // Empty where clause will update all records
    });

    logger.info(`Cleaned up tokens for ${affectedRows} users`);
    
    // Get count of users needing re-authentication
    const totalUsers = await User.count();

    logger.info(`${totalUsers} users will need to re-authenticate`);
    
    console.log('✅ Token cleanup completed successfully');
    console.log(`📊 ${affectedRows} user records updated`);
    console.log(`🔐 ${totalUsers} users need to re-authenticate`);
    
  } catch (error) {
    logger.error('Error during token cleanup:', error);
    console.error('❌ Token cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run cleanup if script is executed directly
if (require.main === module) {
  cleanInvalidTokens()
    .then(() => {
      console.log('🎉 Cleanup script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanInvalidTokens };
