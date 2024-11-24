// models/Gender.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const genderSchema = new Schema({
  type: { type: String, required: true, unique: true }
}, { timestamps: true });

const Gender = mongoose.model('Gender', genderSchema);

module.exports = Gender;
