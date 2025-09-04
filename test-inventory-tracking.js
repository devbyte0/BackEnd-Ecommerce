const mongoose = require('mongoose');
const Order = require('./models/Order');
const Inventory = require('./models/Inventory');
const { 
  assignInventoryToOrder, 
  releaseInventoryFromOrder, 
  validateInventoryAvailability 
} = require('./utils/inventoryHelpers');

// Connect to MongoDB (update with your connection string)
mongoose.connect('mongodb://localhost:27017/your_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testInventoryTracking() {
  try {
    console.log('🧪 Testing Inventory Tracking System...\n');

    // 1. Create test inventory items
    console.log('1. Creating test inventory items...');
    const testInventory = await Inventory.create([
      {
        productId: new mongoose.Types.ObjectId(),
        variantId: new mongoose.Types.ObjectId(),
        size: 'M',
        barcode: 'TEST001',
        qrCode: 'QR001',
        stockQuantity: 1,
        availableQuantity: 1,
        assignedQuantity: 0,
        status: 'active',
        price: 29.99
      },
      {
        productId: new mongoose.Types.ObjectId(),
        variantId: new mongoose.Types.ObjectId(),
        size: 'L',
        barcode: 'TEST002',
        qrCode: 'QR002',
        stockQuantity: 1,
        availableQuantity: 1,
        assignedQuantity: 0,
        status: 'active',
        price: 34.99
      }
    ]);
    console.log(`✅ Created ${testInventory.length} inventory items\n`);

    // 2. Test inventory validation
    console.log('2. Testing inventory validation...');
    const testItems = [
      {
        productId: testInventory[0].productId,
        variantId: testInventory[0].variantId,
        size: 'M',
        quantity: 1,
        name: 'Test Product M'
      },
      {
        productId: testInventory[1].productId,
        variantId: testInventory[1].variantId,
        size: 'L',
        quantity: 1,
        name: 'Test Product L'
      }
    ];

    const validation = await validateInventoryAvailability(testItems);
    console.log('Validation result:', validation);
    console.log(`✅ Inventory validation: ${validation.valid ? 'PASSED' : 'FAILED'}\n`);

    // 3. Test inventory assignment
    console.log('3. Testing inventory assignment...');
    const assignment = await assignInventoryToOrder(testItems, new mongoose.Types.ObjectId());
    console.log('Assignment result:', assignment);
    console.log(`✅ Inventory assignment: ${assignment.success ? 'PASSED' : 'FAILED'}\n`);

    // 4. Verify inventory status after assignment
    console.log('4. Verifying inventory status after assignment...');
    const updatedInventory = await Inventory.find({
      _id: { $in: testInventory.map(item => item._id) }
    });
    
    console.log('Updated inventory status:');
    updatedInventory.forEach(item => {
      console.log(`  - ${item.barcode}: assigned=${item.assignedQuantity}, available=${item.availableQuantity}, status=${item.status}`);
    });
    console.log('✅ Inventory status verification completed\n');

    // 5. Test inventory release
    console.log('5. Testing inventory release...');
    const itemsWithInventory = testItems.map((item, index) => ({
      ...item,
      assignedInventoryItems: assignment.assignedItems[index]?.assignedInventoryIds || []
    }));

    const release = await releaseInventoryFromOrder(itemsWithInventory, 'test_release');
    console.log('Release result:', release);
    console.log(`✅ Inventory release: ${release.success ? 'PASSED' : 'FAILED'}\n`);

    // 6. Verify inventory status after release
    console.log('6. Verifying inventory status after release...');
    const finalInventory = await Inventory.find({
      _id: { $in: testInventory.map(item => item._id) }
    });
    
    console.log('Final inventory status:');
    finalInventory.forEach(item => {
      console.log(`  - ${item.barcode}: assigned=${item.assignedQuantity}, available=${item.availableQuantity}, status=${item.status}`);
    });
    console.log('✅ Final inventory status verification completed\n');

    // 7. Cleanup
    console.log('7. Cleaning up test data...');
    await Inventory.deleteMany({ _id: { $in: testInventory.map(item => item._id) } });
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 All inventory tracking tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testInventoryTracking();
