const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');
const mongoose = require('mongoose');

// Socket.io instance (set from server.js)
let ioInstance = null;
module.exports.setSocketIO = (io) => {
  ioInstance = io;
};

// Helper function for inventory notifications
function notifyInventoryUpdate(inventory, eventType) {
  if (!ioInstance) return;

  // Emit low stock alert to dashboard
  if (inventory.availableQuantity <= 5) {
    ioInstance.to('dashboardRoom').emit('lowStockAlert', inventory);
  }
}

// Get all inventory items
exports.getAllInventory = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 10, search = '', status = '', productId = '' } = req.query;
  
  const query = {};
  
  if (search) {
    query.$or = [
      { barcode: { $regex: search, $options: 'i' } },
      { qrCode: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status) {
    query.status = status;
  }
  
  if (productId) {
    query.productId = productId;
  }
  
  const skip = (page - 1) * limit;
  
  const inventory = await Inventory.find(query)
    .populate('productId', 'name mainImage mainPrice variants')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  // Attach variant information to each inventory item
  const inventoryWithVariants = inventory.map(item => {
    const itemObj = item.toObject();
    if (itemObj.productId && itemObj.productId.variants) {
      const variant = itemObj.productId.variants.find(v => v._id.toString() === itemObj.variantId);
      if (variant) {
        itemObj.variantId = {
          _id: variant._id,
          colorName: variant.colorName,
          hexCode: variant.hexCode,
          images: variant.images,
          sizes: variant.sizes,
          prices: variant.prices,
          stock: variant.stock
        };
        // Add color information at the top level for easier access
        itemObj.colorName = variant.colorName;
        itemObj.hexCode = variant.hexCode;
        itemObj.variantImage = variant.images?.[0]?.url;
        // Also include the new fields from the inventory model
        itemObj.imageUri = itemObj.imageUri || variant.images?.[0]?.url;
        itemObj.color = itemObj.color || {
          name: variant.colorName || 'Default',
          hexCode: variant.hexCode || '#000000'
        };
      }
    }
    return itemObj;
  });
  
  const total = await Inventory.countDocuments(query);
  
  res.status(200).json({
    success: true,
    inventory: inventoryWithVariants,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// Get inventory by ID
exports.getInventoryById = catchAsyncErrors(async (req, res, next) => {
  const inventory = await Inventory.findById(req.params.id)
    .populate('productId', 'name mainImage mainPrice variants');
  
  if (!inventory) {
    return next(new ErrorHandler('Inventory not found', 404));
  }
  
  res.status(200).json({
    success: true,
    inventory
  });
});

// Create new inventory item
exports.createInventory = catchAsyncErrors(async (req, res, next) => {
  const { productId, variantId, size, stockQuantity, location, notes, price, discountPrice } = req.body;
  
  // Validate product and variant
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }
  
  const variant = product.variants.find(v => v._id.toString() === variantId);
  if (!variant) {
    return next(new ErrorHandler('Product variant not found', 404));
  }
  
  // Check if size exists in variant
  if (!variant.sizes.includes(size)) {
    return next(new ErrorHandler('Size not available for this variant', 400));
  }
  
  // Check if inventory already exists for this combination
  const existingInventory = await Inventory.findOne({
    productId,
    variantId,
    size
  });
  
  if (existingInventory) {
    return next(new ErrorHandler('Inventory already exists for this product variant and size', 400));
  }
  
  // Generate unique barcode and QR code
  const barcode = await Inventory.generateBarcode();
  const qrCode = await Inventory.generateQRCode();
  
  // Find the correct price and discount price for this specific size
  let variantPrice = price || product.mainPrice;
  let variantDiscountPrice = discountPrice || null;
  
  // If variant has prices array, find the matching price for this size
  if (variant.prices && variant.prices.length > 0) {
    const sizeIndex = variant.sizes.indexOf(size);
    if (sizeIndex !== -1 && sizeIndex < variant.prices.length) {
      variantPrice = variant.prices[sizeIndex];
    } else {
      variantPrice = variant.prices[0]; // Fallback to first price
    }
  }
  
  // If variant has discountPrices array, find the matching discount price for this size
  if (variant.discountPrices && variant.discountPrices.length > 0) {
    const sizeIndex = variant.sizes.indexOf(size);
    if (sizeIndex !== -1 && sizeIndex < variant.discountPrices.length) {
      variantDiscountPrice = variant.discountPrices[sizeIndex];
    }
  }
  
  const inventory = await Inventory.create({
    productId,
    variantId,
    size,
    barcode,
    qrCode,
    stockQuantity: 1, // Each inventory item represents exactly 1 individual item
    availableQuantity: 1,
    assignedQuantity: 0,
    price: variantPrice,
    discountPrice: variantDiscountPrice,
    imageUri: variant.images?.[0]?.url || variant.images?.[0] || null,
    color: {
      name: variant.colorName || 'Default',
      hexCode: variant.hexCode || '#000000'
    },
    location,
    notes
  });
  
  res.status(201).json({
    success: true,
    message: 'Inventory created successfully',
    inventory
  });
});

// Update inventory item
exports.updateInventory = catchAsyncErrors(async (req, res, next) => {
  const { stockQuantity, location, notes, status, price, discountPrice } = req.body;
  
  const inventory = await Inventory.findById(req.params.id);
  if (!inventory) {
    return next(new ErrorHandler('Inventory not found', 404));
  }
  
  // Update fields
  if (stockQuantity !== undefined) inventory.stockQuantity = stockQuantity;
  if (location) inventory.location = location;
  if (notes !== undefined) inventory.notes = notes;
  if (status) inventory.status = status;
  if (price !== undefined) inventory.price = price;
  if (discountPrice !== undefined) inventory.discountPrice = discountPrice;
  
  await inventory.save();
  
  res.status(200).json({
    success: true,
    message: 'Inventory updated successfully',
    inventory
  });
});

// Delete inventory item
exports.deleteInventory = catchAsyncErrors(async (req, res, next) => {
  const inventory = await Inventory.findById(req.params.id);
  if (!inventory) {
    return next(new ErrorHandler('Inventory not found', 404));
  }
  
  await Inventory.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    success: true,
    message: 'Inventory deleted successfully'
  });
});

// Scan barcode/QR code
exports.scanCode = catchAsyncErrors(async (req, res, next) => {
  const { code } = req.body;
  
  const inventory = await Inventory.findOne({
    $or: [
      { barcode: code },
      { qrCode: code }
    ]
  }).populate('productId', 'name mainImage mainPrice variants');
  
  if (!inventory) {
    return next(new ErrorHandler('Code not found', 404));
  }
  
  res.status(200).json({
    success: true,
    inventory
  });
});

// Scan barcode/QR code via GET request (for frontend scanning)
exports.scanInventoryByCode = catchAsyncErrors(async (req, res, next) => {
  const { code } = req.query;
  
  if (!code) {
    return next(new ErrorHandler('Code parameter is required', 400));
  }
  
  const inventory = await Inventory.findOne({
    $or: [
      { barcode: code },
      { qrCode: code }
    ]
  }).populate('productId', 'name mainImage mainPrice variants');
  
  if (!inventory) {
    return next(new ErrorHandler('Inventory item not found', 404));
  }
  
  res.status(200).json({
    success: true,
    inventory
  });
});

// Get inventory statistics
exports.getInventoryStats = catchAsyncErrors(async (req, res, next) => {
  const totalItems = await Inventory.countDocuments();
  const activeItems = await Inventory.countDocuments({ status: 'active' });
  const outOfStockItems = await Inventory.countDocuments({ status: 'out_of_stock' });
  
  // Calculate total available stock (sum of availableQuantity)
  const totalAvailable = await Inventory.aggregate([
    { $group: { _id: null, total: { $sum: '$availableQuantity' } } }
  ]);
  
  res.status(200).json({
    success: true,
    stats: {
      totalItems,
      activeItems,
      outOfStockItems,
      totalAvailable: totalAvailable[0]?.total || 0
    }
  });
});

// Bulk create inventory from product variants
exports.bulkCreateFromProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId, stockQuantities } = req.body;
  
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }
  
  const createdInventory = [];
  
  for (const variant of product.variants) {
    for (const size of variant.sizes) {
      const quantity = stockQuantities[variant._id]?.[size] || 0;
      
      if (quantity > 0) {
        // Check if inventory already exists
        const existing = await Inventory.findOne({
          productId,
          variantId: variant._id,
          size
        });
        
        if (!existing) {
          const barcode = await Inventory.generateBarcode();
          const qrCode = await Inventory.generateQRCode();
          
                  const inventory = await Inventory.create({
          productId,
          variantId: variant._id,
          size,
          barcode,
          qrCode,
          stockQuantity: 1,
          availableQuantity: 1,
          assignedQuantity: 0,
          price: variant.prices?.[0] || product.mainPrice,
          imageUri: variant.images?.[0]?.url || variant.images?.[0] || null,
          color: {
            name: variant.colorName || 'Default',
            hexCode: variant.hexCode || '#000000'
          }
        });
          
          createdInventory.push(inventory);
        }
      }
    }
  }
  
  res.status(201).json({
    success: true,
    message: `${createdInventory.length} inventory items created successfully`,
    createdInventory
  });
});

