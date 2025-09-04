const express = require('express');
const router = express.Router();
const cartController = require('../controller/CartController');
const authenticate = require('../middleware/UserAuthMiddleware'); // ✅ Your user JWT middleware
const { authenticateAdmin } = require('../middleware/AdminAuthMiddleware'); // ✅ Admin authentication middleware

// 🧺 Cart Item Operations (authenticated user)
router.post('/cart/items', authenticate, cartController.addToCart);
router.delete('/cart/items/delete/:userId/:itemId', authenticate, cartController.removeFromCart);
router.patch('/cart/items/:id/update', authenticate, cartController.updateQuantity);
router.post('/cart/items/sync', authenticate, cartController.syncCart);
router.patch('/cart/items/:id/increase', authenticate, cartController.increaseQuantity);
router.patch('/cart/items/:id/decrease', authenticate, cartController.decreaseQuantity);

// 🛒 Cart-level Operations (authenticated user)
router.get('/cart/:userId', authenticate, cartController.getCart);
router.post('/cart/:userId/coupon', authenticate, cartController.applyCoupon);
router.delete('/cart/:userId/coupon', authenticate, cartController.removeCoupon);
router.delete('/cart/:userId', authenticate, cartController.deleteCart);

// 👨‍💼 Admin Cart Operations (admin only)
router.get('/admin/cart/:userId', authenticateAdmin, cartController.getCart); // Admin can view any user's cart

module.exports = router;