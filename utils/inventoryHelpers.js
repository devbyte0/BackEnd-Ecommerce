const Inventory = require('../models/Inventory');
const mongoose = require('mongoose');

/**
 * Assign inventory items to an order
 * @param {Array} orderItems - Array of order items with productId, variantId, size, quantity
 * @param {mongoose.Types.ObjectId} orderId - The order ID for tracking
 * @returns {Object} - { success: boolean, assignedItems: Array, errors: Array }
 */
async function assignInventoryToOrder(orderItems, orderId) {
  const assignedItems = [];
  const errors = [];
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      for (const item of orderItems) {
        const { productId, variantId, size, quantity } = item;
        
        // Find available inventory items for this product variant and size
        const availableInventory = await Inventory.find({
          productId,
          variantId,
          size,
          status: 'active',
          assignedQuantity: 0
        }).limit(quantity).session(session);
        
        if (availableInventory.length < quantity) {
          errors.push(`Insufficient inventory for ${item.name} (${size}). Available: ${availableInventory.length}, Required: ${quantity}`);
          continue;
        }
        
        // Assign inventory items
        const inventoryIds = [];
        for (const inventoryItem of availableInventory) {
          inventoryItem.assignedQuantity = 1;
          inventoryItem.status = 'out_of_stock';
          inventoryItem.availableQuantity = 0;
          await inventoryItem.save({ session });
          inventoryIds.push(inventoryItem._id);
        }
        
        assignedItems.push({
          orderItem: item,
          assignedInventoryIds: inventoryIds,
          quantity: quantity
        });
      }
    });
    
    return {
      success: errors.length === 0,
      assignedItems,
      errors
    };
  } catch (error) {
    console.error('Error assigning inventory:', error);
    return {
      success: false,
      assignedItems: [],
      errors: [error.message]
    };
  } finally {
    session.endSession();
  }
}

/**
 * Release inventory items from an order (for cancellation, refund, etc.)
 * @param {Array} orderItems - Array of order items with assignedInventoryItems
 * @param {string} reason - Reason for release (cancelled, refunded, etc.)
 * @returns {Object} - { success: boolean, releasedItems: Array, errors: Array }
 */
async function releaseInventoryFromOrder(orderItems, reason = 'order_cancelled') {
  const releasedItems = [];
  const errors = [];
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      for (const item of orderItems) {
        if (!item.assignedInventoryItems || item.assignedInventoryItems.length === 0) {
          continue; // No inventory assigned to this item
        }
        
        // Release each assigned inventory item
        for (const inventoryId of item.assignedInventoryItems) {
          const inventoryItem = await Inventory.findById(inventoryId).session(session);
          
          if (!inventoryItem) {
            errors.push(`Inventory item ${inventoryId} not found`);
            continue;
          }
          
          // Reset inventory item
          inventoryItem.assignedQuantity = 0;
          inventoryItem.status = 'active';
          inventoryItem.availableQuantity = 1;
          await inventoryItem.save({ session });
          
          releasedItems.push({
            inventoryId: inventoryItem._id,
            productId: inventoryItem.productId,
            variantId: inventoryItem.variantId,
            size: inventoryItem.size
          });
        }
      }
    });
    
    return {
      success: errors.length === 0,
      releasedItems,
      errors
    };
  } catch (error) {
    console.error('Error releasing inventory:', error);
    return {
      success: false,
      releasedItems: [],
      errors: [error.message]
    };
  } finally {
    session.endSession();
  }
}

/**
 * Get inventory status for order items
 * @param {Array} orderItems - Array of order items
 * @returns {Object} - Inventory status for each item
 */
async function getInventoryStatusForOrderItems(orderItems) {
  const status = {};
  
  for (const item of orderItems) {
    const { productId, variantId, size } = item;
    
    // Count available inventory
    const availableCount = await Inventory.countDocuments({
      productId,
      variantId,
      size,
      status: 'active',
      assignedQuantity: 0
    });
    
    // Count total inventory
    const totalCount = await Inventory.countDocuments({
      productId,
      variantId,
      size
    });
    
    status[`${productId}-${variantId}-${size}`] = {
      available: availableCount,
      total: totalCount,
      inStock: availableCount > 0
    };
  }
  
  return status;
}

/**
 * Validate inventory availability before order creation
 * @param {Array} orderItems - Array of order items
 * @returns {Object} - { valid: boolean, errors: Array, inventoryStatus: Object }
 */
async function validateInventoryAvailability(orderItems) {
  const errors = [];
  const inventoryStatus = await getInventoryStatusForOrderItems(orderItems);
  
  for (const item of orderItems) {
    const { productId, variantId, size, quantity, name } = item;
    const key = `${productId}-${variantId}-${size}`;
    const status = inventoryStatus[key];
    
    if (!status.inStock) {
      errors.push(`${name} (${size}) is out of stock`);
    } else if (status.available < quantity) {
      errors.push(`Insufficient stock for ${name} (${size}). Available: ${status.available}, Required: ${quantity}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    inventoryStatus
  };
}

module.exports = {
  assignInventoryToOrder,
  releaseInventoryFromOrder,
  getInventoryStatusForOrderItems,
  validateInventoryAvailability
};
