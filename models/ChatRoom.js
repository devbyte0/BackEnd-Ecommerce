// models/ChatRoom.js
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  senderType: { type: String, enum: ["customer", "admin"], required: true },
  text: { type: String, required: true },
  reaction: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const ChatRoomSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  isClosed: { type: Boolean, default: false },
  messages: [MessageSchema],
}, { timestamps: true });

module.exports = mongoose.model("ChatRoom", ChatRoomSchema);
