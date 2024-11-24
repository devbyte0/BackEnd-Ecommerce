const express = require('express');
const router = express.Router();
const couponController = require('../controller/CouponController');

// Create a new coupon
router.post('/coupons', couponController.createCoupon);

// Get all coupons
router.get('/coupons', couponController.getAllCoupons);

// Get a single coupon by ID
router.get('/coupons/:id', couponController.getCouponById);

// Update a coupon
router.put('/coupons/:id', couponController.updateCoupon);

// Delete a coupon
router.delete('/coupons/:id', couponController.deleteCoupon);

module.exports = router;
