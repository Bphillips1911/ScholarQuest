// Test script to create a student with credentials and test login flow
const bcrypt = require('bcryptjs');

console.log("Testing Student Authentication System");
console.log("====================================");

// Test 1: Create demo student credentials
async function createTestCredentials() {
  const username = "bh6001emma";
  const password = "test1234";
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log("Demo Student Credentials:");
  console.log("Username:", username);
  console.log("Password:", password);
  console.log("Hashed:", hashedPassword);
  
  return { username, password, hashedPassword };
}

// Test 2: Test login API call
async function testLogin(username, password) {
  try {
    const response = await fetch('http://localhost:5000/api/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    console.log("Login Test Result:", result);
    
    return result;
  } catch (error) {
    console.error("Login test failed:", error.message);
    return null;
  }
}

// Run tests
async function runTests() {
  const { username, password } = await createTestCredentials();
  
  console.log("\n--- Testing Login Flow ---");
  const loginResult = await testLogin(username, password);
  
  if (loginResult && loginResult.success) {
    console.log("✅ Student authentication system working!");
    console.log("Token:", loginResult.token);
  } else {
    console.log("❌ Authentication needs setup");
  }
}

runTests().catch(console.error);