const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// 🔐 Utility to generate access and refresh tokens
const generateTokens = (adminId) => {
  const accessToken = jwt.sign({ adminId }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ adminId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!token) {
      return res.status(400).json({ valid: false, message: 'Token is required' });
    }

    // Verify refresh token
    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res.status(200).json({ valid: false, message: 'Invalid refresh token' });
      }
      
      // If you want to verify the access token too
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const accessToken = authHeader.split(' ')[1];
        try {
          jwt.verify(accessToken, process.env.JWT_SECRET);
          return res.status(200).json({ 
            valid: true,
            adminId: decoded.adminId 
          });
        } catch (accessTokenError) {
          return res.status(200).json({ 
            valid: false,
            message: 'Access token invalid but refresh token valid' 
          });
        }
      }
      
      res.status(200).json({ 
        valid: true,
        adminId: decoded.adminId 
      });
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Token verification failed', valid: false });
  }
};

// 🚪 Logout admin
exports.logout = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const admin = await Admin.findById(req.admin._id);

  admin.accessTokens = admin.accessTokens.filter(t => t.token !== token);
  await admin.save();

  res.json({ message: 'Logged out successfully' });
};

// 🔁 Refresh access token
exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(403).json({ message: 'Refresh token is required' });

    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    const admin = await Admin.findById(decoded.adminId);

    if (!admin || admin.refreshToken !== token) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const accessToken = jwt.sign({ adminId: decoded.adminId }, JWT_SECRET, { expiresIn: '1h' });

    admin.accessTokens = (admin.accessTokens || []).filter(t => t.expiresAt > Date.now());
    admin.accessTokens.push({
      token: accessToken,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await admin.save();

    res.json({ accessToken });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

// 🧾 Register a new admin (superAdmin only)
exports.register = async (req, res) => {
  try {
    if (!req.admin?.superAdmin) {
      return res.status(403).json({ message: 'Only super admin can register new admins' });
    }

    const { firstName, lastName, email, userName, password, superAdmin } = req.body;

    const existingAdmin = await Admin.findOne({ $or: [{ email }, { userName }] });
    if (existingAdmin) return res.status(400).json({ message: 'Admin already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const profileImageUrl = req.file?.path || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`;

    const admin = await Admin.create({
      firstName,
      lastName,
      email: email.trim(),
      userName: userName.trim().toLowerCase(),
      password: hashedPassword,
      imageUrl: profileImageUrl,
      superAdmin: !!superAdmin,
    });

    const { accessToken, refreshToken } = generateTokens(admin._id);
    admin.refreshToken = refreshToken;
    admin.accessTokens = [{
      token: accessToken,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    }];

    await admin.save();

    res.status(201).json({ message: 'Admin registered successfully', accessToken, refreshToken, admin });
  } catch (error) {
    console.error('Error registering admin:', error);
    res.status(500).json({ message: 'Registration failed', error });
  }
};

// 🔑 Admin login
exports.login = async (req, res) => {
  try {
    const { emailOrUserName, password } = req.body;

    if (!emailOrUserName || !password) {
      return res.status(400).json({ message: 'Email/UserName and password are required' });
    }

    const admin = await Admin.findOne({
      $or: [
        { email: emailOrUserName.toLowerCase() },
        { userName: emailOrUserName.trim().toLowerCase() },
      ],
    });

    if (!admin) return res.status(400).json({ message: 'Admin not found' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(admin._id);

    admin.refreshToken = refreshToken;
    admin.accessTokens = (admin.accessTokens || []).filter(t => t.expiresAt > Date.now());
    admin.accessTokens.push({
      token: accessToken,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await admin.save();

    res.json({ message: 'Login successful', accessToken, refreshToken, admin });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Login failed', error });
  }
};
// 🔐 Create admin (superAdmin only)
exports.createAdmin = async (req, res) => {
  try {
    if (!req.admin?.superAdmin) {
      return res.status(403).json({ message: 'Only super admin can create admins' });
    }

    const { firstName, lastName, email, userName, password, superAdmin } = req.body;

    const emailTrimmed = email?.trim();
    const userNameTrimmed = userName?.trim().toLowerCase();

    const emailExists = await Admin.findOne({ email: emailTrimmed });
    const userNameExists = await Admin.findOne({ userName: userNameTrimmed });
    if (emailExists || userNameExists) {
      return res.status(400).json({ message: `${userNameTrimmed} or ${emailTrimmed} is already taken` });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);
    const { accessToken, refreshToken } = generateTokens();

    const imageUrl = req.file?.path || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}`;

    const admin = await Admin.create({
      firstName: firstName?.trim().toUpperCase(),
      lastName: lastName?.trim().toUpperCase(),
      email: emailTrimmed,
      userName: userNameTrimmed,
      password: hashedPassword,
      imageUrl,
      superAdmin: !!superAdmin,
      refreshToken,
      accessTokens: [{
        token: accessToken,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      }],
    });

    res.status(201).json({ message: 'Admin created successfully', admin, accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✏️ Update admin (superAdmin only)
exports.updateAdmin = async (req, res) => {
  try {
    if (!req.admin?.superAdmin) {
      return res.status(403).json({ message: 'Only super admin can update admins' });
    }

    const id = req.params.id;
    const { firstName, lastName, email, userName, password, superAdmin } = req.body;

    const trimmedEmail = email?.trim();
    const trimmedUserName = userName?.trim().toLowerCase();

    const updates = {};

    if (userName) {
      const conflictUser = await Admin.findOne({ userName: trimmedUserName, _id: { $ne: id } });
      if (conflictUser) return res.status(409).json({ message: `${trimmedUserName} is already taken` });
      updates.userName = trimmedUserName;
    }

    if (email) {
      const conflictEmail = await Admin.findOne({ email: trimmedEmail, _id: { $ne: id } });
      if (conflictEmail) return res.status(409).json({ message: `${trimmedEmail} is already taken` });
      updates.email = trimmedEmail;
    }

    if (firstName) updates.firstName = firstName.trim().toUpperCase();
    if (lastName) updates.lastName = lastName.trim().toUpperCase();
    if (password) updates.password = await bcrypt.hash(password.trim(), saltRounds);
    if (req.file) updates.imageUrl = req.file.path;
    if (superAdmin !== undefined) updates.superAdmin = !!superAdmin;

    const updatedAdmin = await Admin.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedAdmin) return res.status(404).json({ message: 'Admin not found' });

    res.json({ message: 'Admin updated successfully', admin: updatedAdmin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🗑️ Delete admin (superAdmin only)
exports.deleteAdmin = async (req, res) => {
  try {
    if (!req.admin?.superAdmin) {
      return res.status(403).json({ message: 'Only super admin can delete admins' });
    }

    const { deleteAdminId } = req.body;
    const deleted = await Admin.findByIdAndDelete(deleteAdminId);
    if (!deleted) return res.status(404).json({ message: 'Admin not found' });

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔍 Get single admin (any authenticated admin)
exports.getSingleAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const admin = await Admin.findById(id).select('-password -refreshToken');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📃 Get all admins (superAdmin only)
exports.getAllAdmins = async (req, res) => {
  try {
    if (!req.admin?.superAdmin) {
      return res.status(403).json({ message: 'Only super admin can view all admins' });
    }

    const admins = await Admin.find().select('-password -refreshToken');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};