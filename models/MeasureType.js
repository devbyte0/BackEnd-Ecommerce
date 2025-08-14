const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  measureType: {
    type: String,
    required: true,
  },
  unitName: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Unit', unitSchema);
