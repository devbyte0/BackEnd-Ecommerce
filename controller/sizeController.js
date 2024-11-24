// controllers/size-controller.js
const Size = require('../models/Size');

const addSize = async (req, res) => {
  try {
    const newSize = new Size({
      name: req.body.name
    });

    await newSize.save();
    res.status(201).json(newSize);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSizes = async (req, res) => {
  try {
    const sizes = await Size.find();
    res.status(200).json(sizes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateSize = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSize = await Size.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedSize);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteSize = async (req, res) => {
  try {
    const { id } = req.params;
    await Size.findByIdAndDelete(id);
    res.status(200).json({ message: 'Size deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addSize,
  getSizes,
  updateSize,
  deleteSize
};
