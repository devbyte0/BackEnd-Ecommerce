const express = require('express');
const router = express.Router();
const cartController = require('../controller/CartController');

// Add item to cart
router.post('/cart', cartController.addToCart);

// Remove item from cart
router.delete('/cart', cartController.removeFromCart);

// Get user's cart by user ID
router.get('/cart/:userId', cartController.getCart);

// Apply coupon to cart
router.post('/cart/apply-coupon', cartController.applyCoupon);

// Remove coupon from cart
router.post('/cart/remove-coupon', cartController.removeCoupon);

// Delete entire cart
router.delete('/cart/:userId', cartController.deleteCart);

module.exports = router;

