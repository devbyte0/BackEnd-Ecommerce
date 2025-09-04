const POSOrder = require('../models/POSOrder');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');

// Generate unique POS order number
async function generatePOSOrderNumber() {
  const MAX_ATTEMPTS = 10;
  let orderNumber;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < MAX_ATTEMPTS) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    orderNumber = `POS${year}${month}${day}${random}`;
    exists = await POSOrder.exists({ orderNumber });
    attempts++;
  }

  if (exists) {
    throw new Error(`Could not generate unique POS order number after ${MAX_ATTEMPTS} attempts`);
  }
  return orderNumber;
}

// Create new POS order
exports.createPOSOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    customer,
    items,
    subtotal,
    tax,
    discount,
    total,
    paymentMethod,
    outlet,
    notes
  } = req.body;

  // Validate items and check inventory
  for (const item of items) {
    const inventory = await Inventory.findById(item.inventoryId);
    if (!inventory) {
      return next(new ErrorHandler(`Inventory item not found: ${item.inventoryId}`, 404));
    }
    
    if (inventory.availableQuantity < item.quantity) {
      return next(new ErrorHandler(`Insufficient stock for ${inventory.barcode}`, 400));
    }
  }

  // Generate unique order number
  const orderNumber = await generatePOSOrderNumber();

  const posOrder = await POSOrder.create({
    orderNumber,
    customer,
    items,
    subtotal,
    tax,
    discount,
    total,
    paymentMethod,
    paymentStatus: 'completed', // Auto-confirm payment
    orderStatus: 'completed', // Auto-confirm order
    cashier: req.admin.id,
    outlet,
    notes
  });

  // Update inventory - assign items (set assignedQuantity to 1, availableQuantity to 0, status to out_of_stock)
  for (const item of items) {
    await Inventory.findByIdAndUpdate(
      item.inventoryId,
      {
        assignedQuantity: 1,
        availableQuantity: 0,
        status: 'out_of_stock',
        lastUpdated: new Date()
      }
    );
  }

  res.status(201).json({
    success: true,
    posOrder
  });
});

// Get all POS orders
exports.getAllPOSOrders = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 10, status, outlet, dateFrom, dateTo } = req.query;
  
  const query = {};
  
  if (status) query.orderStatus = status;
  if (outlet) query.outlet = outlet;
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const posOrders = await POSOrder.find(query)
    .populate('cashier', 'firstName lastName')
    .populate('items.inventoryId', 'barcode qrCode availableQuantity')
    .populate('items.productId', 'name images')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await POSOrder.countDocuments(query);

  res.status(200).json({
    success: true,
    posOrders,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total
  });
});

// Get single POS order
exports.getPOSOrder = catchAsyncErrors(async (req, res, next) => {
  const posOrder = await POSOrder.findById(req.params.id)
    .populate('cashier', 'firstName lastName')
    .populate('items.inventoryId', 'barcode qrCode availableQuantity')
    .populate('items.productId', 'name images');

  if (!posOrder) {
    return next(new ErrorHandler('POS Order not found', 404));
  }

  res.status(200).json({
    success: true,
    posOrder
  });
});

// Update POS order status
exports.updatePOSOrderStatus = catchAsyncErrors(async (req, res, next) => {
  const { orderStatus, paymentStatus } = req.body;

  const posOrder = await POSOrder.findById(req.params.id);
  if (!posOrder) {
    return next(new ErrorHandler('POS Order not found', 404));
  }

  posOrder.orderStatus = orderStatus || posOrder.orderStatus;
  posOrder.paymentStatus = paymentStatus || posOrder.paymentStatus;
  
  await posOrder.save();

  res.status(200).json({
    success: true,
    posOrder
  });
});

// Scan barcode and get product info
exports.scanBarcode = catchAsyncErrors(async (req, res, next) => {
  const { barcode } = req.body;

  const inventory = await Inventory.findOne({ barcode })
    .populate('productId', 'name images description')
    .populate('variantId');

  if (!inventory) {
    return next(new ErrorHandler('Product not found with this barcode', 404));
  }

  if (inventory.availableQuantity <= 0) {
    return next(new ErrorHandler('Product is out of stock', 400));
  }

  res.status(200).json({
    success: true,
    inventory
  });
});

