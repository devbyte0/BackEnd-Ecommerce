const express = require('express');
const router = express.Router();
const { getDashboardStats, getRealTimeUpdates, getChartData } = require('../controller/DashboardController');
const { authenticateAdmin } = require('../middleware/AdminAuthMiddleware');

// Dashboard statistics routes (admin only)
router.get('/stats', authenticateAdmin, getDashboardStats);
router.get('/realtime', authenticateAdmin, getRealTimeUpdates);
router.get('/charts', authenticateAdmin, getChartData);

module.exports = router;
