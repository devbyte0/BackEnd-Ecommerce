# Inventory Tracking System for Orders

This document describes the implementation of inventory tracking for orders, similar to POS functionality.

## Overview

The inventory tracking system ensures that:

- Each order item is assigned specific inventory items
- Inventory items are marked as "out of stock" when assigned to orders
- Inventory items are released back to "active" status when orders are cancelled, refunded, or deleted
- Real-time inventory validation prevents overselling

## Key Components

### 1. Order Model Updates (`models/Order.js`)

Added inventory tracking fields to `orderItemSchema`:

```javascript
// 🔹 Inventory tracking
assignedInventoryItems: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Inventory'
}], // Array of inventory item IDs assigned to this order item
inventoryAssigned: { type: Boolean, default: false }, // Track if inventory has been assigned
```

### 2. Inventory Helper Functions (`utils/inventoryHelpers.js`)

#### `assignInventoryToOrder(orderItems, orderId)`

- Finds available inventory items for each order item
- Assigns inventory items to orders
- Updates inventory status to "out of stock"
- Returns assignment results with success/error status

#### `releaseInventoryFromOrder(orderItems, reason)`

- Releases assigned inventory items back to "active" status
- Resets assignedQuantity to 0 and availableQuantity to 1
- Used for cancellations, refunds, and deletions

#### `validateInventoryAvailability(orderItems)`

- Validates inventory availability before order creation
- Prevents overselling by checking stock levels
- Returns validation results with detailed error messages

#### `getInventoryStatusForOrderItems(orderItems)`

- Gets current inventory status for order items
- Returns available and total counts for each item

### 3. Order Controller Updates (`controller/OrderController.js`)

#### Order Creation

- Validates inventory availability before creating orders
- Assigns inventory items to order items
- Updates order items with assigned inventory information

#### Order Cancellation

- Releases inventory items when orders are cancelled
- Works for both user and admin cancellation

#### Order Refunds

- New `refundOrder` function specifically for handling refunds
- Releases inventory items when payment status changes to "refunded"
- Updates order status to "cancelled" and "inactive"

#### Order Deletion

- Releases inventory items before deleting orders
- Ensures no orphaned inventory assignments

#### Order Updates (Admin)

- Handles inventory changes when order items are modified
- Releases existing inventory and assigns new inventory for updated items

### 4. New API Endpoints

#### Refund Order

```
PATCH /api/orders/:orderId/refund
Authorization: Bearer <admin_token>
Body: { refundReason: "string" }
```

### 5. Frontend Updates (`Frontend-Ecommerce/src/pages/OrderAdmin.jsx`)

#### Inventory Status Display

- Shows inventory assignment status for each order item
- Displays number of assigned inventory items
- Visual indicators for assigned/not assigned status

#### Refund Functionality

- New "Refund Order" button for completed orders
- Prompts for refund reason
- Updates order status and releases inventory

## Workflow

### 1. Order Creation

```
1. Validate inventory availability
2. Assign inventory items to order
3. Update inventory status to "out of stock"
4. Save order with inventory assignments
```

### 2. Order Cancellation

```
1. Release assigned inventory items
2. Reset inventory status to "active"
3. Update order status to "cancelled"
4. Mark order as inactive
```

### 3. Order Refund

```
1. Validate order can be refunded (payment status = "completed")
2. Release assigned inventory items
3. Update payment status to "refunded"
4. Update order status to "cancelled"
5. Mark order as inactive
```

### 4. Order Deletion

```
1. Get order details before deletion
2. Release assigned inventory items
3. Delete order from database
```

### 5. Order Updates (Admin)

```
1. Release existing inventory assignments
2. Validate inventory availability for new items
3. Assign new inventory items
4. Update order with new inventory assignments
```

## Inventory Status Management

### Inventory Item States

- **Active**: Available for assignment (assignedQuantity: 0, availableQuantity: 1)
- **Out of Stock**: Assigned to an order (assignedQuantity: 1, availableQuantity: 0)

### Status Transitions

- **Assignment**: active → out_of_stock
- **Release**: out_of_stock → active

## Error Handling

### Inventory Validation Errors

- Insufficient stock for requested quantity
- Product variant not found in inventory
- Size not available for variant

### Assignment Errors

- No available inventory items
- Database transaction failures
- Concurrent assignment conflicts

### Release Errors

- Inventory items not found
- Database transaction failures
- Invalid inventory state

## Testing

Use the test script to verify the inventory tracking system:

```bash
node test-inventory-tracking.js
```

The test script validates:

1. Inventory item creation
2. Inventory availability validation
3. Inventory assignment to orders
4. Inventory status verification
5. Inventory release from orders
6. Final status verification

## Benefits

1. **Prevents Overselling**: Real-time inventory validation
2. **Accurate Stock Tracking**: Individual item tracking
3. **Automatic Inventory Management**: Automatic release on cancellations/refunds
4. **Audit Trail**: Complete inventory assignment history
5. **POS-like Functionality**: Similar to point-of-sale inventory management

## Future Enhancements

1. **Inventory Reservation**: Temporary holds for cart items
2. **Batch Operations**: Bulk inventory assignments
3. **Inventory Alerts**: Low stock notifications
4. **Inventory Reports**: Detailed inventory movement reports
5. **Multi-location Support**: Warehouse-specific inventory tracking
