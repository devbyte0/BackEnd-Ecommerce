const express = require('express');
const router = express.Router();
const upload = require('../config/multerconfig');
const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getSingleProduct,
  deleteVariant
} = require('../controller/productController');


const { authenticateAdmin  } = require('../middleware/AdminAuthMiddleware');

// 📥 Create product — authenticated admin
router.post(
  '/products',
  authenticateAdmin,
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images-0', maxCount: 10 },
    { name: 'images-1', maxCount: 10 },
    { name: 'images-2', maxCount: 10 },
    { name: 'images-3', maxCount: 10 },
    { name: 'images-4', maxCount: 10 },
  ]),
  addProduct
);


router.get('/products',  getProducts);
router.get('/products/:id',  getSingleProduct);

// ✏️ Update product — authenticated admin
router.put(
  '/products/:id',
  authenticateAdmin,
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images-0', maxCount: 10 },
    { name: 'images-1', maxCount: 10 },
    { name: 'images-2', maxCount: 10 },
    { name: 'images-3', maxCount: 10 },
    { name: 'images-4', maxCount: 10 },
  ]),
  updateProduct
);

// 🗑️ Delete product — super admin only
router.delete('/products/:id', authenticateAdmin, deleteProduct);

// 🧹 Delete variant — super admin only
router.delete('/products/varients/:id', authenticateAdmin,  deleteVariant);

module.exports = router;