# POS Inventory Management Implementation

## Overview

This implementation provides a complete POS (Point of Sale) inventory management system where each inventory item represents exactly 1 individual product unit. The system automatically manages inventory status when POS orders are created, refunded, or deleted.

## Key Features

### 1. Individual Item Tracking

- Each inventory item represents exactly 1 individual product
- `stockQuantity` is always 1 for each inventory item
- `availableQuantity` tracks if the item is available for sale (1 = available, 0 = assigned)
- `assignedQuantity` tracks if the item is assigned to an order (0 = not assigned, 1 = assigned)

### 2. Automatic Status Management

- **Active**: `availableQuantity: 1`, `assignedQuantity: 0`, `status: 'active'`
- **Out of Stock**: `availableQuantity: 0`, `assignedQuantity: 1`, `status: 'out_of_stock'`

### 3. POS Order Integration

- **When POS order is completed**: Items are automatically assigned
- **When POS order is refunded/deleted**: Items are automatically restored to available status
- **Auto-confirmation**: Payment and order status are automatically set to 'completed'

## Backend Changes

### 1. Inventory Model (`models/Inventory.js`)

- Updated pre-save middleware to handle individual item logic
- Status is determined by assignment rather than stock quantity
- `availableQuantity` is automatically calculated as `stockQuantity - assignedQuantity`

### 2. POS Controller (`controller/POSController.js`)

- **createPOSOrder**:

  - Auto-sets `paymentStatus: 'completed'` and `orderStatus: 'completed'`
  - Updates inventory items to `assignedQuantity: 1`, `availableQuantity: 0`, `status: 'out_of_stock'`
  - Checks `availableQuantity` instead of `stockQuantity` for availability

- **refundPOSOrder**:

  - Restores inventory items to `assignedQuantity: 0`, `availableQuantity: 1`, `status: 'active'`

- **deletePOSOrder**:

  - New function that restores inventory before deleting the order
  - Restores inventory items to `assignedQuantity: 0`, `availableQuantity: 1`, `status: 'active'`

- **scanBarcode**:

  - Checks `availableQuantity` instead of `stockQuantity`

- **getPOSStats**:
  - Shows low stock items based on `availableQuantity <= 0`

### 3. POS Routes (`routes/POSRoutes.js`)

- Added DELETE route for POS orders: `DELETE /api/pos/orders/:id`

### 4. Inventory Controller (`controller/InventoryController.js`)

- All inventory creation functions set `stockQuantity: 1`, `availableQuantity: 1`, `assignedQuantity: 0`
- Stats function calculates total available based on `availableQuantity`

## Frontend Changes

### 1. AdminPOS.jsx

- Updated stock display to show `availableQuantity` instead of `stockQuantity`
- Search results show "Available: X" instead of "Stock: X"

### 2. AdminPOSOrders.jsx

- Added delete functionality with confirmation dialog
- Added delete button in actions column
- Delete function calls the new DELETE API endpoint

### 3. POSContext.jsx

- Updated `addToCart` to check `availableQuantity` instead of `stockQuantity`

## API Endpoints

### POS Orders

- `POST /api/pos/orders` - Create POS order (auto-completes payment and order)
- `GET /api/pos/orders` - Get all POS orders
- `GET /api/pos/orders/:id` - Get single POS order
- `PUT /api/pos/orders/:id/status` - Update order status
- `POST /api/pos/orders/:id/refund` - Refund order (restores inventory)
- `DELETE /api/pos/orders/:id` - Delete order (restores inventory)

### Inventory

- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

## Workflow Examples

### 1. Creating a POS Order

1. Admin scans barcode or searches for product
2. System checks `availableQuantity > 0`
3. Item is added to cart
4. Admin completes sale
5. System automatically:
   - Sets `paymentStatus: 'completed'`
   - Sets `orderStatus: 'completed'`
   - Updates inventory: `assignedQuantity: 1`, `availableQuantity: 0`, `status: 'out_of_stock'`

### 2. Refunding a POS Order

1. Admin clicks refund button
2. System prompts for refund amount and reason
3. System automatically:
   - Sets `orderStatus: 'refunded'`
   - Sets `paymentStatus: 'refunded'`
   - Updates inventory: `assignedQuantity: 0`, `availableQuantity: 1`, `status: 'active'`

### 3. Deleting a POS Order

1. Admin clicks delete button
2. System shows confirmation dialog
3. System automatically:
   - Updates inventory: `assignedQuantity: 0`, `availableQuantity: 1`, `status: 'active'`
   - Deletes the POS order record

## Database Schema

### Inventory Item

```javascript
{
  productId: ObjectId,
  variantId: ObjectId,
  size: String,
  barcode: String,
  qrCode: String,
  stockQuantity: 1,        // Always 1 for individual items
  availableQuantity: 1,    // 1 = available, 0 = assigned
  assignedQuantity: 0,     // 0 = not assigned, 1 = assigned
  status: 'active',        // 'active' or 'out_of_stock'
  price: Number,
  discountPrice: Number,
  // ... other fields
}
```

### POS Order

```javascript
{
  orderNumber: String,
  customer: Object,
  items: [{
    inventoryId: ObjectId,
    productId: ObjectId,
    productName: String,
    variantInfo: Object,
    quantity: 1,           // Always 1 for individual items
    unitPrice: Number,
    totalPrice: Number
  }],
  subtotal: Number,
  tax: Number,
  discount: Number,
  total: Number,
  paymentMethod: String,
  paymentStatus: 'completed',  // Auto-set
  orderStatus: 'completed',    // Auto-set
  cashier: ObjectId,
  outlet: String,
  notes: String
}
```

## Testing

A test script is provided at `test-pos-inventory.js` that verifies:

- Inventory creation with correct initial values
- Inventory assignment (POS order completion)
- Inventory restoration (refund/delete)
- Pre-save middleware functionality
- Status updates

## Benefits

1. **Accurate Tracking**: Each individual product is tracked separately
2. **Automatic Management**: No manual inventory updates required
3. **Real-time Status**: Inventory status is always current
4. **Audit Trail**: Complete history of inventory movements
5. **Error Prevention**: System prevents overselling
6. **Easy Refunds**: Automatic inventory restoration on refunds

## Notes

- Each inventory item must have a unique barcode/QR code
- The system prevents adding items to cart if `availableQuantity <= 0`
- All inventory operations are atomic and consistent
- The pre-save middleware ensures data integrity
- Frontend displays show available quantity rather than total stock
