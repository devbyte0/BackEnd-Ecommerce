// controllers/badge-controller.js
const Badge = require('../models/Badges');

const addBadge = async (req, res) => {
  try {
    const newBadge = new Badge({
      name: req.body.name,
      color: req.body.color
    });

    await newBadge.save();
    res.status(201).json(newBadge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBadges = async (req, res) => {
  try {
    const badges = await Badge.find();
    res.status(200).json(badges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBadge = await Badge.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedBadge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteBadge = async (req, res) => {
  try {
    const { id } = req.params;
    await Badge.findByIdAndDelete(id);
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
