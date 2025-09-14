/**
 * Test script for offer notification functionality
 * This script simulates creating an offer and verifies that notifications are generated
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000'; // Change to your server URL
let authToken = null;
let projectId = null;
let userId = null;

// Test user credentials - update these with valid credentials
const testEntrepreneur = {
  email: 'entrepreneur@example.com',
  password: 'password123'
};

const testCompany = {
  email: 'company@example.com',
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

// Get user's projects
async function getProjects() {
  try {
    const response = await api.get('/api/projects');
    console.log(`✅ Retrieved ${response.data.length} projects`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get projects:', error.response?.data || error.message);
    throw error;
  }
}

// Create an offer for a project
async function createOffer(projectId, offerData) {
  try {
    const response = await api.post(`/api/projects/${projectId}/offers`, offerData);
    console.log(`✅ Created offer for project ${projectId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create offer:', error.response?.data || error.message);
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

// Mark a notification as read
async function markNotificationAsRead(notificationId) {
  try {
    const response = await api.post(`/api/notifications/${notificationId}/read`);
    console.log(`✅ Marked notification ${notificationId} as read`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to mark notification as read:', error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function testOfferNotification() {
  try {
    console.log('🔍 Starting offer notification test...');
    
    // Step 1: Login as entrepreneur to get a project
    const entrepreneur = await login(testEntrepreneur);
    userId = entrepreneur.id;
    
    // Step 2: Get entrepreneur's projects
    const projects = await getProjects();
    if (projects.length === 0) {
      console.error('❌ No projects found for testing');
      return;
    }
    
    // Use the first project for testing
    projectId = projects[0].id;
    console.log(`🔍 Using project ID: ${projectId} for testing`);
    
    // Step 3: Login as company to create an offer
    await login(testCompany);
    
    // Step 4: Create an offer
    const offerData = {
      amount: '5000 SAR',
      duration: '30 days',
      description: 'This is a test offer for notification testing',
      deliverables: 'Test deliverables',
      paymentTerms: 'Test payment terms'
    };
    
    await createOffer(projectId, offerData);
    
    // Step 5: Login back as entrepreneur to check notifications
    await login(testEntrepreneur);
    
    // Step 6: Get notifications and verify
    const notifications = await getNotifications();
    
    // Find the offer notification
    const offerNotification = notifications.find(n => 
      n.type === 'offer' && 
      n.metadata && 
      JSON.parse(n.metadata).projectId === projectId
    );
    
    if (offerNotification) {
      console.log('✅ Offer notification found:');
      console.log(JSON.stringify(offerNotification, null, 2));
      
      // Step 7: Mark notification as read
      await markNotificationAsRead(offerNotification.id);
      
      // Step 8: Verify notification is marked as read
      const updatedNotifications = await getNotifications();
      const updatedNotification = updatedNotifications.find(n => n.id === offerNotification.id);
      
      if (updatedNotification && updatedNotification.isRead) {
        console.log('✅ Notification successfully marked as read');
      } else {
        console.error('❌ Failed to mark notification as read');
      }
    } else {
      console.error('❌ Offer notification not found');
    }
    
    console.log('🏁 Offer notification test completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testOfferNotification();