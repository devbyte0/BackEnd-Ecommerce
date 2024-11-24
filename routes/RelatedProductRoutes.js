const express = require('express');
const router = express.Router();
const relatedProductController = require('../controller/RelatedProductController'); // Adjust the path if necessary


// Route to create a new related product entry
router.post('/createrelatedproduct', relatedProductController.createRelatedProduct);

// Route to get all related products
router.get('/relatedproduct', relatedProductController.getAllRelatedProducts);

router.get('/relatedproductfront/:id', relatedProductController.getRelatedProductsByProductId);

// Route to get a specific related product by ID
router.get('/relatedproduct/:id', relatedProductController.getRelatedProductById);

// Route to update a related product entry
router.put('/updaterelatedproduct/:id', relatedProductController.updateRelatedProduct);

// Route to delete a related product entry
router.delete('/deleterelatedproduct/:id', relatedProductController.deleteRelatedProduct);

module.exports = router;
