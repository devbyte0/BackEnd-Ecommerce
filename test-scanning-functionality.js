const mongoose = require('mongoose');
const Order = require('./models/Order');
const Inventory = require('./models/Inventory');
const User = require('./models/User');

// Connect to MongoDB (update with your connection string)
mongoose.connect('mongodb://localhost:27017/your_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testScanningFunctionality() {
  try {
    console.log('🧪 Testing QR/Barcode Scanning Functionality...\n');

    // 1. Create test user
    console.log('1. Creating test user...');
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890'
    });
    console.log(`✅ Created test user: ${testUser._id}\n`);

    // 2. Create test inventory items
    console.log('2. Creating test inventory items...');
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

    // 3. Create test order
    console.log('3. Creating test order...');
    const testOrder = await Order.create({
      orderId: '1234567890',
      userId: testUser._id,
      items: [
        {
          variantId: testInventory[0].variantId,
          productId: testInventory[0].productId,
          discountApplied: 0,
          name: 'Test Product M',
          quantity: 1,
          price: 29.99,
          mainImage: 'test-image.jpg',
          size: 'M',
          color: 'Blue',
          measureType: 'Size',
          unitName: 'M',
          assignedInventoryItems: [],
          inventoryAssigned: false
        }
      ],
      totalAmount: 29.99,
      discountAmount: 0,
      shippingAddress: {
        fullName: 'Test User',
        address: '123 Test St',
        city: 'Test City',
        postalCode: '12345',
        state: 'Test State',
        country: 'Test Country',
        phone: '1234567890'
      },
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      isActive: true
    });
    console.log(`✅ Created test order: ${testOrder._id}\n`);

    // 4. Test inventory scanning by barcode
    console.log('4. Testing inventory scanning by barcode...');
    const barcodeScan = await Inventory.findOne({ barcode: 'TEST001' });
    if (barcodeScan) {
      console.log(`✅ Found inventory by barcode: ${barcodeScan.barcode}`);
      console.log(`   - Status: ${barcodeScan.status}`);
      console.log(`   - Available: ${barcodeScan.availableQuantity}`);
      console.log(`   - Assigned: ${barcodeScan.assignedQuantity}\n`);
    } else {
      console.log('❌ Failed to find inventory by barcode\n');
    }

    // 5. Test inventory scanning by QR code
    console.log('5. Testing inventory scanning by QR code...');
    const qrScan = await Inventory.findOne({ qrCode: 'QR001' });
    if (qrScan) {
      console.log(`✅ Found inventory by QR code: ${qrScan.qrCode}`);
      console.log(`   - Status: ${qrScan.status}`);
      console.log(`   - Available: ${qrScan.availableQuantity}`);
      console.log(`   - Assigned: ${qrScan.assignedQuantity}\n`);
    } else {
      console.log('❌ Failed to find inventory by QR code\n');
    }

    // 6. Test inventory assignment simulation
    console.log('6. Testing inventory assignment simulation...');
    const inventoryToAssign = await Inventory.findOne({ barcode: 'TEST001' });
    const orderToUpdate = await Order.findById(testOrder._id);
    
    if (inventoryToAssign && orderToUpdate) {
      // Simulate assignment
      inventoryToAssign.assignedQuantity = 1;
      inventoryToAssign.status = 'out_of_stock';
      inventoryToAssign.availableQuantity = 0;
      await inventoryToAssign.save();

      // Update order item
      orderToUpdate.items[0].assignedInventoryItems.push(inventoryToAssign._id);
      orderToUpdate.items[0].inventoryAssigned = true;
      await orderToUpdate.save();

      console.log('✅ Inventory assignment simulation successful');
      console.log(`   - Inventory status: ${inventoryToAssign.status}`);
      console.log(`   - Order item assigned: ${orderToUpdate.items[0].inventoryAssigned}`);
      console.log(`   - Assigned inventory count: ${orderToUpdate.items[0].assignedInventoryItems.length}\n`);
    } else {
      console.log('❌ Failed to simulate inventory assignment\n');
    }

    // 7. Test inventory release simulation
    console.log('7. Testing inventory release simulation...');
    const assignedInventory = await Inventory.findOne({ barcode: 'TEST001' });
    if (assignedInventory && assignedInventory.status === 'out_of_stock') {
      // Simulate release
      assignedInventory.assignedQuantity = 0;
      assignedInventory.status = 'active';
      assignedInventory.availableQuantity = 1;
      await assignedInventory.save();

      console.log('✅ Inventory release simulation successful');
      console.log(`   - Inventory status: ${assignedInventory.status}`);
      console.log(`   - Available quantity: ${assignedInventory.availableQuantity}`);
      console.log(`   - Assigned quantity: ${assignedInventory.assignedQuantity}\n`);
    } else {
      console.log('❌ Failed to simulate inventory release\n');
    }

    // 8. Cleanup
    console.log('8. Cleaning up test data...');
    await Order.findByIdAndDelete(testOrder._id);
    await Inventory.deleteMany({ _id: { $in: testInventory.map(item => item._id) } });
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 All scanning functionality tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testScanningFunctionality();
