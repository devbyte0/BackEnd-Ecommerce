const Coupon = require('../models/Coupon'); // Assuming your Coupon model is in the models folder
const Product = require('../models/Product'); // Assuming your Product model is in the models folder

// Create a new coupon
exports.createCoupon = async (req, res) => {
  try {
    const { code, discount, expirationDate, applicableProducts } = req.body;
    
    const newCoupon = new Coupon({
      code,
      discount,
      expirationDate,
      applicableProducts
    });
    
    const savedCoupon = await newCoupon.save();
    res.status(201).json(savedCoupon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all coupons
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().populate('applicableProducts');
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single coupon by ID
exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id).populate('applicableProducts');
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    res.status(200).json(coupon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a coupon
exports.updateCoupon = async (req, res) => {
  try {
    const { code, discount, expirationDate, isActive, applicableProducts } = req.body;
    
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { code, discount, expirationDate, isActive, applicableProducts },
      { new: true }
    );
    
    if (!updatedCoupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    res.status(200).json(updatedCoupon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
    
    if (!deletedCoupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    res.status(200).json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
