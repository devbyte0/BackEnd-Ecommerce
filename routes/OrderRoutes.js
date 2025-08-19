const express = require('express');
const router = express.Router();
const orderController = require('../controller/OrderController');

const { authenticateAdmin, requireSuperAdmin } = require('../middleware/AdminAuthMiddleware');
const authenticate = require('../middleware/UserAuthMiddleware');



// 🛒 Create order — authenticated user
router.post('/order', authenticate, orderController.createOrder);


router.get('/orders', authenticate , orderController.getOrders);

router.get('/allorders',authenticateAdmin, orderController.getAllOrders);

// 🕵️ Get single order — either
router.get('/orders/:orderId',   orderController.getOrderByOrderId);

// 🔄 Update status — admin only
router.patch('/orders/:orderId/status', authenticateAdmin, orderController.updateOrderStatus);

// ❌ Cancel order — either
router.patch('/orders/:orderId/cancel', authenticate ,  orderController.cancelOrder);

// ❌ Cancel order — either
router.patch('/orders/cancel/:orderId', authenticateAdmin ,  orderController.cancelOrderAdmin);

// 🗑️ Delete — only super admin
router.delete('/orders/:orderId', [authenticateAdmin, requireSuperAdmin], orderController.deleteOrder);

module.exports = router;