const axios = require('axios');
const Product = require('../models/Product');

const EMBEDDING_MODEL = 'text-embedding-3-small';
const DIMENSIONS = 384; // text-embedding-3-small default, can be 256/384/512/768/1024/1536

function getApiKey() {
  return process.env.AI_API_KEY;
}

function isAvailable() {
  return !!getApiKey();
}

/**
 * Generate an embedding vector for a given text string via OpenAI API.
 */
async function generateEmbedding(text) {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  const cleaned = String(text || '').trim().slice(0, 8000);
  if (!cleaned) return null;
  try {
    const res = await axios.post(
      'https://api.openai.com/v1/embeddings',
      { model: EMBEDDING_MODEL, input: cleaned, dimensions: DIMENSIONS },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    return res?.data?.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}

/**
 * Build searchable text for a product (name + brand + categories + description).
 */
function productToText(product) {
  const parts = [product.name, product.brand];
  if (Array.isArray(product.categories)) {
    product.categories.forEach(c => {
      if (typeof c === 'string') parts.push(c);
      else if (Array.isArray(c)) c.forEach(s => parts.push(String(s)));
    });
  }
  if (product.gender) parts.push(product.gender);
  return parts.filter(Boolean).join(' ').trim();
}

/**
 * Generate & store embedding for a single product.
 */
async function embedProduct(product) {
  if (!product || !product._id) return null;
  const text = productToText(product);
  if (!text) return null;
  const embedding = await generateEmbedding(text);
  if (!embedding) return null;
  await Product.updateOne({ _id: product._id }, { $set: { embedding } });
  return embedding;
}

/**
 * Generate & store embeddings for all products that lack them.
 */
async function embedAllProducts(batchSize = 10) {
  const cursor = Product.find({ $or: [{ embedding: { $exists: false } }, { embedding: null }, { embedding: [] }] }).cursor();
  let count = 0;
  let buffer = [];
  for await (const product of cursor) {
    buffer.push(product);
    if (buffer.length >= batchSize) {
      await Promise.all(buffer.map(p => embedProduct(p)));
      count += buffer.length;
      buffer = [];
    }
  }
  if (buffer.length > 0) {
    await Promise.all(buffer.map(p => embedProduct(p)));
    count += buffer.length;
  }
  return count;
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Search products by vector similarity to a query string.
 * Returns top N products sorted by relevance.
 */
async function searchProductsByQuery(query, options = {}) {
  const { limit = 10, minScore = 0.3, gender, budget } = options;
  const embedding = await generateEmbedding(query);
  if (!embedding) return { results: [], method: 'none' };

  // Try Atlas $vectorSearch first
  try {
    const agg = await Product.aggregate([
      {
        $vectorSearch: {
          index: 'product_vector_index',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: limit * 3,
          limit: limit * 2,
        },
      },
      { $match: { embedding: { $exists: true, $ne: null, $ne: [] } } },
      { $limit: limit * 2 },
      { $addFields: { _score: { $meta: 'vectorSearchScore' } } },
      { $sort: { _score: -1 } },
      { $limit: limit },
    ]);
    if (agg && agg.length > 0) {
      let filtered = applyFilters(agg, { gender, budget });
      return { results: filtered.slice(0, limit), method: 'atlas' };
    }
  } catch { /* fall through to JS */ }

  // Fallback: fetch products with embeddings and compute cosine similarity
  try {
    const products = await Product.find({
      embedding: { $exists: true, $ne: null, $ne: [] },
    }).limit(200).lean();
    const scored = products
      .map(p => ({ ...p, _score: cosineSimilarity(embedding, p.embedding) }))
      .filter(p => p._score >= minScore)
      .sort((a, b) => b._score - a._score)
      .slice(0, limit * 2);
    let filtered = applyFilters(scored, { gender, budget });
    return { results: filtered.slice(0, limit), method: 'js' };
  } catch {
    return { results: [], method: 'none' };
  }
}

function applyFilters(products, { gender, budget } = {}) {
  let filtered = products;
  if (gender) {
    filtered = filtered.filter(p => p.gender === gender || p.gender === 'Unisex');
  }
  if (budget?.max) {
    filtered = filtered.filter(p => {
      const price = (p.discountPrice > 0 && p.discountPrice < p.mainPrice) ? p.discountPrice : (p.mainPrice || 0);
      return price > 0 && price <= budget.max;
    });
  }
  return filtered;
}

module.exports = {
  generateEmbedding,
  embedProduct,
  embedAllProducts,
  searchProductsByQuery,
  productToText,
  isAvailable,
};
