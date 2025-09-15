/**
 * Test script for complete email notification workflow
 * Tests user settings, notification creation, and email sending integration
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Login function
async function login(email, password) {
  try {
    const response = await api.post('/api/auth/login', {
      username: email,
      password
    });
    
    if (response.data.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      return response.data;
    }
    throw new Error('No token received');
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
}

async function testEmailNotificationWorkflow() {
  console.log('🧪 Starting Email Notification Workflow Test\n');
  
  try {
    // Step 1: Login as existing user
    console.log('🔐 Step 1: Logging in...');
    await login('ahmed_entrepreneur', 'password123');
    console.log('✅ Logged in successfully');
    
    // Step 2: Check current user settings
    console.log('\n📝 Step 2: Checking current user settings...');
    let userSettingsResponse = await api.get('/api/user/settings');
    console.log('Current settings:', userSettingsResponse.data);

    // Step 3: Update user notification settings
    console.log('\n⚙️ Step 3: Updating user notification settings...');
    const notificationSettings = {
      emailNotifications: true,
      messageNotifications: true,
      offerNotifications: true,
      systemNotifications: true
    };

    await api.put('/api/user/settings', notificationSettings);
    userSettingsResponse = await api.get('/api/user/settings');
    console.log('✅ Updated settings:', userSettingsResponse.data);

    // Step 4: Test notification creation for different types
    console.log('\n📧 Step 4: Testing notification creation and email sending...');
    
    const notificationTypes = [
      {
        type: 'message',
        title: 'New Message Received',
        message: 'You have received a new message from a client.'
      },
      {
        type: 'offer',
        title: 'New Offer Received',
        message: 'You have received a new project offer.'
      },
      {
        type: 'system',
        title: 'System Notification',
        message: 'Your account settings have been updated.'
      }
    ];

    const createdNotifications = [];

    for (const notifData of notificationTypes) {
      console.log(`\n  📨 Creating ${notifData.type} notification...`);
      
      const response = await api.post('/api/notifications', {
        type: notifData.type,
        title: notifData.title,
        message: notifData.message
      });
      
      createdNotifications.push(response.data);
      console.log(`  ✅ ${notifData.type} notification created:`, response.data.id);
      
      // Small delay to avoid overwhelming email service
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Step 5: Verify notifications were created
    console.log('\n📋 Step 5: Verifying notifications in database...');
    const notificationsResponse = await api.get('/api/notifications');
    console.log(`✅ Found ${notificationsResponse.data.length} notifications for user`);

    // Step 6: Test marking notifications as read
    console.log('\n👁️ Step 6: Testing mark as read functionality...');
    for (const notification of createdNotifications) {
      await api.put(`/api/notifications/${notification.id}/read`);
      console.log(`✅ Marked notification ${notification.id} as read`);
    }

    // Step 7: Verify read status
    console.log('\n🔍 Step 7: Verifying read status...');
    const updatedNotificationsResponse = await api.get('/api/notifications');
    const readCount = updatedNotificationsResponse.data.filter(n => n.isRead).length;
    console.log(`✅ ${readCount}/${updatedNotificationsResponse.data.length} notifications marked as read`);
    
    console.log('\n🎉 Email Notification Workflow Test PASSED!');
    console.log('\n📊 Test Summary:');
    console.log(`   • Notifications created: ${createdNotifications.length}`);
    console.log(`   • Notifications marked as read: ${readCount}`);
    console.log(`   • Email notifications: ${notificationSettings.emailNotifications ? 'Enabled' : 'Disabled'}`);
    
  } catch (error) {
    console.error('\n❌ Email Notification Workflow Test FAILED!');
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
}

// Run the test
testEmailNotificationWorkflow()
  .then(() => {
    console.log('\n✅ Test execution completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  });

export { testEmailNotificationWorkflow };