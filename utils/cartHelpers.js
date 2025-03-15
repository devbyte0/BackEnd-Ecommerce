// utils/cartHelpers.js
const Coupon = require("../models/Coupon");

exports.recalculateCouponDiscount = async (cart) => {
  if (!cart.couponId) return;

  try {
    const coupon = await Coupon.findById(cart.couponId);
    if (!coupon || !coupon.isActive || new Date(coupon.expirationDate) < new Date()) {
      // Reset coupon and discounts if invalid
      cart.couponId = null;
      cart.discountAmount = 0;
      cart.items.forEach(item => item.discountApplied = 0);
      return;
    }

    // Recalculate discounts for applicable items
    let totalDiscount = 0;
    cart.items.forEach(item => {
      const applicableProduct = coupon.applicableProducts.find(
        ap => ap.product.toString() === item.productId.toString()
      );
      
      if (applicableProduct) {
        const applicableVariant = applicableProduct.variants.find(
          v => v.variantId.toString() === item.variantId.toString()
        );
        if (applicableVariant) {
          item.discountApplied = (item.price * item.quantity * coupon.discount) / 100;
          totalDiscount += item.discountApplied;
        } else {
          item.discountApplied = 0;
        }
      } else {
        item.discountApplied = 0;
      }
    });

    cart.discountAmount = totalDiscount;
  } catch (error) {
    console.error("Error recalculating coupon:", error);
    cart.couponId = null;
    cart.discountAmount = 0;
    cart.items.forEach(item => item.discountApplied = 0);
  }
};