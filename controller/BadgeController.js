// controllers/badge-controller.js
const Badge = require('../models/Badges');

const addBadge = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || !color) return res.status(400).json({ message: 'name and color are required' });

    const exists = await Badge.findOne({ name: name.trim() });
    if (exists) return res.status(409).json({ message: 'Badge name already exists' });

    const newBadge = await Badge.create({ name: name.trim(), color: color.trim() });
    res.status(201).json(newBadge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBadges = async (req, res) => {
  try {
    const badges = await Badge.find().sort({ name: 1 });
    res.status(200).json(badges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.name) updates.name = req.body.name.trim();
    if (req.body.color) updates.color = req.body.color.trim();

    if (updates.name) {
      const conflict = await Badge.findOne({ name: updates.name, _id: { $ne: id } });
      if (conflict) return res.status(409).json({ message: 'Badge name already exists' });
    }

    const updatedBadge = await Badge.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedBadge) return res.status(404).json({ message: 'Badge not found' });

    res.status(200).json(updatedBadge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Badge.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Badge not found' });
    res.status(200).json({ message: 'Badge deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addBadge,
  getBadges,
  updateBadge,
  deleteBadge
};