const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const variantSchema = new Schema({
  colorName: String,
  hexCode: String,
  size: String,
  stock: Number,
  price: Number,
  description: String,
  images: [String]
}, { timestamps: true });

const productSchema = new Schema({
  name: { type: String, required: true, unique: true },
  categories: [String],
  variants: [variantSchema],
  mainImage: { type: String, required: true }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;