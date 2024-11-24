const SliderImage = require('../models/SliderImages');

// Get all slides
exports.getSlides = async (req, res) => {
  try {
    const slides = await SliderImage.find();
    res.json(slides);
  } catch (error) {
    console.error("Error fetching slides:", error);
    res.status(500).json({ message: 'Error fetching slides', error });
  }
};

// Create a new slide
exports.createSlide = async (req, res) => {
  const { name, price, discountPrice, imageUrl, productId, mainBadgeName, mainBadgeColor } = req.body;

  if (!name || !price || !imageUrl || !productId || !mainBadgeName || !mainBadgeColor) {
    return res.status(400).json({ message: "Name, price, image, and product ID are required." });
  }

  try {
    const newSlide = new SliderImage({
      productId,
      name,
      price,
      discountPrice,
      imageUrl,
      mainBadgeName,
      mainBadgeColor
    });

    const savedSlide = await newSlide.save();
    res.status(201).json(savedSlide);
  } catch (error) {
    console.error("Error creating slide:", error);
    res.status(500).json({ message: "Failed to create slide.", error });
  }
};

// Update a slide
exports.updateSlide = async (req, res) => {
  const { id } = req.params;
  const { name, price, discountPrice, imageUrl, productId, mainBadgeName, mainBadgeColor } = req.body;

  try {
    const updatedSlide = await SliderImage.findByIdAndUpdate(
      id,
      { productId, name, price, discountPrice, imageUrl, mainBadgeName, mainBadgeColor },
      { new: true }
    );

    if (!updatedSlide) return res.status(404).json({ message: 'Slide not found' });
    res.json(updatedSlide);
  } catch (error) {
    console.error("Error updating slide:", error);
    res.status(500).json({ message: 'Error updating slide', error });
  }
};

// Delete a slide
exports.deleteSlide = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSlide = await SliderImage.findByIdAndDelete(id);
    if (!deletedSlide) return res.status(404).json({ message: 'Slide not found' });

    res.json({ message: 'Slide deleted successfully' });
  } catch (error) {
    console.error("Error deleting slide:", error);
    res.status(500).json({ message: 'Error deleting slide', error });
  }
};
