/**
 * Integration test for the /emails/sync endpoint
 */

const request = require('supertest');
const app = require('../server'); // Adjust path as needed
const { User } = require('../models');
const authService = require('../services/authService');

async function testEmailSyncRoute() {
  try {
    console.log('🧪 Testing /emails/sync route...');
    
    // Get a user from the database
    const user = await User.findOne();
    
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    // Generate a JWT token for the user (even though OAuth tokens are missing)
    const jwtToken = authService.generateJWT(user);
    
    console.log(`📧 Testing with user: ${user.email}`);
    console.log(`🎫 JWT generated: ${jwtToken ? 'Yes' : 'No'}`);
    
    // Make request to the /emails/sync endpoint
    const response = await request(app)
      .post('/emails/sync')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        maxResults: 5
      });
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📝 Response body:`, JSON.stringify(response.body, null, 2));
    
    // Check if response indicates authentication issue
    if (response.status === 401 && response.body.requiresAuth) {
      console.log('✅ Route correctly returns 401 with requiresAuth flag');
    } else if (response.status === 401) {
      console.log('✅ Route correctly returns 401 for authentication issue');
    } else {
      console.log('⚠️  Unexpected response status');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run test if script is executed directly
if (require.main === module) {
  // Import required modules
  const supertest = require('supertest');
  
  testEmailSyncRoute()
    .then(() => {
      console.log('\n🎯 Route test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Route test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEmailSyncRoute };
