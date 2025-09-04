const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

async function initializeStock() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find({});
    console.log(`Found ${products.length} products to process`);

    let updatedCount = 0;

    for (const product of products) {
      let needsUpdate = false;

      for (const variant of product.variants) {
        // Initialize stockBySize if it doesn't exist
        if (!variant.stockBySize || !Array.isArray(variant.stockBySize)) {
          variant.stockBySize = new Array(variant.sizes.length).fill(0);
          needsUpdate = true;
        }

        // If stockBySize exists but doesn't match sizes array length, adjust it
        if (variant.stockBySize.length !== variant.sizes.length) {
          const newStockBySize = new Array(variant.sizes.length).fill(0);
          // Copy existing values
          for (let i = 0; i < Math.min(variant.stockBySize.length, variant.sizes.length); i++) {
            newStockBySize[i] = variant.stockBySize[i] || 0;
          }
          variant.stockBySize = newStockBySize;
          needsUpdate = true;
        }

        // If legacy stock exists but stockBySize is all zeros, distribute the stock
        if (variant.stock && variant.stock > 0 && variant.stockBySize.every(s => s === 0)) {
          const stockPerSize = Math.floor(variant.stock / variant.sizes.length);
          const remainder = variant.stock % variant.sizes.length;
          
          for (let i = 0; i < variant.stockBySize.length; i++) {
            variant.stockBySize[i] = stockPerSize + (i < remainder ? 1 : 0);
          }
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await product.save();
        updatedCount++;
        console.log(`Updated product: ${product.name}`);
      }
    }

    console.log(`\nStock initialization complete!`);
    console.log(`Updated ${updatedCount} out of ${products.length} products`);

  } catch (error) {
    console.error('Error initializing stock:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
initializeStock();
