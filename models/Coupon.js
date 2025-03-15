const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const applicableProductSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variants: [
    {
      variantId: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      sizes: {
        type: [String], // Array of sizes
        required: true,
      },
      color: {
        type: String,
        required: true,
      },
    },
  ],
});

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableProducts: [applicableProductSchema],
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);
module.exports = Coupon;