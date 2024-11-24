const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  discount: {
    type: Number,
    required: true
  },
  expirationDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product' // Assuming your product model is named 'Product'
  }]
}, {
  timestamps: true
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
