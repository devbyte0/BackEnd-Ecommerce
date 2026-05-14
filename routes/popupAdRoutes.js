const express = require('express');
const router = express.Router();
const popupAdController = require('../controller/popupAdController');
const { authenticateAdmin } = require('../middleware/AdminAuthMiddleware');

router.get('/admin/popup-ads', authenticateAdmin, popupAdController.getAll);
router.post('/admin/popup-ads', authenticateAdmin, popupAdController.create);
router.put('/admin/popup-ads/:id', authenticateAdmin, popupAdController.update);
router.delete('/admin/popup-ads/:id', authenticateAdmin, popupAdController.remove);

router.get('/popup-ads/active', popupAdController.getActive);

module.exports = router;
