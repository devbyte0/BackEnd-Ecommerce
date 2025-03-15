const express = require('express');
const router = express.Router();
const cartController = require('../controller/CartController');


// In cart.routes.js
router.patch('/cart/items/:id/update', cartController.updateQuantity);
// 📌 Add item to cart (POST /cart/items)
router.post('/cart/items', cartController.addToCart); // Add item with size and color

// 📌 Remove item from cart (DELETE /cart/items)
router.delete('/cart/items/delete/:userId/:itemId', cartController.removeFromCart); // Removed productId, size, color in URL params

// 📌 Get user's cart (GET /cart/:userId)
router.get('/cart/:userId', cartController.getCart);

// 📌 Apply coupon to cart (POST /cart/:userId/coupon)
router.post('/cart/:userId/coupon', cartController.applyCoupon); // Using userId in the URL

// 📌 Remove coupon from cart (DELETE /cart/:userId/coupon)
router.delete('/cart/:userId/coupon', cartController.removeCoupon); // Using userId in the URL

// 📌 Delete entire cart (DELETE /cart/:userId)
router.delete('/cart/:userId', cartController.deleteCart); // Using userId in the URL

// 📌 Sync cart items with backend (POST /cart/:userId/items/sync)
router.post('/cart/items/sync', cartController.syncCart); // Using userId in the URL

// ✅ Increase quantity
router.patch('/cart/items/:id/increase', cartController.increaseQuantity);

// ✅ Decrease quantity
router.patch('/cart/items/:id/decrease', cartController.decreaseQuantity);

module.exports = router;
