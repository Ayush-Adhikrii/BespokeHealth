const axios = require('axios');
const https = require('https');

const API_BASE = 'https://localhost:3000/api';


const testAxios = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

async function testMedicineEndpoint() {
  try {
    console.log('Testing medicine endpoint...');
    
    const response = await testAxios.get(`${API_BASE}/medicines/admin/all?page=1&limit=10`, {
      withCredentials: true,
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwicm9sZSI6IkFkbWluIiwia3ljX3N0YXR1cyI6IlBlbmRpbmciLCJkb2N0b3JJZCI6bnVsbCwiaWF0IjoxNzU0MjM4NTA3LCJleHAiOjE3NTQzMjQ5MDd9.BeDzLXNsCsYE4kJPJmcqjm-bcs6_81jDPRhCnuY8s0U'
      }
    });
    
    console.log('Medicine endpoint response:', response.data);
    console.log('\n✅ Medicine endpoint test successful!');
    
  } catch (error) {
    console.error('\n❌ Medicine endpoint test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testMedicineEndpoint(); 