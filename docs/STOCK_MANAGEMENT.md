# Stock Management System

## Overview

The stock management system automatically tracks product variant stock levels when inventory items are assigned to or removed from orders. This provides real-time stock visibility and prevents overselling.

## Features

### 1. Automatic Stock Tracking

- **Stock Deduction**: When inventory items are assigned to orders, stock is automatically decreased by 1
- **Stock Restoration**: When inventory items are removed from orders, stock is automatically increased by 1
- **Real-time Updates**: Stock changes are broadcast via Socket.IO to all connected clients

### 2. Stock Display

- **ProductView.jsx**: Shows stock levels for each size with color-coded indicators
  - 🟢 Green: In stock (5+ items)
  - 🟠 Orange: Low stock (1-4 items)
  - 🔴 Red: Out of stock (0 items)
- **ProductCrudPage.jsx**: Shows total stock across all variants with status indicators

### 3. Stock Data Structure

#### Product Variant Schema

```javascript
{
  sizes: [String],          // Array of available sizes
  stock: Number,            // Legacy field - total stock across all sizes
  stockBySize: [Number],    // Stock for each size in the sizes array
  // ... other fields
}
```

#### Stock Calculation

- `stockBySize[index]` corresponds to `sizes[index]`
- `stock` = sum of all `stockBySize` values (for backward compatibility)

## API Endpoints

### Get Stock Information

```
GET /api/products/:id/stock
```

Returns detailed stock information for all variants and sizes.

**Response:**

```json
{
  "productId": "...",
  "productName": "Product Name",
  "stockInfo": [
    {
      "variantId": "...",
      "colorName": "Red",
      "sizes": [
        { "size": "S", "stock": 5 },
        { "size": "M", "stock": 3 },
        { "size": "L", "stock": 0 }
      ],
      "totalStock": 8
    }
  ]
}
```

### Update Stock

```
PUT /api/products/:id/variants/:variantId/stock
```

Updates stock for a specific variant and size (Admin only).

**Request Body:**

```json
{
  "size": "M",
  "quantity": 10
}
```

**Response:**

```json
{
  "message": "Stock updated successfully",
  "updatedStock": {
    "size": "M",
    "quantity": 10,
    "totalStock": 15
  }
}
```

## Socket.IO Events

### Stock Update Event

```javascript
socket.on("stockUpdate", (stockData) => {
  // stockData contains:
  // - productId: Product ID
  // - variantId: Variant ID
  // - size: Size that was updated
  // - newStock: New stock quantity
  // - action: 'increase' or 'decrease'
});
```

## Implementation Details

### Backend Changes

1. **OrderController.js**

   - `assignInventoryToOrderItem`: Decreases stock when inventory is assigned
   - `removeInventoryFromOrderItem`: Increases stock when inventory is removed
   - Emits `stockUpdate` events via Socket.IO

2. **ProductController.js**

   - `updateStock`: Manual stock updates
   - `getStock`: Retrieve stock information

3. **Product.js Model**
   - Added `stockBySize` array field
   - Maintains backward compatibility with `stock` field

### Frontend Changes

1. **ProductView.jsx**

   - Shows stock levels for each size
   - Disables out-of-stock sizes
   - Color-coded stock indicators

2. **ProductCrudPage.jsx**

   - Shows total stock across all variants
   - Stock status indicators (In Stock, Low Stock, Out of Stock)

3. **OrderAdmin.jsx**
   - Listens for stock update events
   - Shows notifications when stock changes

## Migration

### Initialize Stock for Existing Products

Run the stock initialization script:

```bash
node scripts/initializeStock.js
```

This script:

- Initializes `stockBySize` arrays for existing products
- Distributes legacy `stock` values across sizes
- Ensures data consistency

## Usage Examples

### Manual Stock Update

```javascript
// Update stock for size M to 15 items
const response = await axios.put(
  `/api/products/${productId}/variants/${variantId}/stock`,
  { size: "M", quantity: 15 },
  { headers: { Authorization: `Bearer ${adminToken}` } }
);
```

### Get Stock Information

```javascript
// Get stock info for a product
const response = await axios.get(`/api/products/${productId}/stock`);
const stockInfo = response.data.stockInfo;
```

### Listen for Stock Updates

```javascript
// In your React component
useEffect(() => {
  socket.on("stockUpdate", (stockData) => {
    console.log(
      `Stock ${stockData.action}d for size ${stockData.size}: ${stockData.newStock}`
    );
    // Update your UI accordingly
  });
}, []);
```

## Best Practices

1. **Always check stock before allowing purchases**
2. **Use the stock update events to refresh UI in real-time**
3. **Initialize stock for existing products before using the system**
4. **Monitor stock levels and set up alerts for low stock**
5. **Use the manual stock update endpoint for inventory corrections**

## Troubleshooting

### Common Issues

1. **Stock not updating**: Check if `stockBySize` array is initialized
2. **Socket events not firing**: Verify Socket.IO connection and room membership
3. **Stock mismatch**: Run the initialization script to fix data consistency

### Debug Commands

```javascript
// Check product stock structure
const product = await Product.findById(productId);
console.log("Stock structure:", {
  legacyStock: product.variants[0].stock,
  stockBySize: product.variants[0].stockBySize,
  sizes: product.variants[0].sizes,
});
```
