const mongoose = require('mongoose');

const PopupAdSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  linkUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("PopupAd", PopupAdSchema);
