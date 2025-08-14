const express = require("express");
const Coupon = require("../controller/CouponController");
const router = express.Router();


const { authenticateAdmin ,requireSuperAdmin } = require("../middleware/AdminAuthMiddleware");

// Read — any authenticated admin
router.get("/coupons",  Coupon.getAllCoupons);
router.get("/coupons/:id",  Coupon.getCouponById);

// Create and update — authenticated admin
router.post("/coupons", authenticateAdmin, Coupon.createCoupon);
router.put("/coupons/:id", authenticateAdmin, Coupon.updateCoupon);

// Delete — super admin only
router.delete("/coupons/:id", authenticateAdmin, requireSuperAdmin, Coupon.deleteCoupon);

module.exports = router;