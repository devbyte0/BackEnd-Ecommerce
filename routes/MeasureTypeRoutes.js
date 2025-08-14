const express = require('express');
const router = express.Router();

const unitController = require('../controller/MeasureTypeController');

const { authenticateAdmin , requireSuperAdmin } = require('../middleware/AdminAuthMiddleware');

// Read — any authenticated admin
router.get('/units',  unitController.getUnits);
router.get('/units/:id',  unitController.getUnitById);

// Create and update — authenticated admin
router.post('/units', authenticateAdmin, unitController.createUnit);
router.put('/units/:id', authenticateAdmin, unitController.updateUnit);

// Delete — super admin only
router.delete('/units/:id', authenticateAdmin, requireSuperAdmin, unitController.deleteUnit);

module.exports = router;