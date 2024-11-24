const express = require('express');
const router = express.Router();
const sliderController = require('../controller/SliderImagesController');


// Routes
router.post('/createslides',sliderController.createSlide);
router.get('/slides', sliderController.getSlides);
router.put('/updateslides/:id', sliderController.updateSlide);
router.delete('/deleteslides/:id', sliderController.deleteSlide);

module.exports = router;
