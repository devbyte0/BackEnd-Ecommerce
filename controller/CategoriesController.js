// controllers/categoryController.js
const Category = require('../models/Categories');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public (Adjust based on your authentication strategy)
 */
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 }); // Sort alphabetically by name
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Server Error: Unable to fetch categories." });
    }
};

/**
 * @desc    Get a single category by ID
 * @route   GET /api/categories/:id
 * @access  Public (Adjust based on your authentication strategy)
 */
const getCategoryById = async (req, res) => {
    const { id } = req.params;

    try {
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }

        res.status(200).json(category);
    } catch (error) {
        console.error(`Error fetching category with ID ${id}:`, error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid category ID." });
        }
        res.status(500).json({ message: "Server Error: Unable to fetch the category." });
    }
};

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Public (Adjust based on your authentication strategy)
 */
const createCategory = async (req, res) => {
    const { name } = req.body;

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Invalid category name." });
    }

    try {
        // Check for duplicate category name
        const existingCategory = await Category.findOne({ name: name.trim() });
        if (existingCategory) {
            return res.status(400).json({ message: "Category with this name already exists." });
        }

        const newCategory = new Category({ name: name.trim() });
        const savedCategory = await newCategory.save();

        res.status(201).json(savedCategory);
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Server Error: Unable to create category." });
    }
};

/**
 * @desc    Update an existing category
 * @route   PUT /api/categories/:id
 * @access  Public (Adjust based on your authentication strategy)
 */
const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Invalid category name." });
    }

    try {
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }

        // Check for duplicate category name
        const duplicateCategory = await Category.findOne({ name: name.trim(), _id: { $ne: id } });
        if (duplicateCategory) {
            return res.status(400).json({ message: "Another category with this name already exists." });
        }

        category.name = name.trim();
        const updatedCategory = await category.save();

        res.status(200).json(updatedCategory);
    } catch (error) {
        console.error(`Error updating category with ID ${id}:`, error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid category ID." });
        }
        res.status(500).json({ message: "Server Error: Unable to update category." });
    }
};

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Public (Adjust based on your authentication strategy)
 */
const deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }

        await category.remove();

        res.status(200).json({ message: "Category deleted successfully." });
    } catch (error) {
        console.error(`Error deleting category with ID ${id}:`, error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid category ID." });
        }
        res.status(500).json({ message: "Server Error: Unable to delete category." });
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
