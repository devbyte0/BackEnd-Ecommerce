const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/AdminAuthMiddleware');
const embeddingService = require('../utils/embeddingService');
const Product = require('../models/Product');

// Admin: generate embeddings for all products that don't have them
router.post('/embeddings/generate', authenticateAdmin, async (req, res) => {
  try {
    const count = await embeddingService.embedAllProducts(10);
    res.json({ message: `Generated ${count} embeddings`, count });
  } catch (err) {
    res.status(500).json({ message: 'Embedding generation failed', error: err.message });
  }
});

// Admin: check embedding stats
router.get('/embeddings/stats', authenticateAdmin, async (req, res) => {
  try {
    const total = await Product.countDocuments();
    const withEmbedding = await Product.countDocuments({ embedding: { $exists: true, $ne: null, $ne: [] } });
    res.json({ total, withEmbedding, pending: total - withEmbedding, available: embeddingService.isAvailable() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get stats', error: err.message });
  }
});

module.exports = router;
