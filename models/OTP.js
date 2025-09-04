const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  type: {
    type: String,
    enum: ['registration', 'password_reset', 'email_change', 'email_verification'],
    default: 'registration'
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired OTPs
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  }
}, { timestamps: true });

// Index for quick lookups
otpSchema.index({ email: 1, type: 1, isUsed: 1 });

module.exports = mongoose.model('OTP', otpSchema);
