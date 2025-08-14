const express = require('express');
const router = express.Router();
const userController = require('../controller/UserController');
const authenticate = require('../middleware/UserAuthMiddleware');

// 🔐 Public Auth Routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);

// 🛡️ Protected Profile Routes
router.get('/user/profile', authenticate, userController.getProfile);
router.patch('/profile', authenticate, userController.updateProfile);
router.patch('/address', authenticate, userController.updateAddress);

// 💳 Payment Method Routes
router.patch('/payment-methods', authenticate, userController.updatePaymentMethods); // Replace all
router.post('/payment-methods', authenticate, userController.addPaymentMethod);       // Add one
router.delete('/payment-methods/:methodId', authenticate, userController.removePaymentMethod); // Delete one
router.patch('/payment-methods/:methodId/default', authenticate, userController.setDefaultPaymentMethod); // Set default
router.patch('/payment-methods/:methodId', authenticate, userController.editPaymentMethod); // Edit one

// ❌ Account Management
router.delete('/profile', authenticate, userController.deleteUser);

// 🚪 Optional: Logout (token revocation)
 router.post('/logout', authenticate, userController.logout);

module.exports = router;