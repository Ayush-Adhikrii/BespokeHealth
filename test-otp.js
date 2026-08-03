const axios = require('axios');
const https = require('https');

const API_BASE = 'https://localhost:3000/api';

const testAxios = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

async function testOTPFlow() {
  try {
    console.log('Testing OTP flow...');
    
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    const deviceId = 'test-device-123';
    
    console.log('\n1. Testing login with untrusted device...');
    const loginResponse = await testAxios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: testPassword,
      deviceId: deviceId,
      rememberMe: true
    });
    
    console.log('Login response:', loginResponse.data);
    
    if (loginResponse.data.requiresOtp) {
      console.log('\n2. OTP required, checking if OTP was sent...');
      console.log('This would normally send an email with OTP');
      console.log('For testing, you would need to check the email or database');
    }
    
  } catch (error) {
    console.error('\n❌ OTP test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testOTPFlow(); 