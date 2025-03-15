const mongoose = require('mongoose');
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");

exports.addToCart = async (req, res) => {
  const { userId, name, productId, quantity, size, color, mainImage, price, variantId } = req.body;

  try {
    if (!userId || !productId || !size || !color || quantity <= 0) {
      return res.status(400).json({ message: "Missing required fields or invalid quantity." });
    }

    let product = await Product.findById(productId);
    if (!product) {
      product = await Product.findOne({ "variants._id": productId }, { "variants.$": 1 });
      if (product) product = product.variants[0];
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!price || !mainImage) {
      return res.status(400).json({ message: "Missing price or mainImage." });
    }

    let cart = await Cart.findOne({ userId }).populate("couponId");
    if (!cart) {
      cart = new Cart({ userId, items: [], discountAmount: 0 });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId && item.size === size && item.color === color
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        variantId,
        productId,
        name,
        quantity,
        price,
        mainImage,
        size,
        color,
      });
    }

    // Recalculate the total amount
    cart.totalAmount = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    // If a coupon is applied, reapply it
    if (cart.couponId) {
      const coupon = await Coupon.findById(cart.couponId);
      if (coupon) {
        let totalDiscount = 0;

        cart.items = cart.items.map((item) => {
          const applicableProduct = coupon.applicableProducts.find(
            (ap) => ap.product.toString() === item.productId.toString()
          );

          if (applicableProduct) {
            const applicableVariant = applicableProduct.variants.find(
              (v) => v.variantId.toString() === item.variantId.toString()
            );

            if (applicableVariant) {
              const itemDiscount = (item.price * item.quantity * coupon.discount) / 100;
              totalDiscount += itemDiscount;

              return { ...item.toObject(), discountApplied: itemDiscount };
            }
          }
          return item.toObject();
        });

        cart.discountAmount = totalDiscount;
      }
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Error adding to cart", error: error.message || error });
  }
};

exports.updateQuantity = async (req, res) => {
  const { id } = req.params;
  const { userId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ userId })
      .populate('items.productId')
      .populate({
        path: 'couponId',
        populate: {
          path: 'applicableProducts.product',
          model: 'Product'
        }
      });

    if (!cart) return res.status(404).json({ message: "Cart not found" });
    
    const itemIndex = cart.items.findIndex(item => item._id.toString() === id);
    if (itemIndex === -1) return res.status(404).json({ message: "Item not found" });

    // Update quantity
    cart.items[itemIndex].quantity = quantity;

    // Reset discounts
    cart.items.forEach(item => item.discountApplied = 0);
    let totalDiscount = 0;
   

    if (cart.couponId) {
      const coupon = cart.couponId;
      const now = new Date();
      
      // Validate coupon dates and status
      const isDateValid =  now <= coupon.expirationDate;
      const isCouponValid = coupon.isActive && isDateValid;

      if (isCouponValid) {
        

        // Check minimum cart value
        
          for (const item of cart.items) {
           

              
                const discountPerUnit = (item.price * coupon.discount) / 100;
                let itemDiscount = discountPerUnit * item.quantity;
                
                item.discountApplied = itemDiscount;
                totalDiscount += itemDiscount;
             
            }
          }
        }

      
   

    // Update cart totals
    cart.discountAmount = totalDiscount;
    cart.totalAmount = cart.items.reduce((total, item) => 
      total + (item.price * item.quantity) - item.discountApplied, 0
    );

    await cart.save();

    // Return updated cart
    const updatedCart = await Cart.findOne({ userId })
   

    res.json({
      message: "Quantity updated",
      Upcart: {
        items: updatedCart.items.map(item => ({
          ...item.toObject(),
          discountApplied: item.discountApplied,
        })),
        discountAmount: updatedCart.discountAmount,
        totalAmount: updatedCart.totalAmount,
        couponId: updatedCart.couponId?._id || null
      }
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Error updating quantity", 
      error: error.message 
    });
  }
};


