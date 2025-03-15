const express = require("express");
const Coupon = require("../controller/CouponController");
const router = express.Router();

router.get("/coupons", Coupon.getAllCoupons);
router.get("/coupons/:id", Coupon.getCouponById);
router.post("/coupons", Coupon.createCoupon);
router.put("/coupons/:id", Coupon.updateCoupon);
router.delete("/coupons/:id", Coupon.deleteCoupon);

module.exports = router;
