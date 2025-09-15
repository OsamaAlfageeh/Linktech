import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Login function
async function login(username, password) {
  try {
    const response = await api.post('/api/auth/login', {
      username,
      password
    });
    
    if (response.data.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      console.log(`✅ Login successful for ${username}`);
      return response.data.user;
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Create a test project to trigger notifications
async function createTestProject() {
  try {
    const projectData = {
      title: "Test Project for Notifications",
      description: "This is a test project to trigger offer and message notifications",
      budget: "10,000 - 20,000 ريال",
      duration: "1-2 أشهر",
      skills: ["تطوير ويب", "React", "Node.js"]
    };
    
    const response = await api.post('/api/projects', projectData);
    console.log('✅ Test project created:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create project:', error.response?.data || error.message);
    throw error;
  }
}

// Create a test offer
async function createTestOffer(projectId) {
  try {
    const offerData = {
      projectId: projectId,
      amount: "15,000 ريال",
      duration: "6 أسابيع",
      description: "نحن مستعدون لتنفيذ هذا المشروع بأعلى جودة وفي الوقت المحدد"
    };
    
    const response = await api.post(`/api/projects/${projectId}/offers`, offerData);
    console.log('✅ Test offer created:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create offer:', error.response?.data || error.message);
    throw error;
  }
}

// Send a test message
async function sendTestMessage(recipientId) {
  try {
    const messageData = {
      recipientId: recipientId,
      content: "مرحباً، هذه رسالة اختبار لتجربة نظام الإشعارات"
    };
    
    const response = await api.post('/api/messages', messageData);
    console.log('✅ Test message sent:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send message:', error.response?.data || error.message);
    throw error;
  }
}

// Get notifications
async function getNotifications() {
  try {
    const response = await api.get('/api/notifications');
    console.log('📬 Notifications:', response.data.length);
    response.data.forEach((n, index) => {
      console.log(`  ${index + 1}. Type: ${n.type}, Title: ${n.title}`);
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get notifications:', error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function testNotificationCreation() {
  try {
    console.log('🧪 Testing Notification Creation');
    console.log('=================================\n');
    
    // Step 1: Login as entrepreneur (project owner)
    console.log('Step 1: Login as entrepreneur...');
    const entrepreneur = await login('ahmed_entrepreneur', 'password123');
    
    // Step 2: Create a test project
    console.log('\nStep 2: Creating test project...');
    const project = await createTestProject();
    
    // Step 3: Login as company to make an offer
    console.log('\nStep 3: Login as company...');
    const company = await login('tech_solutions', 'password123');
    
    // Step 4: Create an offer (should trigger notification to project owner)
    console.log('\nStep 4: Creating test offer...');
    const offer = await createTestOffer(project.id);
    
    // Step 5: Send a message (should trigger notification)
    console.log('\nStep 5: Sending test message...');
    const message = await sendTestMessage(entrepreneur.id);
    
    // Step 6: Check notifications for entrepreneur
    console.log('\nStep 6: Checking entrepreneur notifications...');
    await login('ahmed_entrepreneur', 'password123');
    await getNotifications();
    
    // Step 7: Check notifications for company
    console.log('\nStep 7: Checking company notifications...');
    await login('tech_solutions', 'password123');
    await getNotifications();
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testNotificationCreation();