// Search products by name or barcode
exports.searchProducts = catchAsyncErrors(async (req, res, next) => {
  const { query } = req.query;

  const inventory = await Inventory.find({
    $or: [
      { barcode: { $regex: query, $options: 'i' } },
      { qrCode: { $regex: query, $options: 'i' } }
    ]
  })
  .populate('productId', 'name images description')
  .populate('variantId')
  .limit(10);

  res.status(200).json({
    success: true,
    inventory
  });
});

// Get POS dashboard stats
exports.getPOSStats = catchAsyncErrors(async (req, res, next) => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const todayOrders = await POSOrder.find({
    createdAt: { $gte: startOfDay, $lt: endOfDay }
  });

  const totalSales = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = todayOrders.length;
  const completedOrders = todayOrders.filter(order => order.orderStatus === 'completed').length;

  // Get low stock items (items with availableQuantity <= 0)
  const lowStockItems = await Inventory.find({
    availableQuantity: { $lte: 0 }
  })
  .populate('productId', 'name')
  .limit(5);

  res.status(200).json({
    success: true,
    stats: {
      todaySales: totalSales,
      todayOrders: totalOrders,
      completedOrders,
      lowStockItems
    }
  });
});

// Get recent POS orders
exports.getRecentPOSOrders = catchAsyncErrors(async (req, res, next) => {
  const recentOrders = await POSOrder.find()
    .populate('cashier', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    recentOrders
  });
});

// Print receipt
exports.printReceipt = catchAsyncErrors(async (req, res, next) => {
  const posOrder = await POSOrder.findById(req.params.id)
    .populate('cashier', 'firstName lastName')
    .populate('items.productId', 'name')
    .populate('items.inventoryId', 'barcode');

  if (!posOrder) {
    return next(new ErrorHandler('POS Order not found', 404));
  }

  const receipt = {
    orderNumber: posOrder.orderNumber,
    date: posOrder.createdAt,
    cashier: posOrder.cashier,
    customer: posOrder.customer,
    items: posOrder.items,
    subtotal: posOrder.subtotal,
    tax: posOrder.tax,
    discount: posOrder.discount,
    total: posOrder.total,
    paymentMethod: posOrder.paymentMethod
  };

  res.status(200).json({
    success: true,
    receipt
  });
});

// Refund POS order
exports.refundPOSOrder = catchAsyncErrors(async (req, res, next) => {
  const { refundAmount, reason } = req.body;

  const posOrder = await POSOrder.findById(req.params.id);
  if (!posOrder) {
    return next(new ErrorHandler('POS Order not found', 404));
  }

  if (posOrder.orderStatus === 'refunded') {
    return next(new ErrorHandler('Order already refunded', 400));
  }

  posOrder.orderStatus = 'refunded';
  posOrder.paymentStatus = 'refunded';
  posOrder.notes = `${posOrder.notes || ''}\nRefund: ${refundAmount} - ${reason}`;

  // Restore inventory items to active status (set assignedQuantity to 0, availableQuantity to 1, status to active)
  for (const item of posOrder.items) {
    await Inventory.findByIdAndUpdate(
      item.inventoryId,
      {
        assignedQuantity: 0,
        availableQuantity: 1,
        status: 'active',
        lastUpdated: new Date()
      }
    );
  }

  await posOrder.save();

  res.status(200).json({
    success: true,
    posOrder
  });
});

// Delete POS order
exports.deletePOSOrder = catchAsyncErrors(async (req, res, next) => {
  const posOrder = await POSOrder.findById(req.params.id);
  if (!posOrder) {
    return next(new ErrorHandler('POS Order not found', 404));
  }

  // Restore inventory items to active status before deleting order
  for (const item of posOrder.items) {
    await Inventory.findByIdAndUpdate(
      item.inventoryId,
      {
        assignedQuantity: 0,
        availableQuantity: 1,
        status: 'active',
        lastUpdated: new Date()
      }
    );
  }

  // Delete the POS order
  await POSOrder.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'POS Order deleted successfully'
  });
});
