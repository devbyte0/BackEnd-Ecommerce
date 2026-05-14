const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/AdminAuthMiddleware');
const seoService = require('../utils/seoService');
const Product = require('../models/Product');

// Get SEO stats
router.get('/seo/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await seoService.getSEOStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Failed', error: err.message });
  }
});

// Generate SEO for all pending products
router.post('/seo/generate', authenticateAdmin, async (req, res) => {
  try {
    const count = await seoService.generateSEOAll(10);
    res.json({ message: `Generated SEO for ${count} products`, count });
  } catch (err) {
    res.status(500).json({ message: 'Failed', error: err.message });
  }
});

// Force-regenerate SEO for ALL products
router.post('/seo/force', authenticateAdmin, async (req, res) => {
  try {
    const count = await seoService.forceRegenerateAll();
    res.json({ message: `Force-regenerated SEO for ${count} products`, count });
  } catch (err) {
    res.status(500).json({ message: 'Failed', error: err.message });
  }
});

// Generate SEO for a single product by ID
router.post('/seo/product/:id', authenticateAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const seo = await seoService.generateSEO(product);
    res.json({ message: 'SEO regenerated', seo });
  } catch (err) {
    res.status(500).json({ message: 'Failed', error: err.message });
  }
});

// Preview SEO for a product ID
router.get('/seo/product/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('name seo').lean();
    if (!product) return res.status(404).json({ message: 'Not found' });
    // Generate on-the-fly if missing
    if (!product.seo?.metaTitle) {
      const seo = await seoService.generateSEO(product);
      product.seo = seo;
    }
    res.json(product.seo);
  } catch (err) {
    res.status(500).json({ message: 'Failed' });
  }
});

module.exports = router;
