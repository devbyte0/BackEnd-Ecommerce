const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId).select('-password -refreshToken');

    if (!admin) return res.status(401).json({ message: 'Admin not found' });

    // optional: check token still active in DB
    const isTokenValid = admin.accessTokens?.some(t => t.token === token && t.expiresAt > Date.now());
    if (!isTokenValid) {
      return res.status(401).json({ message: 'Access token is no longer valid or has been revoked' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 401 : 401;
    return res.status(code).json({ message: 'Invalid or expired token' });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.admin?.superAdmin) {
    return res.status(403).json({ message: 'Only super admin permitted' });
  }
  next();
};

module.exports = { authenticateAdmin, requireSuperAdmin };