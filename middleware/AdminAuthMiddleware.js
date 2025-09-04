const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateAdmin = async (req, res, next) => {
  console.log('🔐 AdminAuthMiddleware: Starting authentication...');
  
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('❌ AdminAuthMiddleware: No Bearer token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('🔐 AdminAuthMiddleware: Token received:', token.substring(0, 20) + '...');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('🔐 AdminAuthMiddleware: Token decoded successfully:', { adminId: decoded.adminId });
    
    const admin = await Admin.findById(decoded.adminId).select('-password -refreshToken');
    console.log('🔐 AdminAuthMiddleware: Admin found:', admin ? 'Yes' : 'No');

    if (!admin) {
      console.log('❌ AdminAuthMiddleware: Admin not found in database');
      return res.status(401).json({ message: 'Admin not found' });
    }

    // optional: check token still active in DB
    const isTokenValid = admin.accessTokens?.some(t => t.token === token && t.expiresAt > Date.now());
    console.log('🔐 AdminAuthMiddleware: Token validation:', { 
      hasAccessTokens: !!admin.accessTokens, 
      tokenCount: admin.accessTokens?.length || 0,
      isTokenValid 
    });
    
    if (!isTokenValid) {
      console.log('❌ AdminAuthMiddleware: Token is not valid or has been revoked');
      return res.status(401).json({ message: 'Access token is no longer valid or has been revoked' });
    }

    console.log('✅ AdminAuthMiddleware: Authentication successful for admin:', admin.email);
    req.admin = admin;
    next();
  } catch (err) {
    console.error('❌ AdminAuthMiddleware: Error during authentication:', err.message);
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