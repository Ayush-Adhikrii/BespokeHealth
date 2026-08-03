const axios = require('axios');

const API_BASE = 'https://localhost:3000/api';

async function testDoctorDashboard() {
  try {
    console.log('Testing Doctor Dashboard API endpoints...\n');

    console.log('1. Testing server connectivity...');
    try {
      const response = await axios.get(`${API_BASE}/auth/health`, {
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      });
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server is not running or not accessible');
      console.log('Error:', error.message);
      return;
    }

    console.log('\n2. Testing authentication...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'doctor@test.com',
        password: 'password123',
        deviceId: 'test-device-123'
      }, {
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      });
      console.log('✅ Login successful');
      console.log('Response:', loginResponse.data);
    } catch (error) {
      console.log('❌ Login failed');
      console.log('Error:', error.response?.data || error.message);
    }

    console.log('\n3. Testing doctor stats endpoint (should fail without token)...');
    try {
      const statsResponse = await axios.get(`${API_BASE}/stats/doctor/general`, {
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      });
      console.log('❌ Should have failed without token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected request without token');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    console.log('\nTest completed. Check the backend console for detailed logs.');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testDoctorDashboard(); 