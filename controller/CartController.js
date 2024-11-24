const Cart = require('../models/Cart'); // Your Cart model
const Product = require('../models/Product'); // Your Product model
const Coupon = require('../models/Coupon'); // Your Coupon model

// Add item to cart
exports.addToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.productId.toString() === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
      if (existingItem.quantity <= 0) {
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
      }
    } else if (quantity > 0) {
      cart.items.push({
        productId,
        quantity,
        price: product.price,
        image: product.mainImage
      });
    }

    cart.totalAmount = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error adding to cart', error });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    cart.totalAmount = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error removing from cart', error });
  }
};

// Get user's cart
exports.getCart = async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving cart', error });
  }
};

// Apply coupon to cart
exports.applyCoupon = async (req, res) => {
  const { userId, couponCode } = req.body;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
    if (!coupon || new Date(coupon.expirationDate) < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired coupon' });
    }

    cart.coupon = coupon._id;
    const discountAmount = (cart.totalAmount * coupon.discount) / 100;
    cart.totalAmount -= discountAmount;
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error applying coupon', error });
  }
};

// Remove coupon from cart
exports.removeCoupon = async (req, res) => {
  const { userId } = req.body;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.coupon = null;
    // Recalculate totalAmount without coupon
    cart.totalAmount = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error removing coupon', error });
  }
};

// Delete entire cart
exports.deleteCart = async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOneAndDelete({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.status(200).json({ message: 'Cart deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting cart', error });
  }
};
