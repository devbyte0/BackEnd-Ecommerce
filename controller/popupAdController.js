const PopupAd = require('../models/PopupAd');

exports.getAll = async (req, res) => {
  try {
    const ads = await PopupAd.find().sort({ createdAt: -1 });
    res.json(ads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching popup ads', error });
  }
};

exports.getActive = async (req, res) => {
  try {
    const ads = await PopupAd.find({ isActive: true });
    res.json(ads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching popup ads', error });
  }
};

exports.create = async (req, res) => {
  const { title, imageUrl, linkUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ message: 'Image URL is required' });
  try {
    const ad = await PopupAd.create({ title, imageUrl, linkUrl });
    res.status(201).json(ad);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create popup ad', error });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  try {
    const ad = await PopupAd.findByIdAndUpdate(id, req.body, { new: true });
    if (!ad) return res.status(404).json({ message: 'Popup ad not found' });
    res.json(ad);
  } catch (error) {
    res.status(500).json({ message: 'Error updating popup ad', error });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  try {
    const ad = await PopupAd.findByIdAndDelete(id);
    if (!ad) return res.status(404).json({ message: 'Popup ad not found' });
    res.json({ message: 'Popup ad deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting popup ad', error });
  }
};
