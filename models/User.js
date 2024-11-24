const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'],
    },
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    refreshToken: { type: String },
    address: {
        street: { type: String, required: false, trim: true },
        city: { type: String, required: false, trim: true },
        state: { type: String, required: false, trim: true },
        zipCode: { type: String, required: false, trim: true },
        country: { type: String, required: false, trim: true },
    },
    paymentMethod: {
        cardNumber: { type: String, required: false, trim: true },
        expiryDate: { type: String, required: false, trim: true },
        cardHolderName: { type: String, required: false, trim: true },
    },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
