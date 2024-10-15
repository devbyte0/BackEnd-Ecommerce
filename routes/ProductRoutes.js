const express = require('express');
const router = express.Router();
const upload = require('../config/multerconfig');
const { addProduct, getProducts, updateProduct, deleteProduct } = require('../controller/productController');

router.post('/products', upload.array('images', 12), addProduct);
router.get('/products', getProducts);
router.put('/products/:id', upload.array('images', 12), updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;