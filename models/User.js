const mongoose = require('mongoose');

// 🔹 Payment method base schema
const PaymentMethodBaseSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['bkash', 'nagad', 'card'],
    required: true,
  },
  label: { type: String, trim: true },
  isDefault: { type: Boolean, default: false },
}, {
  _id: true,
  timestamps: true,
  discriminatorKey: 'type',
});

// 🔸 Card method schema
const CardMethodSchema = new mongoose.Schema({
  brand: { type: String, trim: true },
  last4: { type: String, match: /^\d{4}$/ },
  expMonth: { type: Number, min: 1, max: 12 },
  expYear: { type: Number, min: 2024 },
  gatewayCustomerId: { type: String, trim: true },
  paymentMethodId: { type: String, trim: true },
});

// 🔸 bKash method schema
const BkashMethodSchema = new mongoose.Schema({
  walletNumberMasked: { type: String, trim: true },
  msisdn: { type: String, trim: true, select: false },
  verified: { type: Boolean, default: false },
  referenceId: { type: String, trim: true },
});

// 🔸 Nagad method schema
const NagadMethodSchema = new mongoose.Schema({
  walletNumberMasked: { type: String, trim: true },
  msisdn: { type: String, trim: true, select: false },
  verified: { type: Boolean, default: false },
  referenceId: { type: String, trim: true },
});

// 👤 Full user schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  fullName: { type: String, required: true, trim: true }, // Stored explicitly
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'],
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    match: [/^\+8801[3-9]\d{8}$/, 'Please enter a valid Bangladeshi phone number'],
  },
  userName: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  imageUrl: { type: String, required: true },
  refreshToken: { type: String },
  accessTokens: [{
  token: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  }],

  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true },
  },

  paymentMethods: [PaymentMethodBaseSchema],
}, { timestamps: true });

// 👨‍🔧 Attach embedded discriminators
userSchema.path('paymentMethods').discriminator('card', CardMethodSchema);
userSchema.path('paymentMethods').discriminator('bkash', BkashMethodSchema);
userSchema.path('paymentMethods').discriminator('nagad', NagadMethodSchema);

// 🛡️ Keep only one default method
userSchema.pre('save', function (next) {
  const defaults = (this.paymentMethods || []).filter(m => m.isDefault);
  if (defaults.length > 1) {
    const lastId = defaults[defaults.length - 1]._id.toString();
    this.paymentMethods = this.paymentMethods.map(m => ({
      ...m.toObject?.() || m,
      isDefault: m._id.toString() === lastId,
    }));
  }

  // 🔄 Sync fullName on every save
  this.fullName = `${this.firstName} ${this.lastName}`.trim();
  next();
});

// 🧠 Virtual fullName for computed output (optional redundancy)
userSchema.virtual('computedFullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// 🧾 Include virtuals in JSON and Object output
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);