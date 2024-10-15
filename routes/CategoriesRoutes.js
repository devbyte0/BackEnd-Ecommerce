// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controller/CategoriesController');

// @route   GET /api/categories
// @desc    Retrieve all categories
// @access  Public
router.get('/categories', getCategories);

// @route   GET /api/categories/:id
// @desc    Retrieve a single category by ID
// @access  Public
router.get('/categories/:id', getCategoryById);

// @route   POST /api/categories
// @desc    Create a new category
// @access  Public
router.post('/categories', createCategory);

// @route   PUT /api/categories/:id
// @desc    Update an existing category by ID
// @access  Public
router.put('/categories/:id', updateCategory);

// @route   DELETE /api/categories/:id
// @desc    Delete a category by ID
// @access  Public
router.delete('/categories/:id', deleteCategory);

module.exports = router;
