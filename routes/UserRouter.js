// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controller/UserController');

// Register a new user
router.post('/register', userController.register);

// src/routes/userRoutes.js
router.post('/auth/refresh', userController.refreshToken);


// Login user
router.post('/login', userController.login);

// Update profile information
router.put('/profile/:userId', userController.updateProfile);

// Update address
router.put('/profile/address/:userId', userController.updateAddress);

// Update payment method
router.put('/profile/payment/:userId', userController.updatePaymentMethod);

router.delete('profile/:userId', userController.deleteUser);


module.exports = router;
