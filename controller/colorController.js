// controllers/color-controller.js
const Color = require('../models/Colors');

const addColor = async (req, res) => {
  try {
    const newColor = new Color({
      name: req.body.name,
      hexCode: req.body.hexCode
    });

    await newColor.save();
    res.status(201).json(newColor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getColors = async (req, res) => {
  try {
    const colors = await Color.find();
    res.status(200).json(colors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateColor = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedColor = await Color.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedColor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteColor = async (req, res) => {
  try {
    const { id } = req.params;
    await Color.findByIdAndDelete(id);
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
