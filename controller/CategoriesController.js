const Category = require('../models/Categories');

const addCategory = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const exists = await Category.findOne({ name });
    if (exists) return res.status(409).json({ message: 'Category already exists' });

    const newCategory = await Category.create({ name });
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: 'Updated category name is required' });

    const conflict = await Category.findOne({ name, _id: { $ne: id } });
    if (conflict) return res.status(409).json({ message: 'Category name already in use' });

    const updatedCategory = await Category.findByIdAndUpdate(id, { name }, { new: true });
    if (!updatedCategory) return res.status(404).json({ message: 'Category not found' });

    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addCategory,
  getCategories,
  updateCategory,
  deleteCategory
};