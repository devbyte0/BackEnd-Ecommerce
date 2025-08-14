const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

exports.verifyAccessToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

exports.logout = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const user = await User.findById(req.user._id);

  user.accessTokens = user.accessTokens.filter(t => t.token !== token);
  await user.save();

  res.json({ message: 'Logged out successfully' });
};

exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(403).json({ message: 'Refresh token is required' });

    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const accessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '1h' });

    user.accessTokens = (user.accessTokens || []).filter(t => t.expiresAt > Date.now());
    user.accessTokens.push({
      token: accessToken,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await user.save();

    res.json({ accessToken });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, userName, password, phoneNumber } = req.body;

    if (!/^\+8801[3-9]\d{8}$/.test(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid Bangladeshi phone number format' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`.trim();
    const profileImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`;

    const user = await User.create({
      firstName,
      lastName,
      fullName,
      email,
      userName,
      password: hashedPassword,
      phoneNumber,
      imageUrl: profileImageUrl,
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;

    user.accessTokens = [{
      token: accessToken,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    }];

    await user.save();

    res.status(201).json({ message: 'User registered successfully', accessToken, refreshToken, user });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user', error });
  }
};


exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ message: 'Email/Phone and password are required' });
    }

    const user = await User.findOne({
      $or: [
        { email: emailOrPhone.toLowerCase() },
        { phoneNumber: emailOrPhone.trim() },
      ],
    });

    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    user.accessTokens = (user.accessTokens || []).filter(t => t.expiresAt > Date.now());
    user.accessTokens.push({
      token: accessToken,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await user.save();

    res.json({ message: 'Login successful', accessToken, refreshToken, user });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in', error });
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updatedData = { ...req.body };

    delete updatedData.password;
    delete updatedData.refreshToken;

    if (updatedData.phoneNumber && !/^\+8801[3-9]\d{8}$/.test(updatedData.phoneNumber)) {
      return res.status(400).json({ message: 'Invalid Bangladeshi phone number format' });
    }

    if (updatedData.email) {
      updatedData.email = updatedData.email.toLowerCase().trim();
    }

    if (updatedData.firstName || updatedData.lastName) {
      const nextFirst = updatedData.firstName || req.user.firstName;
      const nextLast = updatedData.lastName || req.user.lastName;
      const fullName = `${nextFirst} ${nextLast}`.trim();
      updatedData.fullName = fullName;
      updatedData.imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`;
    }

    const user = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
      runValidators: true,
    }).select('-password -refreshToken');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error });
  }
};



// 🧭 Update address
exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { address } = req.body;

    const user = await User.findByIdAndUpdate(userId, { address }, { new: true }).select('-password -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Address updated', user });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: 'Error updating address', error });
  }
};

// 💳 Replace all payment methods
exports.updatePaymentMethods = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentMethods } = req.body;

    const user = await User.findByIdAndUpdate(userId, { paymentMethods }, { new: true }).select('-password -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Payment methods updated', user });
  } catch (error) {
    console.error('Error updating payment methods:', error);
    res.status(500).json({ message: 'Error updating payment methods', error });
  }
};

// ➕ Add payment method
exports.addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const newMethod = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (newMethod.isDefault) {
      user.paymentMethods.forEach(pm => pm.isDefault = false);
    }

    user.paymentMethods.push(newMethod);
    await user.save();

    res.json({ message: 'Payment method added', user });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ message: 'Error adding payment method', error });
  }
};

// 🗑️ Remove payment method by ID
exports.removePaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { methodId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.paymentMethods = user.paymentMethods.filter(pm => pm._id.toString() !== methodId);
    await user.save();

    res.json({ message: 'Payment method removed', user });
  } catch (error) {
    console.error('Error removing payment method:', error);
    res.status(500).json({ message: 'Error removing payment method', error });
  }
};

// ⭐ Set default payment method
exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { methodId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.paymentMethods = user.paymentMethods.map(pm => ({
      ...pm.toObject(),
      isDefault: pm._id.toString() === methodId,
    }));

    await user.save();
    res.json({ message: 'Default payment method set', user });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({ message: 'Error setting default payment method', error });
  }
};

exports.editPaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { methodId } = req.params;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const methodIndex = user.paymentMethods.findIndex(pm => pm._id.toString() === methodId);
    if (methodIndex === -1) return res.status(404).json({ message: 'Payment method not found' });

    Object.assign(user.paymentMethods[methodIndex], updates);

    await user.save();
    res.json({ message: 'Payment method updated', user });
  } catch (error) {
    console.error('Error editing payment method:', error);
    res.status(500).json({ message: 'Error editing payment method', error });
  }
};

// ❌ Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error });
  }
};