const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const aiChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  messages: [aiMessageSchema],
}, { timestamps: true });

module.exports = mongoose.model('AIChat', aiChatSchema);
