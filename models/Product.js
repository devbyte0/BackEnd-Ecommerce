const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const variantSchema = new Schema({
  colorName: String,
  hexCode: String,
  sizes: [String],          // Sizes as an array
  prices: [Number],         // Prices as an array
  deliveryTimes: [Number],  // Delivery times as an array
  stock: Number,
  description: String,
  discountPrices: [Number], // Discount prices as an array
  badgeNames: [String],     // Badge names as an array
  badgeColors: [String],    // Badge colors as an array
  images: [String],
  measureType: { type: String, required: true },
  unitName: { type: String, required: true }
}, { timestamps: true });

const productSchema = new Schema({
  name: { type: String, required: true, unique: true },
  categories: [String],
  mainPrice: Number,
  discountPrice: Number,
  mainBadgeName: String,
  mainBadgeColor: String,
  gender: { type: String, enum: ['Male', 'Female', 'Unisex'], required: true },
  measureType: { type: String, required: true },
  unitName: { type: String, required: true },
  variants: [variantSchema],
  mainImage: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