exports.removeFromCart = async (req, res) => {
  const { userId, itemId } = req.params;

  try {
    // Find the cart by userId
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    console.log('Cart before removal:', cart); // Debugging

    // Find the item in the cart
    const existingItemIndex = cart.items.findIndex(item => item._id.toString() === itemId);

    if (existingItemIndex === -1) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }

    // Remove the item from the cart
    cart.items.splice(existingItemIndex, 1);

    console.log('Cart after removal:', cart); // Debugging

    // Recalculate totals
    cart.totalAmount = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
    cart.discountAmount = cart.items.reduce((total, item) => total + (item.discountApplied || 0), 0);

    console.log('Cart after recalculating totals:', cart); // Debugging

    // If cart is empty, reset or delete it
    if (cart.items.length === 0) {
     

      // Option 2: Reset the cart (if you don't want to delete it)
      
      cart.items = []; // Clear all items
      cart.totalAmount = 0; // Reset total amount
      cart.discountAmount = 0; // Reset discount amount
      cart.couponId = null; // Remove applied coupon
      cart.isActive = true; // Reset isActive (if needed)
      await cart.save();
      return res.status(200).json({ 
        message: 'Cart is now empty and reset', 
        updatedCart: cart 
      });
      
    }

    // Save the updated cart
    await cart.save();

    console.log('Cart saved:', cart); // Debugging

    // Return the updated cart
    res.status(200).json({ 
      message: 'Item removed from cart', 
      updatedCart: cart 
    });

  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ 
      message: 'Error removing from cart', 
      error: error.message 
    });
  }
};


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

exports.syncCart = async (req, res) => {
  try {
    const { userId, items } = req.body;

    console.log("Received sync request:", { userId, items });

    if (!userId || !Array.isArray(items)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid request format' 
      });
    }

    // Convert string IDs to ObjectIds and validate items
    const validItems = items
      .filter(item => mongoose.Types.ObjectId.isValid(item?.productId))
      .map(item => ({
        ...item,
        productId: new mongoose.Types.ObjectId(item.productId),
        variantId: item.variantId ? new mongoose.Types.ObjectId(item.variantId) : null
      }));

    console.log("Validated items:", validItems);

    // Find all relevant products and their variants
    const products = await Product.find({
      $or: [
        { _id: { $in: validItems.map(i => i.productId) } },
        { "variants._id": { $in: validItems.map(i => i.productId) } }
      ]
    }).populate('variants');

    console.log("Found products:", products);

    // Create map for both products and variants
    const productMap = new Map();
    const variantMap = new Map();
    
    products.forEach(product => {
      productMap.set(product._id.toString(), product);
      product.variants.forEach(variant => {
        variantMap.set(variant._id.toString(), {
          parentProduct: product,
          variant
        });
      });
    });

    console.log("Product Map:", productMap);
    console.log("Variant Map:", variantMap);

    // Validate all items exist as either products or variants
    const validatedItems = validItems.filter(item => {
      const isVariant = variantMap.has(item.productId.toString());
      const isValid = productMap.has(item.productId.toString()) || isVariant;
      
      if (!isValid) {
        console.warn(`Item not found - Product ID: ${item.productId}, Variant ID: ${item.variantId}`);
      }

      return isValid;
    });

    console.log("Validated items after product/variant check:", validatedItems);

    // Find or create cart
    let cart = await Cart.findOneAndUpdate(
      { userId },
      { $setOnInsert: { items: [], totalAmount: 0, discountAmount: 0 } },
      { new: true, upsert: true }
    ).populate('couponId');

    console.log("Cart before merging:", cart);

    // Merge items logic
    const mergedItems = new Map();

    // 1. Add existing cart items
    cart.items.forEach(item => {
      const key = `${item.productId}_${item.variantId || ''}_${item.size}_${item.color}`;
      mergedItems.set(key, item.toObject());
    });

    console.log("Merged items after adding existing cart items:", mergedItems);

    // 2. Merge new items with proper variant handling
    validatedItems.forEach(clientItem => {
      const variantData = variantMap.get(clientItem.productId.toString());
      const isVariantItem = !!variantData;
      
      const product = isVariantItem 
        ? variantData.parentProduct 
        : productMap.get(clientItem.productId.toString());

      const variant = isVariantItem
        ? variantData.variant
        : product.variants.find(v => v._id.equals(clientItem.variantId));

      const key = `${product._id}_${variant?._id || ''}_${clientItem.size}_${clientItem.color}`;
      const existing = mergedItems.get(key);

      // Get price from PRODUCT (discountPrice or mainPrice)
      const price = product.discountPrice || product.mainPrice;
      
      // Get stock from VARIANT
      const stock = variant?.stock || 0;

      if (!price || !stock) {
        console.warn(`Invalid item - Price: ${price}, Stock: ${stock}`);
        return;
      }

      const quantity = Math.min(clientItem.quantity, stock);

      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, stock);
      } else {
        mergedItems.set(key, {
          productId: product._id,
          variantId: variant?._id || null,
          size: clientItem.size || 'N/A',
          color: clientItem.color || 'N/A',
          price: price,
          quantity: quantity,
          discountApplied: 0,
          name: product.name,
          mainImage: variant?.images?.[0] || product.mainImage
        });
      }
    });

    console.log("Merged items after adding new items:", mergedItems);

    // Update cart with merged items
    cart.items = Array.from(mergedItems.values()).filter(item => item.quantity > 0);
    
    console.log("Cart items after merging:", cart.items);

    // Recalculate totals
    cart.totalAmount = cart.items.reduce((total, item) => 
      total + (item.price * item.quantity) - item.discountApplied, 0);

    console.log("Cart total after recalculation:", cart.totalAmount);

    // Handle coupons
    if (cart.couponId) {
      const isValid = await validateCoupon(cart.couponId, cart.items);
      cart.couponId = isValid ? cart.couponId : null;
      cart.discountAmount = isValid ? calculateCouponDiscount(cart.couponId, cart.totalAmount) : 0;
    }

    cart.totalAmount = Math.max(cart.totalAmount - cart.discountAmount, 0);

    console.log("Cart after coupon handling:", cart);

    // Save and return populated cart
    await cart.save();
    const populatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name price mainImage variants')
      .populate('couponId', 'code discountType discountValue');

    console.log("Populated cart:", populatedCart);

    res.status(200).json({
      success: true,
      cart: {
        items: populatedCart.items.map(item => ({
          ...item.toObject(),
          price: item.price.toFixed(2),
          discountApplied: item.discountApplied.toFixed(2)
        })),
        totalAmount: populatedCart.totalAmount.toFixed(2),
        discountAmount: populatedCart.discountAmount.toFixed(2),
        couponId: populatedCart.couponId
      }
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Cart synchronization failed'
    });
  }
};
// Helper functions
async function validateCoupon(couponId, items) {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) return false;

  // Check minimum cart value
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (subtotal < coupon.minCartValue) return false;

  // Check product applicability
  if (coupon.applicableProducts.length > 0) {
    const hasApplicableProduct = items.some(item => 
      coupon.applicableProducts.includes(item.productId)
    );
    if (!hasApplicableProduct) return false;
  }

  return coupon.isActive && new Date() < coupon.expiryDate;
}

