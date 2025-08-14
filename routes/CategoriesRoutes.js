const express = require('express');
const router = express.Router();
const {
  addCategory,
  getCategories,
  updateCategory,
  deleteCategory
} = require('../controller/CategoriesController');


const {authenticateAdmin, requireSuperAdmin } = require('../middleware/AdminAuthMiddleware');

// Read — any authenticated admin
router.get('/categories',  getCategories);

// Create and update — authenticated admin
router.post('/categories', authenticateAdmin, addCategory);
router.put('/categories/:id', authenticateAdmin, updateCategory);

// Delete — super admin only
router.delete('/categories/:id', authenticateAdmin, requireSuperAdmin, deleteCategory);

module.exports = router;