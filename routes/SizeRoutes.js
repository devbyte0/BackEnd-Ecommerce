// routes/size-routes.js
const express = require('express');
const router = express.Router();
const { addSize, getSizes, updateSize, deleteSize } = require('../controller/sizeController');

router.post('/sizes', addSize);
router.get('/sizes', getSizes);
router.put('/sizes/:id', updateSize);
router.delete('/sizes/:id', deleteSize);


module.exports = router;
