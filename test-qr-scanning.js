const axios = require('axios');

// Test QR code scanning functionality
async function testQRScanning() {
  try {
    console.log('🧪 Testing QR Code Scanning in POS System...\n');

    // Test with a sample QR code
    const testQRCode = 'QR67427829391';
    
    console.log(`Testing QR Code: ${testQRCode}`);
    
    // Test the inventory scan endpoint
    const response = await axios.get(`http://localhost:3000/api/inventory/scan?code=${testQRCode}`);

    console.log('✅ Inventory Scan Response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    
    if (response.data.success) {
      const inventory = response.data.inventory;
      console.log('Inventory Found:');
      console.log('- ID:', inventory._id);
      console.log('- QR Code:', inventory.qrCode);
      console.log('- Barcode:', inventory.barcode);
      console.log('- Status:', inventory.status);
      console.log('- Available Quantity:', inventory.availableQuantity);
      console.log('- Product Name:', inventory.productId?.name);
      console.log('- Price:', inventory.price);
    } else {
      console.log('❌ No inventory found for this QR code');
    }

  } catch (error) {
    console.log('❌ QR Scanning Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Run the test
testQRScanning();
