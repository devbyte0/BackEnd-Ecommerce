# Shipping System Documentation

## Overview

The shipping system has been updated to use a centralized Shipping model instead of product variant-specific shipping options. This provides better consistency and easier management of shipping methods.

## Components

### 1. Shipping Model (`models/Shipping.js`)

- **Fields:**
  - `name`: Shipping method name (e.g., "Standard Delivery")
  - `charge`: Shipping cost in BDT
  - `estimatedDays`: Estimated delivery time in days
  - `isActive`: Whether the shipping method is available for selection

### 2. Shipping Controller (`controller/ShippingController.js`)

- **Public Endpoints:**
  - `GET /api/shipping` - Get all active shipping methods
  - `GET /api/shipping/:id` - Get specific shipping method
- **Admin Endpoints:**
  - `GET /api/shipping/admin/all` - Get all shipping methods (including inactive)
  - `POST /api/shipping` - Create new shipping method
  - `PUT /api/shipping/:id` - Update shipping method
  - `DELETE /api/shipping/:id` - Delete shipping method

### 3. Order Integration

- Orders now store shipping information in the `shipping` field
- Shipping validation ensures only active shipping methods are used
- Shipping cost is automatically calculated and included in order totals

## API Endpoints

### Public Shipping Methods

```http
GET /api/shipping
```

Returns only active shipping methods sorted by charge (lowest first).

**Response:**

```json
[
  {
    "_id": "...",
    "name": "Free Shipping",
    "charge": 0,
    "estimatedDays": 5,
    "isActive": true
  },
  {
    "_id": "...",
    "name": "Standard Delivery",
    "charge": 60,
    "estimatedDays": 3,
    "isActive": true
  }
]
```

### Admin - All Shipping Methods

```http
GET /api/shipping/admin/all
```

Requires admin authentication. Returns all shipping methods including inactive ones.

## Frontend Integration

### Checkout Page (`Frontend-Ecommerce/src/pages/Checkout.jsx`)

- Fetches shipping options from `/api/shipping` on component mount
- Displays shipping methods with costs and estimated delivery times
- Allows users to select their preferred shipping method
- Sends selected shipping data with order creation

### Order Creation

The checkout process now sends shipping information in this format:

```javascript
{
  // ... other order data
  shipping: {
    name: "Standard Delivery",
    charge: 60,
    estimatedDays: 3
  },
  shippingCost: 60,
  grandTotal: 1060 // includes shipping cost
}
```

## Email Integration

All order emails now include shipping information:

- **Order Confirmation**: Shows shipping method, cost, and estimated delivery
- **Order Processing**: Includes shipping details
- **Order Shipped**: Displays shipping information
- **Order Delivered**: Shows delivery completion

## Sample Data

Run the sample data script to add default shipping methods:

```bash
cd BackEnd-Ecommerce
node scripts/addSampleShipping.js
```

This will add:

- Free Shipping (BDT0, 5 days)
- Standard Delivery (BDT60, 3 days)
- Express Delivery (BDT120, 1 day)
- Same Day Delivery (BDT200, 0 days)

## Benefits

1. **Centralized Management**: All shipping methods managed in one place
2. **Consistency**: Same shipping options across all products
3. **Flexibility**: Easy to add/remove/modify shipping methods
4. **Validation**: Ensures only active shipping methods are used
5. **Email Integration**: Shipping details included in all order notifications
6. **Admin Control**: Full CRUD operations for shipping methods

## Migration Notes

- Existing orders will continue to work with their current shipping data
- New orders will use the centralized shipping system
- Product variant shipping options are no longer used
- Shipping validation ensures data integrity
