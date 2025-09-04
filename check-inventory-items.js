const mongoose = require('mongoose');
const Inventory = require('./models/Inventory');

// Connect to MongoDB (update with your connection string)
mongoose.connect('mongodb://localhost:27017/your_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkInventoryItems() {
  try {
    console.log('🔍 Checking existing inventory items...\n');

    const inventoryItems = await Inventory.find({}).limit(5);
    
    if (inventoryItems.length === 0) {
      console.log('❌ No inventory items found in database');
      console.log('💡 You need to create some inventory items first');
    } else {
      console.log(`✅ Found ${inventoryItems.length} inventory items:`);
      inventoryItems.forEach((item, index) => {
        console.log(`\n${index + 1}. Inventory Item:`);
        console.log(`   ID: ${item._id}`);
        console.log(`   QR Code: ${item.qrCode}`);
        console.log(`   Barcode: ${item.barcode}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Available Quantity: ${item.availableQuantity}`);
        console.log(`   Assigned Quantity: ${item.assignedQuantity}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking inventory items:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkInventoryItems();
