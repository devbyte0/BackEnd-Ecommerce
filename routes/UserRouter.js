const express = require('express');
const router = express.Router();
const userController = require('../controller/UserController');
const authenticate = require('../middleware/UserAuthMiddleware');
const { authenticateAdmin } = require('../middleware/AdminAuthMiddleware');

// 🔐 Public Auth Routes
router.post('/register', userController.register);
router.post('/send-registration-otp', userController.sendRegistrationOTP);
router.post('/verify-otp-and-register', userController.verifyOTPAndRegister);
router.post('/resend-otp', userController.resendOTP);
router.post('/send-email-verification-otp', userController.sendEmailVerificationOTP);
router.post('/verify-email-with-otp', userController.verifyEmailWithOTP);
router.post('/verify-otp', userController.verifyOTP);
router.post('/send-forgot-password-otp', userController.sendForgotPasswordOTP);
router.post('/verify-forgot-password-otp', userController.verifyForgotPasswordOTP);
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);

// 🛡️ Protected Profile Routes
router.get('/user/profile', authenticate, userController.getProfile);
router.patch('/profile', authenticate, userController.updateProfile);
router.patch('/address', authenticate, userController.updateAddress);

// 🔐 Security Routes
router.put('/update-password', authenticate, userController.updatePassword);
router.post('/send-email-otp', authenticate, userController.sendEmailUpdateOTP);
router.put('/update-email', authenticate, userController.updateEmail);

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

// 👨‍💼 Admin Routes for User Management
router.get('/users', authenticateAdmin, userController.getAllUsers); // Get all users (admin only)
router.get('/users/:userId', authenticateAdmin, userController.getUserById); // Get specific user (admin only)
router.put('/users/:userId', authenticateAdmin, userController.updateUserByAdmin); // Update user (admin only)
router.delete('/users/:userId', authenticateAdmin, userController.deleteUserByAdmin); // Delete user (admin only)

module.exports = router;