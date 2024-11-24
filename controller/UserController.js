// src/controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Secret key for JWT (Store this in an environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET; 

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

// src/controllers/userController.js
exports.refreshToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(403).json({ message: 'Refresh token is required' });

        // Verify the refresh token
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        if (!decoded) return res.status(403).json({ message: 'Invalid refresh token' });

        // Generate new access token
        const { accessToken } = generateTokens(decoded.userId);

        res.json({ accessToken });
    } catch (error) {
        console.error("Error refreshing token:", error);
        res.status(500).json({ message: 'Error refreshing token', error });
    }
};


exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, userName, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Set default image URL
        const profileImageUrl = `https://ui-avatars.com/api/?name=${firstName}+${lastName}`;

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            userName,
            password: hashedPassword,
            imageUrl: profileImageUrl,
        });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        // Update user’s refresh token in database
        user.refreshToken = refreshToken;
        await user.save();

        res.status(201).json({ message: 'User registered successfully', accessToken, refreshToken, user });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate new tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        // Update user’s refresh token in database
        user.refreshToken = refreshToken;
        await user.save();

        res.json({ message: 'Login successful', accessToken, refreshToken, user });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: 'Error logging in', error });
    }
};


// Update profile information
exports.updateProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const updatedData = req.body;

        const user = await User.findByIdAndUpdate(userId, updatedData, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error });
    }
};

// Add or update address
exports.updateAddress = async (req, res) => {
    try {
        const { userId } = req.params;
        const { address } = req.body;

        const user = await User.findByIdAndUpdate(userId, { address }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'Address updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating address', error });
    }
};

// Add or update payment method
exports.updatePaymentMethod = async (req, res) => {
    try {
        const { userId } = req.params;
        const { paymentMethod } = req.body;

        const user = await User.findByIdAndUpdate(userId, { paymentMethod }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'Payment method updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating payment method', error });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find and delete user by userId
        const user = await User.findByIdAndDelete(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
};
