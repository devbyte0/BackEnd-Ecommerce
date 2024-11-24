// routes/color-routes.js
const express = require('express');
const router = express.Router();
const { addColor, getColors, updateColor, deleteColor } = require('../controller/colorController');

router.post('/colors', addColor);
router.get('/colors', getColors);
router.put('/colors/:id', updateColor);
router.delete('/colors/:id', deleteColor);

module.exports = router;
