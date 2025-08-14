const express = require('express');
const router = express.Router();
const { addBadge, getBadges, updateBadge, deleteBadge } = require('../controller/BadgeController');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/AdminAuthMiddleware');

// Read — any authenticated admin
router.get('/badges',  getBadges);

// Create and update — regular admin access
router.post('/badges', authenticateAdmin, addBadge);
router.put('/badges/:id', authenticateAdmin, updateBadge);

// Delete — super admin only
router.delete('/badges/:id', authenticateAdmin, requireSuperAdmin, deleteBadge);

module.exports = router;