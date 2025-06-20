/**
 * Clean up bcrypt hashed tokens specifically
 */

const { User } = require('../models');
const { logger } = require('../config/database');
const { Op } = require('sequelize');

async function cleanHashedTokens() {
  try {
    console.log('🧹 Cleaning up bcrypt hashed tokens...');
    
    // Update users with bcrypt hashed tokens (tokens starting with $2)
    const [affectedRows] = await User.update({
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null
    }, {
      where: {
        [Op.or]: [
          { accessToken: { [Op.like]: '$2%' } },
          { refreshToken: { [Op.like]: '$2%' } }
        ]
      }
    });

    console.log(`✅ Cleaned up ${affectedRows} users with hashed tokens`);
    
    // Get all users that still need authentication
    const usersNeedingAuth = await User.count({
      where: {
        [Op.or]: [
          { accessToken: null },
          { refreshToken: null }
        ]
      }
    });

    console.log(`🔐 ${usersNeedingAuth} users need to re-authenticate`);
    
    // Double-check by listing all users
    const allUsers = await User.findAll({
      attributes: ['id', 'email', 'accessToken', 'refreshToken']
    });
    
    console.log('\n📊 Current user status:');
    allUsers.forEach(user => {
      const hasValidTokens = user.accessToken && user.refreshToken && 
                            !user.accessToken.startsWith('$2') && 
                            !user.refreshToken.startsWith('$2');
      console.log(`  ${user.email}: ${hasValidTokens ? '✅ Has valid tokens' : '❌ Needs re-auth'}`);
    });
    
  } catch (error) {
    logger.error('Error during token cleanup:', error);
    console.error('❌ Token cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run cleanup if script is executed directly
if (require.main === module) {
  cleanHashedTokens()
    .then(() => {
      console.log('\n🎉 Hashed token cleanup completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanHashedTokens };
