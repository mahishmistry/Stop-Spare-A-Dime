require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const { query, body, validationResult } = require('express-validator');
const { getJson } = require('serpapi');
const verifyToken = require("../../middleware/verifyToken.cjs");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

const searchHistory = [];
const blockedStores = [];

// Main endpoint for fetching grocery prices
app.get('/api/prices',
  query('product').isString().trim().escape().notEmpty(),
  query('zipCode').optional().isPostalCode('US'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { product, zipCode } = req.query;
    try {
      const response = await getJson({
        engine: "google_shopping",
        q: `Grocery ${product}`,
        location: zipCode || "United States",
        hl: "en",
        gl: "us",
        api_key: process.env.SERPAPI_KEY
      });
      const results = (response.shopping_results || [])
        .filter(item => !blockedStores.some(store =>
          item.source?.toLowerCase().includes(store.toLowerCase())
        ));
      searchHistory.push({ product, zipCode, timestamp: new Date() });
      res.json({ count: results.length, data: results });
    } catch (error) {
      console.error("SerpApi Error:", error);
      res.status(500).json({ error: 'Failed to fetch pricing data.' });
    }
  }
);

// Search history endpoint (protected)
app.get('/api/history', verifyToken, (req, res) => {
  res.json({ history: searchHistory });
});

// Add blocked store (protected)
app.post('/api/block', verifyToken,
  body('store').isString().trim().escape().notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { store } = req.body;
    if (!blockedStores.includes(store)) blockedStores.push(store);
    res.json({ blockedStores });
  }
);

// Get blocked stores (protected)
app.get('/api/block', verifyToken, (req, res) => {
  res.json({ blockedStores });
});

// Endpoint for comparison logic
app.get('/api/compare', (req, res) => {
  getBestItems(req, res);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});