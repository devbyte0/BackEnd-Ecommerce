const mongoose = require('mongoose');

// 🔹 Individual item in the order
const orderItemSchema = new mongoose.Schema({
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  discountApplied: { type: Number, default: 0 },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  mainImage: { type: String, required: true },
  size: { type: String },
  color: { type: String },
  measureType: { type: String },
  unitName: { type: String },
});

// 🔹 Payment details, varies by method
const paymentDetailsSchema = new mongoose.Schema({
  trxId: { type: String, trim: true }, // For bKash/Nagad
  walletNumberMasked: { type: String, trim: true },
  gatewayTransactionId: { type: String, trim: true },
  codNote: { type: String, trim: true }, // Optional note for Cash on Delivery
}, { _id: false });

// 🔹 Shipping address
const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true },
}, { _id: false });

// 🔹 Main order schema
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  couponCode: { type: String, default: null }, // Changed from couponId (ObjectId) to couponCode (String)
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null }, // Keep both for backward compatibility
  shippingAddress: shippingAddressSchema,
  paymentMethod: {
    type: String,
    enum: ['bKash', 'Nagad', 'Cash on Delivery', 'bkash', 'nagad', 'cash'],
    required: true,
  },
  selectedPaymentMethod: {
    methodId: { type: String },
    type: { type: String },
    label: { type: String }
  },
  paymentDetails: { type: paymentDetailsSchema, default: {} },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);