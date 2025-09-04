const mongoose = require('mongoose');
const { Schema } = mongoose;

const shippingSchema = new Schema({
  name: { type: String, required: true, unique: true },
  charge: { type: Number, required: true, min: 0 },
  estimatedDays: { type: Number, default: 3, min: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Shipping', shippingSchema);


