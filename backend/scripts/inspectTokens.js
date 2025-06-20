/**
 * Inspect user tokens to debug the issue
 */

const { User } = require('../models');
const { logger } = require('../config/database');

async function inspectUserTokens() {
  try {
    console.log('🔍 Inspecting user tokens...');
    
    const users = await User.findAll({
      attributes: ['id', 'email', 'accessToken', 'refreshToken', 'tokenExpiry']
    });
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.email} (ID: ${user.id})`);
      console.log(`🔑 Access Token: ${user.accessToken ? user.accessToken.substring(0, 50) + '...' : 'NULL'}`);
      console.log(`🔄 Refresh Token: ${user.refreshToken ? user.refreshToken.substring(0, 50) + '...' : 'NULL'}`);
      console.log(`⏰ Token Expiry: ${user.tokenExpiry}`);
      
      // Check if tokens look like bcrypt hashes
      if (user.accessToken && user.accessToken.startsWith('$2')) {
        console.log('❌ Access token appears to be bcrypt hashed!');
      }
      if (user.refreshToken && user.refreshToken.startsWith('$2')) {
        console.log('❌ Refresh token appears to be bcrypt hashed!');
      }
      
      // Check if tokens look like valid OAuth tokens
      if (user.accessToken && !user.accessToken.startsWith('$2') && user.accessToken.length > 50) {
        console.log('✅ Access token appears to be in valid format');
      }
      if (user.refreshToken && !user.refreshToken.startsWith('$2') && user.refreshToken.length > 30) {
        console.log('✅ Refresh token appears to be in valid format');
      }
    }
    
  } catch (error) {
    console.error('💥 Inspection failed:', error.message);
  }
}

// Run inspection if script is executed directly
if (require.main === module) {
  inspectUserTokens()
    .then(() => {
      console.log('\n🎯 Token inspection completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Inspection failed:', error);
      process.exit(1);
    });
}

module.exports = { inspectUserTokens };
