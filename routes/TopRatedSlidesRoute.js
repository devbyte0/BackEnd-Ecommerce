const express = require('express');
const router = express.Router();
const topRatedSlidesController = require('../controller/TopRatedSlidesController');

const { authenticateAdmin} = require('../middleware/AdminAuthMiddleware');

// 📸 Admin-only routes
router.post('/createtopratedslides', authenticateAdmin, topRatedSlidesController.createTopRatedSlide);
router.get('/topratedslides', topRatedSlidesController.getTopRatedSlides);
router.put('/updatetopratedslides/:id', authenticateAdmin, topRatedSlidesController.updateTopRatedSlide);
router.delete('/deletetopratedslides/:id', authenticateAdmin, topRatedSlidesController.deleteTopRatedSlide);

module.exports = router;
