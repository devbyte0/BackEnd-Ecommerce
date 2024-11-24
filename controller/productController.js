const Product = require('../models/Product');
const cloudinary = require('../config/coudinaryconfig');

const addProduct = async (req, res) => {
  try {
    const files = req.files;
    console.log(files); // Debugging line to check the uploaded files

    let variantImages = {};
    let mainImageUrl = '';

    if (files) {
      for (const key of Object.keys(files)) {
        const fileArray = files[key];
        for (const file of fileArray) {
          const result = await cloudinary.uploader.upload(file.path);
          if (key === 'mainImage') {
            mainImageUrl = result.secure_url;
          } else {
            const variantIndex = key.split('-')[1];
            if (!variantImages[variantIndex]) {
              variantImages[variantIndex] = [];
            }
            variantImages[variantIndex].push(result.secure_url);
          }
        }
      }
    }

    const variants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;

    const newProduct = new Product({
      name: req.body.name,
      categories: req.body.categories,
      mainPrice: req.body.mainPrice,
      discountPrice: req.body.discountPrice, // Include main discount price
      mainBadgeName: req.body.mainBadgeName, // Include main badge name
      mainBadgeColor: req.body.mainBadgeColor, // Include main badge color
      gender: req.body.gender, // Include gender
      variants: variants.map((variant, index) => ({
        ...variant,
        images: variantImages[index] || []
      })),
      mainImage: mainImageUrl
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const files = req.files;
    let variantImages = {};
    let mainImageUrl = product.mainImage;

    if (files) {
      for (const key of Object.keys(files)) {
        const fileArray = files[key];
        for (const file of fileArray) {
          const result = await cloudinary.uploader.upload(file.path);
          if (key === 'mainImage') {
            mainImageUrl = result.secure_url;
          } else {
            const variantIndex = key.split('-')[1];
            if (!variantImages[variantIndex]) {
              variantImages[variantIndex] = [];
            }
            variantImages[variantIndex].push(result.secure_url);
          }
        }
      }
    }

    const variants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;

    product.name = req.body.name || product.name;
    product.categories = req.body.categories || product.categories;
    product.mainPrice = req.body.mainPrice || product.mainPrice;
    product.discountPrice = req.body.discountPrice || product.discountPrice; // Update main discount price
    product.mainBadgeName = req.body.mainBadgeName || product.mainBadgeName; // Update main badge name
    product.mainBadgeColor = req.body.mainBadgeColor || product.mainBadgeColor; // Update main badge color
    product.gender = req.body.gender || product.gender; // Update gender
    product.mainImage = mainImageUrl;

    product.variants = variants.map((variant, index) => ({
      ...product.variants[index],
      ...variant,
      images: variantImages[index] || product.variants[index].images
    }));

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res.status (500).json({ error: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await Product.findById(id);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status (500).json({ error: error.message });
  }
};
const deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.variant.findByIdAndDelete(id);
    res.status(200).json({ message: 'Variant deleted successfully' });
  } catch (error) {
    res.status (500).json({ error: error.message });
  }
};

module.exports = {
  addProduct,
  deleteVariant,
  getSingleProduct,
  getProducts,
  updateProduct,
  deleteProduct
};
