const express = require('express');
const router = express.Router();
const relatedProductController = require('../controller/RelatedProductController');


const {authenticateAdmin } = require('../middleware/AdminAuthMiddleware');

// 🔐 Admin-only operations
router.post('/createrelatedproduct', authenticateAdmin, relatedProductController.createRelatedProduct);
router.get('/relatedproduct', authenticateAdmin, relatedProductController.getAllRelatedProducts);
router.get('/relatedproduct/:id', authenticateAdmin, relatedProductController.getRelatedProductById);
router.put('/updaterelatedproduct/:id', authenticateAdmin, relatedProductController.updateRelatedProduct);
router.delete('/deleterelatedproduct/:id', authenticateAdmin,  relatedProductController.deleteRelatedProduct);

// 🌐 Public-facing route (e.g. used on product pages)
router.get('/relatedproductfront/:id', relatedProductController.getRelatedProductsByProductId);

module.exports = router;