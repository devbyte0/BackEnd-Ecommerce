const express = require('express');
const router = express.Router();
const sliderController = require('../controller/SliderImagesController');


const { authenticateAdmin} = require('../middleware/AdminAuthMiddleware');

// 📸 Admin-only routes
router.post('/createslides', authenticateAdmin, sliderController.createSlide);
router.get('/slides',  sliderController.getSlides);
router.put('/updateslides/:id', authenticateAdmin, sliderController.updateSlide);
router.delete('/deleteslides/:id', authenticateAdmin, sliderController.deleteSlide);

module.exports = router;