/**
 * Verification script for offer notifications
 * This script checks if notifications are properly generated for a project owner
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000'; // Change to your server URL
let authToken = null;

// Test user credentials - update with valid entrepreneur credentials
const testEntrepreneur = {
  email: 'entrepreneur@example.com',
  password: 'password123'
};

// Helper function for API requests
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set auth token for subsequent requests
const setAuthToken = (token) => {
  authToken = token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Login function
async function login(credentials) {
  try {
    const response = await api.post('/api/auth/login', credentials);
    setAuthToken(response.data.token);
    console.log(`✅ Logged in as ${credentials.email}`);
    return response.data.user;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Get notifications for the current user
async function getNotifications() {
  try {
    const response = await api.get('/api/notifications');
    console.log(`✅ Retrieved ${response.data.length} notifications`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get notifications:', error.response?.data || error.message);
    throw error;
  }
}

// Main verification function
async function verifyOfferNotifications() {
  try {
    console.log('🔍 Starting offer notification verification...');
    
    // Step 1: Login as entrepreneur
    const entrepreneur = await login(testEntrepreneur);
    console.log(`✅ Logged in as entrepreneur (ID: ${entrepreneur.id})`);
    
    // Step 2: Get notifications
    const notifications = await getNotifications();
    
    // Step 3: Filter offer notifications
    const offerNotifications = notifications.filter(n => n.type === 'offer');
    
    if (offerNotifications.length > 0) {
      console.log(`✅ Found ${offerNotifications.length} offer notifications:`);
      
      // Display offer notifications
      offerNotifications.forEach((notification, index) => {
        console.log(`\nNotification #${index + 1}:`);
        console.log(`ID: ${notification.id}`);
        console.log(`Title: ${notification.title}`);
        console.log(`Content: ${notification.content}`);
        console.log(`Read Status: ${notification.isRead ? 'Read' : 'Unread'}`);
        console.log(`Created At: ${notification.createdAt}`);
        console.log(`Action URL: ${notification.actionUrl || 'None'}`);
        
        if (notification.metadata) {
          try {
            const metadata = JSON.parse(notification.metadata);
            console.log('Metadata:');
            console.log(` - Project ID: ${metadata.projectId || 'N/A'}`);
            console.log(` - Offer ID: ${metadata.offerId || 'N/A'}`);
          } catch (e) {
            console.log(`Metadata: ${notification.metadata} (Failed to parse)`);
          }
        }
      });
    } else {
      console.log('❌ No offer notifications found');
    }
    
    console.log('\n🏁 Offer notification verification completed');
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the verification
verifyOfferNotifications();