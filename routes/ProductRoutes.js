// routes.js
const express = require('express');
const router = express.Router();
const upload = require('../config/multerconfig');
const { addProduct, getProducts, updateProduct, deleteProduct, getSingleProduct ,deleteVariant} = require('../controller/productController');

router.post('/products', upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'images-0', maxCount: 10 },
  { name: 'images-1', maxCount: 10 },
  { name: 'images-2', maxCount: 10 },
  { name: 'images-3', maxCount: 10 },
  { name: 'images-4', maxCount: 10 },
]), addProduct);

router.get('/products', getProducts);
router.get('/products/:id', getSingleProduct);
router.put('/products/:id', upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'images-0', maxCount: 10 },
  { name: 'images-1', maxCount: 10 },
  { name: 'images-2', maxCount: 10 },
  { name: 'images-3', maxCount: 10 },
  { name: 'images-4', maxCount: 10 }
]), updateProduct);
router.delete('/products/:id', deleteProduct);
router.delete('/products/varients/:id', deleteProduct);


module.exports = router;
