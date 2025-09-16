import axios from 'axios';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
});

// Login function
async function login(username, password) {
  try {
    const response = await api.post('/api/auth/login', {
      username,
      password
    });
    return response.data;
  } catch (error) {
    throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
  }
}

// Send message function
async function sendMessage(token, toUserId, content, projectId = null) {
  try {
    const response = await api.post('/api/messages', {
      toUserId,
      content,
      projectId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Message sending failed: ${error.response?.data?.message || error.message}`);
  }
}

// Ensure recipient message notifications are enabled
async function ensureRecipientSettings(token, settings = { messageNotifications: true }) {
  try {
    const response = await api.post('/api/user/settings', settings, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to set recipient settings: ${error.response?.data?.message || error.message}`);
  }
}

// Get notifications function
async function getNotifications(token) {
  try {
    const response = await api.get('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get notifications: ${error.response?.data?.message || error.message}`);
  }
}

// Main test function
async function testMessageNotifications() {
  console.log('🧪 Testing Message Notification Creation');
  console.log('========================================\n');

  try {
    // Step 1: Login as sender (tech_solutions)
    console.log('Step 1: Login as sender...');
    const senderLogin = await login('tech_solutions', 'password123');
    console.log('✅ Login successful for tech_solutions\n');

    // Step 2: Login as recipient (ahmed_entrepreneur)
    console.log('Step 2: Login as recipient...');
    const recipientLogin = await login('ahmed_entrepreneur', 'password123');
    console.log('✅ Login successful for ahmed_entrepreneur\n');

    // Step 2.1: Ensure recipient message notifications are enabled
    console.log('Step 2.1: Ensuring recipient message notifications are enabled...');
    await ensureRecipientSettings(recipientLogin.token, { messageNotifications: true });
    console.log('✅ Recipient settings ensured\n');

    // Step 3: Check initial notifications for recipient
    console.log('Step 3: Check initial notifications for recipient...');
    const initialNotifications = await getNotifications(recipientLogin.token);
    console.log(`📬 Initial notifications count: ${initialNotifications.length}\n`);

    // Step 4: Send message from tech_solutions to ahmed_entrepreneur
    console.log('Step 4: Sending test message...');
    const messageData = {
      toUserId: recipientLogin.user.id,
      content: 'Test message for notification testing',
      projectId: null
    };
    
    const message = await sendMessage(senderLogin.token, messageData.toUserId, messageData.content, messageData.projectId);
    console.log(`✅ Test message sent: ${message.id}\n`);

    // Step 5: Wait a moment and check notifications again
    console.log('Step 5: Checking notifications after message...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const finalNotifications = await getNotifications(recipientLogin.token);
    console.log(`📬 Final notifications count: ${finalNotifications.length}`);
    
    // Check if new notification was created
    const messageNotifications = finalNotifications.filter(n => n.type === 'message');
    const latest = messageNotifications[messageNotifications.length - 1];
    console.log(`📨 Message notifications found: ${messageNotifications.length}`);
    
    if (messageNotifications.length > 0 && finalNotifications.length > initialNotifications.length) {
      console.log('\n✅ Message notification created successfully!');
      console.log('Latest message notification:', JSON.stringify(latest, null, 2));
    } else {
      console.log('\n❌ No message notification was created');
      console.log('Note: Verify API_BASE, user credentials, and that notifications endpoint is reachable.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMessageNotifications();