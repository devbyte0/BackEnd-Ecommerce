// routes/badge-routes.js
const express = require('express');
const router = express.Router();
const { addBadge, getBadges, updateBadge, deleteBadge } = require('../controller/BadgeController');

router.post('/badges', addBadge);
router.get('/badges', getBadges);
router.put('/badges/:id', updateBadge);
router.delete('/badges/:id', deleteBadge);

module.exports = router;
