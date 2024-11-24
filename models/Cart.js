const mongoose = require('mongoose');

// Cart Item Schema
const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Assuming you have a Product model
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  mainImage: {
    type: String,
    ref:'Product', // URL or path to the product image
    required: true
  }
});

// Cart Schema
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model
    required: true,
    unique: true // One cart per user
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  coupon: {
    code: String,
    discount: Number, // Coupon discount percentage
    applied: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
