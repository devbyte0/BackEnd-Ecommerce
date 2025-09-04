const express = require('express');
const router = express.Router();
const { create, list, listAll, get, update, remove } = require('../controller/ShippingController');
const { authenticateAdmin } = require('../middleware/AdminAuthMiddleware');

// Public list/get (only active shipping methods)
router.get('/shipping', list);
router.get('/shipping/:id', get);

// Admin protected CRUD
router.get('/shipping/admin/all', authenticateAdmin, listAll);
router.post('/shipping', authenticateAdmin, create);
router.put('/shipping/:id', authenticateAdmin, update);
router.delete('/shipping/:id', authenticateAdmin, remove);

module.exports = router;


