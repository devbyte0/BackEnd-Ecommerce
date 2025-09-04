const axios = require('axios');

// Test inventory assignment functionality
async function testInventoryAssignment() {
  try {
    console.log('🧪 Testing Inventory Assignment...\n');

    // Test data
    const testData = {
      orderItemIndex: 0,
      inventoryId: "68a869232fe0af526aaac9fa",
      scannedCode: "QR67427829391"
    };

    // You'll need to replace this with a real order ID from your database
    const orderId = "YOUR_ORDER_ID_HERE"; // Replace with actual order ID

    console.log('Test Data:', testData);
    console.log('Order ID:', orderId);

    // Test the inventory assignment endpoint
    const response = await axios.post(
      `http://localhost:3000/api/orders/${orderId}/assign-inventory`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Replace with actual token
        }
      }
    );

    console.log('✅ Inventory Assignment Response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);

    if (response.data.success) {
      console.log('Order Updated:', response.data.order);
      console.log('Assigned Inventory:', response.data.assignedInventory);
    }

  } catch (error) {
    console.log('❌ Inventory Assignment Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Instructions for testing
console.log('📋 To test this functionality:');
console.log('1. Replace "YOUR_ORDER_ID_HERE" with an actual order ID from your database');
console.log('2. Replace "YOUR_ADMIN_TOKEN_HERE" with a valid admin JWT token');
console.log('3. Make sure the inventory ID exists and is available for assignment');
console.log('4. Run: node test-inventory-assignment.js\n');

// Run the test
testInventoryAssignment();