// Bulk create inventory items
exports.bulkCreate = catchAsyncErrors(async (req, res, next) => {
  const { inventoryItems } = req.body;
  
  if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
    return next(new ErrorHandler('Invalid inventory items data', 400));
  }
  
  const createdInventory = [];
  const errors = [];
  
  for (const item of inventoryItems) {
    try {
      const { productId, variantId, size, stockQuantity, location, notes, price, discountPrice } = item;
      
      // Validate product and variant
      const product = await Product.findById(productId);
      if (!product) {
        errors.push(`Product not found for item: ${productId}`);
        continue;
      }
      
      const variant = product.variants.find(v => v._id.toString() === variantId);
      if (!variant) {
        errors.push(`Variant not found for product: ${productId}, variant: ${variantId}`);
        continue;
      }
      
      // Check if size exists in variant
      if (!variant.sizes.includes(size)) {
        errors.push(`Size ${size} not available for variant: ${variantId}`);
        continue;
      }
      
      // Check if inventory already exists for this combination
      const existingInventory = await Inventory.findOne({
        productId,
        variantId,
        size
      });
      
      if (existingInventory) {
        errors.push(`Inventory already exists for product: ${productId}, variant: ${variantId}, size: ${size}`);
        continue;
      }
      
      // Create individual inventory items for each unit
      const quantity = stockQuantity || 0;
      for (let i = 0; i < quantity; i++) {
        // Generate unique barcode and QR code for each item
        const barcode = await Inventory.generateBarcode();
        const qrCode = await Inventory.generateQRCode();
        
        // Find the correct price and discount price for this specific size
        let variantPrice = price || product.mainPrice;
        let variantDiscountPrice = discountPrice || null;
        
        // If variant has prices array, find the matching price for this size
        if (variant.prices && variant.prices.length > 0) {
          const sizeIndex = variant.sizes.indexOf(size);
          if (sizeIndex !== -1 && sizeIndex < variant.prices.length) {
            variantPrice = variant.prices[sizeIndex];
          } else {
            variantPrice = variant.prices[0]; // Fallback to first price
          }
        }
        
        // If variant has discountPrices array, find the matching discount price for this size
        if (variant.discountPrices && variant.discountPrices.length > 0) {
          const sizeIndex = variant.sizes.indexOf(size);
          if (sizeIndex !== -1 && sizeIndex < variant.discountPrices.length) {
            variantDiscountPrice = variant.discountPrices[sizeIndex];
          }
        }
        
        const inventory = await Inventory.create({
          productId,
          variantId,
          size,
          barcode,
          qrCode,
          stockQuantity: 1, // Each item represents 1 unit
          price: variantPrice,
          discountPrice: variantDiscountPrice,
          imageUri: variant.images?.[0]?.url || variant.images?.[0] || null,
          color: {
            name: variant.colorName || 'Default',
            hexCode: variant.hexCode || '#000000'
          },
          location: location || {
            warehouse: 'Main Warehouse',
            shelf: '',
            section: ''
          },
          notes: notes || ''
        });
        
        createdInventory.push(inventory);
      }
    } catch (error) {
      errors.push(`Error creating inventory item: ${error.message}`);
    }
  }
  
  res.status(201).json({
    success: true,
    message: `${createdInventory.length} individual inventory items created successfully`,
    createdInventory,
    errors: errors.length > 0 ? errors : undefined
  });
});

