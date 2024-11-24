// routes/category-routes.js
const express = require('express');
const router = express.Router();
const { addCategory, getCategories, updateCategory, deleteCategory } = require('../controller/CategoriesController');

router.post('/categories', addCategory);
router.get('/categories', getCategories);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;
