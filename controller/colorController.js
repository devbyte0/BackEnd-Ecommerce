const Color = require('../models/Colors');

const addColor = async (req, res) => {
  try {
    const { name, hexCode } = req.body;
    if (!name || !hexCode) {
      return res.status(400).json({ message: 'Color name and hexCode are required' });
    }

    const exists = await Color.findOne({ name: name.trim() });
    if (exists) {
      return res.status(409).json({ message: 'Color already exists' });
    }

    const newColor = await Color.create({
      name: name.trim(),
      hexCode: hexCode.trim()
    });

    res.status(201).json(newColor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getColors = async (req, res) => {
  try {
    const colors = await Color.find().sort({ name: 1 });
    res.status(200).json(colors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateColor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.name) updates.name = req.body.name.trim();
    if (req.body.hexCode) updates.hexCode = req.body.hexCode.trim();

    const conflict = await Color.findOne({ name: updates.name, _id: { $ne: id } });
    if (conflict) {
      return res.status(409).json({ message: 'Color name already in use' });
    }

    const updatedColor = await Color.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedColor) {
      return res.status(404).json({ message: 'Color not found' });
    }

    res.status(200).json(updatedColor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteColor = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Color.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Color not found' });
    }
    res.status(200).json({ message: 'Color deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addColor,
  getColors,
  updateColor,
  deleteColor
};