const axios = require('axios');

// Test the new inventory scan endpoint
async function testScanEndpoint() {
  try {
    console.log('🧪 Testing Inventory Scan Endpoint...\n');

    // Test with a sample QR code
    const testCode = 'QR67421830393';
    const response = await axios.get(`http://localhost:3000/api/inventory/scan?code=${testCode}`);

    console.log('✅ Scan endpoint response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Scan endpoint error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Run the test
testScanEndpoint();
