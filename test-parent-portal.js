// Test script for enhanced parent portal functionality
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testParentPortal() {
  try {
    console.log('🧪 Testing Enhanced Parent Portal Functionality\n');

    // 1. Parent Signup
    console.log('1. Testing parent signup...');
    const signupResponse = await fetch(`${BASE_URL}/api/parent/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Parent',
        email: 'test.enhanced@demo.com',
        password: 'demo123',
        phone: '555-TEST-PARENT'
      })
    });
    
    const signupResult = await signupResponse.text();
    console.log('   Signup result:', signupResult);

    // 2. Parent Login
    console.log('\n2. Testing parent login...');
    const loginResponse = await fetch(`${BASE_URL}/api/parent/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test.enhanced@demo.com',
        password: 'demo123'
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('   Login result:', loginResult);
    
    if (!loginResult.token) {
      console.log('❌ Login failed, cannot proceed with tests');
      return;
    }

    const parentToken = loginResult.token;
    const authHeaders = {
      'Authorization': `Bearer ${parentToken}`,
      'Content-Type': 'application/json'
    };

    // 3. Test Add Scholar by Credentials
    console.log('\n3. Testing add scholar by credentials...');
    const addScholarResponse = await fetch(`${BASE_URL}/api/parent/add-scholar-by-credentials`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        username: 'mktys9200', // Mike Tyson's student ID
        password: 'student123'  // Mock password for testing
      })
    });
    
    const addScholarResult = await addScholarResponse.text();
    console.log('   Add scholar result:', addScholarResult);

    // 4. Test Get Parent Scholars
    console.log('\n4. Testing get parent scholars...');
    const scholarsResponse = await fetch(`${BASE_URL}/api/parent/scholars`, {
      headers: authHeaders
    });
    
    const scholars = await scholarsResponse.json();
    console.log('   Parent scholars:', JSON.stringify(scholars, null, 2));

    // 5. Test Send Message
    console.log('\n5. Testing send message to teacher...');
    const messageResponse = await fetch(`${BASE_URL}/api/parent/send-message`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        recipientType: 'admin',
        subject: 'Test Message from Enhanced Portal',
        message: 'This is a test message from the enhanced parent portal to verify bidirectional messaging functionality.',
        priority: 'normal'
      })
    });
    
    const messageResult = await messageResponse.text();
    console.log('   Send message result:', messageResult);

    // 6. Test Get Messages
    console.log('\n6. Testing get parent messages...');
    const getMessagesResponse = await fetch(`${BASE_URL}/api/parent/messages`, {
      headers: authHeaders
    });
    
    const messages = await getMessagesResponse.json();
    console.log('   Parent messages:', JSON.stringify(messages, null, 2));

    // 7. Test Get Notifications
    console.log('\n7. Testing get SMS notifications...');
    const notificationsResponse = await fetch(`${BASE_URL}/api/parent/notifications`, {
      headers: authHeaders
    });
    
    const notifications = await notificationsResponse.json();
    console.log('   SMS notifications:', JSON.stringify(notifications, null, 2));

    console.log('\n✅ Enhanced Parent Portal Testing Complete!');
    console.log('\nKey Features Tested:');
    console.log('  ✓ Parent signup and authentication');
    console.log('  ✓ Auto-populate children via credentials');
    console.log('  ✓ View parent scholars');
    console.log('  ✓ Send messages to admin/teachers');
    console.log('  ✓ Retrieve message history');
    console.log('  ✓ SMS notification infrastructure');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testParentPortal();