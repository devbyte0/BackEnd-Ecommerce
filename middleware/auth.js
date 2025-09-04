const { authenticateAdmin } = require('./AdminAuthMiddleware');
const { authenticateUser } = require('./UserAuthMiddleware');

// Export with the names expected by the contact routes
const isAuthenticatedAdmin = authenticateAdmin;
const isAuthenticatedUser = authenticateUser;

module.exports = {
  isAuthenticatedAdmin,
  isAuthenticatedUser,
  authenticateAdmin,
  authenticateUser
};