// Generate barcode/QR code for printing
exports.generatePrintCodes = catchAsyncErrors(async (req, res, next) => {
  const { inventoryIds, quantities } = req.body;
  
  const inventory = await Inventory.find({
    _id: { $in: inventoryIds }
  }).populate('productId', 'name mainPrice variants');
  
  if (inventory.length === 0) {
    return next(new ErrorHandler('No inventory items found', 404));
  }
  
  const printData = inventory.map(item => {
    const quantity = quantities?.[item._id] || 1; // Default to 1 since each item is individual
    const codes = [];
    
    // Get variant information
    let variantInfo = null;
    if (item.productId && item.productId.variants) {
      const variant = item.productId.variants.find(v => v._id.toString() === item.variantId);
      if (variant) {
        variantInfo = {
          colorName: variant.colorName,
          hexCode: variant.hexCode,
          images: variant.images,
          sizes: variant.sizes,
          prices: variant.prices
        };
      }
    }
    
    // Generate codes for this individual item
    for (let i = 0; i < quantity; i++) {
      codes.push({
        id: item._id,
        barcode: item.barcode,
        qrCode: item.qrCode,
        productName: item.productId.name,
        price: item.productId.mainPrice,
        size: item.size,
        stockQuantity: item.stockQuantity,
        variantInfo: variantInfo,
        colorName: variantInfo?.colorName || 'Unknown',
        hexCode: variantInfo?.hexCode || '#000000',
        variantImage: variantInfo?.images?.[0]?.url || null
      });
    }
    
    return {
      item,
      codes,
      totalCodes: quantity
    };
  });
  
  res.status(200).json({
    success: true,
    printData,
    totalCodes: printData.reduce((sum, item) => sum + item.totalCodes, 0)
  });
});

// Get multiple inventory items by IDs (for batch viewing)
exports.getInventoryBatch = catchAsyncErrors(async (req, res, next) => {
  const { ids } = req.query;
  
  if (!ids) {
    return next(new ErrorHandler('Inventory IDs are required', 400));
  }

  const inventoryIds = ids.split(',').map(id => id.trim()).filter(Boolean);
  
  if (inventoryIds.length === 0) {
    return next(new ErrorHandler('No valid inventory IDs provided', 400));
  }

  // Validate that all IDs are valid ObjectIds
  const validIds = inventoryIds.filter(id => mongoose.Types.ObjectId.isValid(id));
  
  if (validIds.length !== inventoryIds.length) {
    return next(new ErrorHandler('Some inventory IDs are invalid', 400));
  }

  const inventory = await Inventory.find({
    _id: { $in: validIds }
  }).populate('productId', 'name mainImage mainPrice variants');

  if (inventory.length === 0) {
    return next(new ErrorHandler('No inventory items found', 404));
  }

  res.status(200).json({
    success: true,
    inventory: inventory.length === 1 ? inventory[0] : inventory
  });
});
