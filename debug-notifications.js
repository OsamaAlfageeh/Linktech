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
      username: email, // API expects username field, not email
      password
    });
    
    if (response.data.token) {
      // Set the token for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      console.log(`✅ Login successful for ${email}`);
      return response.data.user;
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Get notifications
async function getNotifications() {
  try {
    const response = await api.get('/api/notifications');
    console.log('📬 Raw notifications response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get notifications:', error.response?.data || error.message);
    throw error;
  }
}

// Get all users to see what test users exist
async function getUsers() {
  try {
    const response = await api.get('/api/users');
    console.log('👥 Available users:', response.data.map(u => ({ id: u.id, email: u.email, role: u.role })));
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get users:', error.response?.data || error.message);
    return [];
  }
}

// Main debug function
async function debugNotifications() {
  try {
    console.log('🔍 Debugging Notification System');
    console.log('================================\n');
    
    // Test different user accounts from seed data
    const testUsers = [
      { email: 'ahmed_entrepreneur', password: 'password123' },
      { email: 'tech_solutions', password: 'password123' },
      { email: 'digital_hub', password: 'password123' },
      { email: 'smart_code', password: 'password123' },
      { email: 'sara_entrepreneur', password: 'password123' }
    ];
    
    for (const testUser of testUsers) {
      try {
        console.log(`\n🧪 Testing user: ${testUser.email}`);
        const user = await login(testUser.email, testUser.password);
        console.log(`User details:`, { id: user.id, role: user.role, name: user.name });
        
        const notifications = await getNotifications();
        console.log(`Found ${notifications.length} notifications for ${testUser.email}`);
        
        if (notifications.length > 0) {
          console.log('Notification types found:', [...new Set(notifications.map(n => n.type))]);
          notifications.forEach((n, index) => {
            console.log(`  ${index + 1}. Type: ${n.type}, Title: ${n.title}, Read: ${n.isRead}`);
          });
        }
        
        // Clear auth for next user
        delete api.defaults.headers.common['Authorization'];
        
      } catch (error) {
        console.log(`❌ Failed to test ${testUser.email}: ${error.message}`);
        delete api.defaults.headers.common['Authorization'];
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugNotifications();