/**
 * Test script to verify Gmail API error handling
 */

const { User } = require('../models');
const gmailService = require('../services/gmailService');
const { logger } = require('../config/database');

async function testGmailSync() {
  try {
    console.log('🧪 Testing Gmail sync functionality...');
    
    // Get a user from the database
    const user = await User.findOne();
    
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`📧 Testing with user: ${user.email}`);
    console.log(`🔑 Access token: ${user.accessToken ? 'Present' : 'Missing'}`);
    console.log(`🔄 Refresh token: ${user.refreshToken ? 'Present' : 'Missing'}`);
    console.log(`⏰ Token expiry: ${user.tokenExpiry || 'Not set'}`);
    
    // Test Gmail sync
    try {
      const result = await gmailService.fetchEmails(user, {
        maxResults: 5
      });
      
      console.log('✅ Gmail sync successful!');
      console.log(`📨 Fetched ${result.emails.length} emails`);
      
    } catch (error) {
      console.log('❌ Gmail sync failed (expected behavior):');
      console.log(`🔍 Error type: ${error.constructor.name}`);
      console.log(`💬 Error message: ${error.message}`);
      
      // Check if error message is user-friendly
      if (error.message.includes('re-authenticate') || 
          error.message.includes('authentication') ||
          error.message.includes('invalid_grant')) {
        console.log('✅ Error message correctly indicates authentication issue');
      } else {
        console.log('⚠️  Error message could be more specific');
      }
    }
    
  } catch (error) {
    console.error('💥 Test script failed:', error.message);
  }
}

// Run test if script is executed directly
if (require.main === module) {
  testGmailSync()
    .then(() => {
      console.log('\n🎯 Test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testGmailSync };
