const TopRatedSlide = require('../models/TopRatedSlides');

// Get all top rated slides
exports.getTopRatedSlides = async (req, res) => {
  try {
    const slides = await TopRatedSlide.find();
    res.json(slides);
  } catch (error) {
    console.error("Error fetching top rated slides:", error);
    res.status(500).json({ message: 'Error fetching top rated slides', error });
  }
};

// Create a new top rated slide
exports.createTopRatedSlide = async (req, res) => {
  const { name, price, discountPrice, imageUrl, productId, mainBadgeName, mainBadgeColor, rating, totalReviews } = req.body;

  if (!name || !price || !imageUrl || !productId || !mainBadgeName || !mainBadgeColor) {
    return res.status(400).json({ message: "Name, price, image, and product ID are required." });
  }

  try {
    const newSlide = new TopRatedSlide({
      productId,
      name,
      price,
      discountPrice,
      imageUrl,
      mainBadgeName,
      mainBadgeColor,
      rating: rating || 0,
      totalReviews: totalReviews || 0
    });

    const savedSlide = await newSlide.save();
    res.status(201).json(savedSlide);
  } catch (error) {
    console.error("Error creating top rated slide:", error);
    res.status(500).json({ message: "Failed to create top rated slide.", error });
  }
};

// Update a top rated slide
exports.updateTopRatedSlide = async (req, res) => {
  const { id } = req.params;
  const { name, price, discountPrice, imageUrl, productId, mainBadgeName, mainBadgeColor, rating, totalReviews } = req.body;

  try {
    const updatedSlide = await TopRatedSlide.findByIdAndUpdate(
      id,
      { productId, name, price, discountPrice, imageUrl, mainBadgeName, mainBadgeColor, rating, totalReviews },
      { new: true }
    );

    if (!updatedSlide) return res.status(404).json({ message: 'Top rated slide not found' });
    res.json(updatedSlide);
  } catch (error) {
    console.error("Error updating top rated slide:", error);
    res.status(500).json({ message: 'Error updating top rated slide', error });
  }
};

// Delete a top rated slide
exports.deleteTopRatedSlide = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSlide = await TopRatedSlide.findByIdAndDelete(id);
    if (!deletedSlide) return res.status(404).json({ message: 'Top rated slide not found' });

    res.json({ message: 'Top rated slide deleted successfully' });
  } catch (error) {
    console.error("Error deleting top rated slide:", error);
    res.status(500).json({ message: 'Error deleting top rated slide', error });
  }
};
