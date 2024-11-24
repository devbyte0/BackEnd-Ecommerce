const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const variantSchema = new Schema({
  colorName: String,
  hexCode: String,
  sizes: [String],  // Sizes as an array
  prices: [Number], // Prices as an array
  deliveryTimes: [Number], // Delivery times as an array
  stock: Number,
  description: String,
  discountPrices: [Number], // Discount prices as an array
  badgeNames: [String], // Badge names as an array
  badgeColors: [String], // Badge colors as an array
  images: [String]
}, { timestamps: true });

const productSchema = new Schema({
  name: { type: String, required: true, unique: true },
  categories: [String],
  mainPrice: Number,
  discountPrice: Number, // Discount price for the main product
  mainBadgeName: String, // Main badge name
  mainBadgeColor: String, // Main badge color
  gender: { type: String, enum: ['Male', 'Female', 'Unisex'], required: true }, // Gender field
  variants: [variantSchema],
  mainImage: { type: String, required: true }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
