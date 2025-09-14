const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'user2@example.com', // Project owner email
  password: 'password123'
};

// Helper function to login and get token
async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to fetch notifications
async function getNotifications(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch notifications:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to mark a notification as read
async function markNotificationAsRead(token, notificationId) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to mark notification ${notificationId} as read:`, error.response?.data || error.message);
    throw error;
  }
}

// Helper function to mark all notifications as read
async function markAllNotificationsAsRead(token) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/notifications/read-all`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function testMarkNotificationAsRead() {
  let token;
  
  try {
    // Step 1: Login to get token
    console.log('Logging in...');
    token = await login(TEST_USER.email, TEST_USER.password);
    console.log('Login successful!');
    
    // Step 2: Fetch notifications
    console.log('Fetching notifications...');
    const notifications = await getNotifications(token);
    console.log(`Found ${notifications.length} notifications`);
    
    if (notifications.length === 0) {
      console.log('No notifications found to mark as read. Please run test-offer-notification.js first.');
      return;
    }
    
    // Step 3: Mark a single notification as read
    const notificationToMark = notifications[0];
    console.log(`Marking notification ${notificationToMark.id} as read...`);
    const markResult = await markNotificationAsRead(token, notificationToMark.id);
    console.log('Mark as read result:', markResult);
    
    // Step 4: Verify the notification is marked as read
    console.log('Fetching notifications again to verify...');
    const updatedNotifications = await getNotifications(token);
    const markedNotification = updatedNotifications.find(n => n.id === notificationToMark.id);
    
    if (markedNotification && markedNotification.read) {
      console.log('✅ Success: Notification was marked as read!');
    } else {
      console.log('❌ Error: Notification was not marked as read!');
    }
    
    // Step 5: Mark all notifications as read
    console.log('Marking all notifications as read...');
    const markAllResult = await markAllNotificationsAsRead(token);
    console.log('Mark all as read result:', markAllResult);
    
    // Step 6: Verify all notifications are marked as read
    console.log('Fetching notifications again to verify all are read...');
    const finalNotifications = await getNotifications(token);
    const allRead = finalNotifications.every(n => n.read);
    
    if (allRead) {
      console.log('✅ Success: All notifications were marked as read!');
    } else {
      console.log('❌ Error: Not all notifications were marked as read!');
      console.log('Unread notifications:', finalNotifications.filter(n => !n.read));
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testMarkNotificationAsRead();