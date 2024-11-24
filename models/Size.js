// models/Size.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sizeSchema = new Schema({
  name: { type: String, required: true, unique: true }
}, { timestamps: true });

const Size = mongoose.model('Size', sizeSchema);

module.exports = Size;
