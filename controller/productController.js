const Product = require('../models/Product');
const cloudinary = require('../config/coudinaryconfig');

const addProduct = async (req, res) => {
  try {
    const files = req.files;
    let variantImages = {};
    let mainImageUrl = '';

    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path);
      if (file.fieldname === 'mainImage') {
        mainImageUrl = result.secure_url;
      } else {
        const variantIndex = file.fieldname.split('-')[1];
        if (!variantImages[variantIndex]) {
          variantImages[variantIndex] = [];
        }
        variantImages[variantIndex].push(result.secure_url);
      }
    }

    const newProduct = new Product({
      name: req.body.name,
      categories: req.body.categories,
      variants: req.body.variants.map((variant, index) => ({
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

    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path);
      if (file.fieldname === 'mainImage') {
        mainImageUrl = result.secure_url;
      } else {
        const variantIndex = file.fieldname.split('-')[1];
        if (!variantImages[variantIndex]) {
          variantImages[variantIndex] = [];
        }
        variantImages[variantIndex].push(result.secure_url);
      }
    }

    product.name = req.body.name || product.name;
    product.categories = req.body.categories || product.categories;
    product.mainImage = mainImageUrl;

    product.variants = req.body.variants.map((variant, index) => ({
      ...product.variants[index],
      ...variant,
      images: variantImages[index] || product.variants[index].images
    }));

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct
};