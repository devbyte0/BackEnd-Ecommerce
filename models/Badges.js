// models/Badge.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const badgeSchema = new Schema({
  name: { type: String, required: true, unique: true },
  color: { type: String, required: true }
}, { timestamps: true });

const Badge = mongoose.model('Badge', badgeSchema);

module.exports = Badge;
