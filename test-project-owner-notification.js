import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://localhost:3000';
let authToken = '';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
    console.log(`✅ Logged in as ${credentials.username}`);
    return response.data.user;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Get notifications function
async function getNotifications() {
  try {
    const response = await api.get('/api/notifications');
    console.log('📬 Current notifications:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get notifications:', error.response?.data || error.message);
    throw error;
  }
}

// Create a test project
async function createTestProject() {
  try {
    const projectData = {
      title: 'Test Project for Notification',
      description: 'This is a test project to verify notification functionality for project owners.',
      budget: 5000,
      timeline: '30 days',
      skills: ['JavaScript', 'React'],
      category: 'web-development'
    };
    
    const response = await api.post('/api/projects', projectData);
    console.log('✅ Test project created:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create test project:', error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function testProjectOwnerNotifications() {
  console.log('🧪 Testing Project Owner Notification Visibility');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Login as project owner (entrepreneur)
    console.log('\n1. Logging in as project owner...');
    const projectOwner = await login({
      username: 'ahmed_entrepreneur',
      password: 'password123'
    });
    
    console.log(`   User role: ${projectOwner.role}`);
    console.log(`   User ID: ${projectOwner.id}`);
    
    // Step 2: Check current notifications
    console.log('\n2. Checking current notifications...');
    const initialNotifications = await getNotifications();
    console.log(`   Current notification count: ${initialNotifications.length}`);
    
    // Step 3: Create a test project
    console.log('\n3. Creating a test project...');
    const project = await createTestProject();
    
    // Step 4: Wait a moment and check notifications again
    console.log('\n4. Waiting 2 seconds and checking notifications again...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalNotifications = await getNotifications();
    console.log(`   Final notification count: ${finalNotifications.length}`);
    
    // Step 5: Display results
    console.log('\n📊 Test Results:');
    console.log('=' .repeat(30));
    console.log(`Project Owner Role: ${projectOwner.role}`);
    console.log(`Initial Notifications: ${initialNotifications.length}`);
    console.log(`Final Notifications: ${finalNotifications.length}`);
    
    if (finalNotifications.length > 0) {
      console.log('\n📬 Recent notifications:');
      finalNotifications.slice(0, 3).forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.title} (${notif.type})`);
        console.log(`      ${notif.content}`);
        console.log(`      Read: ${notif.isRead}`);
      });
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
testProjectOwnerNotifications();