function calculateCouponDiscount(coupon, totalAmount) {
  switch (coupon.discountType) {
    case 'percentage':
      return Math.min(totalAmount * (coupon.discountValue / 100), coupon.maxDiscount || Infinity);
    case 'fixed':
      return Math.min(coupon.discountValue, totalAmount);
    default:
      return 0;
  }
}



exports.increaseQuantity = async (req, res) => {
  const { id } = req.params; // Cart item ID
  const { userId, couponId } = req.body;

  try {
    let cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === id);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Increase quantity
    cart.items[itemIndex].quantity += 1;

    // Recalculate total discount based on discountApplied for each item
    let totalDiscount = cart.items.reduce((sum, item) => sum + (item.discountApplied || 0), 0);

    // If a coupon is applied, update the discountApplied for the item
    if (couponId) {
      const coupon = await Coupon.findOne({ _id: couponId, isActive: true });
      if (coupon && new Date(coupon.expirationDate) > new Date()) {
        cart.items[itemIndex].discountApplied = (cart.items[itemIndex].price * cart.items[itemIndex].quantity * coupon.discount) / 100;
        totalDiscount = cart.items.reduce((sum, item) => sum + (item.discountApplied || 0), 0);
        cart.couponId = couponId;
      }
    }

    cart.discountAmount = totalDiscount;
    await cart.save(); // Save the updated cart

    // Fetch updated cart in one call after saving
    cart = await Cart.findOne({ userId }).populate("items.productId");

    res.json({ message: "Quantity increased", Upcart: cart, totalDiscount });
  } catch (error) {
    console.error("Error increasing quantity:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Apply coupon to cart
exports.applyCoupon = async (req, res) => {
  const { userId } = req.params;
  const { couponCode } = req.body;

  try {
    // Find the user's cart
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      console.log("Cart not found for user:", userId);
      return res.status(404).json({ message: "Cart not found" });
    }
    console.log("Cart found:", cart);

    // Find the coupon by its code
    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
    if (!coupon) {
      console.log("Coupon not found or inactive:", couponCode);
      return res.status(400).json({ message: "Coupon not found" });
    }
    console.log("Coupon found:", coupon);

    // Check if the coupon has expired
    if (new Date(coupon.expirationDate) < new Date()) {
      console.log("Coupon expired on:", coupon.expirationDate);
      return res.status(400).json({ message: "Coupon has expired" });
    }

    // Initialize total discount
    let totalDiscount = 0;

    console.log("Starting discount application...");
    
    // Validate and apply the coupon to applicable items
    const updatedItems = cart.items.map((item) => {
      console.log("Processing cart item:", item);

      const applicableProduct = coupon.applicableProducts.find(
        (ap) => ap.product.toString() === item.productId._id.toString()
      );

      if (applicableProduct) {
        console.log("Applicable product found:", applicableProduct);

        const applicableVariant = applicableProduct.variants.find(
          (v) => v.variantId.toString() === item.variantId.toString()
        );

        if (applicableVariant) {
          console.log("Applicable variant found:", applicableVariant);

          // Calculate discount for the item
          const itemDiscount = (item.price * item.quantity * coupon.discount) / 100;
          console.log(`Item price: ${item.price}, Quantity: ${item.quantity}, Discount: ${itemDiscount}`);

          totalDiscount += itemDiscount;

          // Add a discountApplied field to the item
          return {
            ...item.toObject(),
            discountApplied: itemDiscount,
          };
        } else {
          console.log("No applicable variant for item:", item.variantId);
        }
      } else {
        console.log("No applicable product for item:", item.productId);
      }

      // If the item is not applicable, return it without discount
      return item.toObject();
    });

    console.log("Total discount applied:", totalDiscount);

    // Update the cart with the applied coupon
    cart.items = updatedItems;
    cart.couponId = coupon._id;
    cart.discountAmount = totalDiscount;
    await cart.save();

    console.log("Cart updated successfully with discount.");

    const UpCart = await Cart.findOne({ userId }).populate("items.productId");
    
    // Respond with the updated cart and total discount applied
    return res.status(200).json({
      UpCart,
      totalDiscount,
      message: "Coupon applied successfully",
    });

  } catch (error) {
    console.error("Error applying coupon:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



// Remove coupon from cart
exports.removeCoupon = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove the coupon and reset discount
    cart.couponId = null;
    cart.discountAmount = 0;

    // Reset discountApplied for all items
    cart.items = cart.items.map((item) => {
      return {
        ...item.toObject(),
        discountApplied: 0, // Reset discountApplied to 0
      };
    });

    await cart.save();
    

    res.status(200).json({
      cart,
      message: "Coupon removed successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Error removing coupon", error: error.message });
  }
};



exports.decreaseQuantity = async (req, res) => {
  const { id } = req.params; // Cart item ID
  const { userId, couponId } = req.body;

  try {
    // Find the cart by userId and populate the product details
    let cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the item in the cart
    const itemIndex = cart.items.findIndex((item) => item._id.toString() === id);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Decrease quantity only if it's greater than 1
    if (cart.items[itemIndex].quantity > 1) {
      cart.items[itemIndex].quantity -= 1; // Decrease quantity
    } else {
      // If quantity is already 1, remove the item from the cart
      cart.items.splice(itemIndex, 1);
    }

    // Recalculate total discount based on discountApplied for each item
    let totalDiscount = cart.items.reduce((sum, item) => sum + (item.discountApplied || 0), 0);

    // If a coupon is applied, update the discountApplied for the item
    if (couponId) {
      const coupon = await Coupon.findOne({ _id: couponId, isActive: true });
      if (coupon && new Date(coupon.expirationDate) > new Date()) {
        // Apply coupon discount to the item
        cart.items[itemIndex].discountApplied = (cart.items[itemIndex].price * cart.items[itemIndex].quantity * coupon.discount) / 100;
        totalDiscount = cart.items.reduce((sum, item) => sum + (item.discountApplied || 0), 0);
        cart.couponId = couponId;
      }
    }

    // Update the cart's total discount amount
    cart.discountAmount = totalDiscount;

    // Save the updated cart
    await cart.save();

    // Fetch the updated cart after saving
    const updatedCart = await Cart.findOne({ userId }).populate("items.productId");

    // Return the updated cart and total discount
    res.json({ 
      message: "Quantity decreased", 
      updatedCart: updatedCart, 
      totalDiscount 
    });

  } catch (error) {
    console.error("Error decreasing quantity:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.deleteCart = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the cart by userId
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Reset the cart to its default state
    cart.items = []; // Clear all items
    cart.totalAmount = 0; // Reset total amount
    cart.discountAmount = 0; // Reset discount amount
    cart.couponId = null; // Remove applied coupon
    cart.isActive = true; // Reset isActive (if needed)

    // Save the updated cart
    await cart.save();

    res.status(200).json({ message: 'Cart reset successfully', resetCart: cart });
  } catch (error) {
    console.error('Error resetting cart:', error);
    res.status(500).json({ message: 'Error resetting cart', error: error.message });
  }
};
