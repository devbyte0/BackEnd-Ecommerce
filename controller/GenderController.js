// controllers/gender-controller.js
const Gender = require('../models/Gender');

const addGender = async (req, res) => {
  try {
    const newGender = new Gender({
      type: req.body.type
    });

    await newGender.save();
    res.status(201).json(newGender);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getGenders = async (req, res) => {
  try {
    const genders = await Gender.find();
    res.status(200).json(genders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateGender = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedGender = await Gender.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedGender);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteGender = async (req, res) => {
  try {
    const { id } = req.params;
    await Gender.findByIdAndDelete(id);
    res.status(200).json({ message: 'Gender deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addGender,
  getGenders,
  updateGender,
  deleteGender
};
