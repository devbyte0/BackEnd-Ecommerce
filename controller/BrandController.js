const Brand = require('../models/Brand');

exports.addBrand = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: 'Brand name is required' });
    const exists = await Brand.findOne({ name });
    if (exists) return res.status(409).json({ message: 'Brand already exists' });
    const brand = await Brand.create({ name });
    res.status(201).json(brand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: 'Brand name is required' });
    const conflict = await Brand.findOne({ name, _id: { $ne: id } });
    if (conflict) return res.status(409).json({ message: 'Brand name already in use' });
    const updated = await Brand.findByIdAndUpdate(id, { name }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Brand not found' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Brand.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Brand not found' });
    res.status(200).json({ message: 'Brand deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
