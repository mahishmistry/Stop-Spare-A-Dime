require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const { query, body, validationResult } = require('express-validator');
const { getJson } = require('serpapi');
const { getBestItems, getItemById } = require('./comparison.cjs');
const { get_cached_search, set_cached_search } = require('../database/queries.ts');

const verifyToken = require("../../middleware/verifyToken.cjs");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

const searchHistory = [];
const blockedStores = [];

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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
    
    // Construct cache key
    const location = zipCode || "United States";
    const cacheKey = `${product.toLowerCase().trim()}-${location}`;
    
    try {
        // Check if valid cache exists in the database
        const cachedEntry = await get_cached_search(cacheKey);
        
        if (cachedEntry && (Date.now() - new Date(cachedEntry.last_fetched).getTime() < CACHE_DURATION_MS)) {
            // Return cached results
            searchHistory.push({ product, zipCode, timestamp: new Date(), cached: true });
            return res.json({
                count: cachedEntry.results.length,
                data: cachedEntry.results
            });
        }
    } catch (error) {
        console.error("Cache Read Error:", error);
        // Non-fatal error, continue to fetch from API
    }

    try {
        // Fetch data from SerpApi's Google Shopping engine
        const response = await getJson({
            engine: "google_shopping",
            q: `Grocery ${product}`,
            location: location, 
            hl: "en",
            gl: "us",
            api_key: process.env.SERPAPI_KEY
        });

        //Filter for blocked stores
        const results = (response.shopping_results || [])
            .filter(item => !blockedStores.some(store => 
            item.source?.toLowerCase().includes(store.toLowerCase())
        ));
      
      // Store in cache
      try {
          await set_cached_search(cacheKey, results);
      } catch (error) {
          console.error("Cache Write Error:", error);
      }

      searchHistory.push({ product, zipCode, timestamp: new Date(), cached: false });
      res.json({
        count: results.length,
        data: results
      });
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

// Endpoint to get a specific item by its product_id
app.get('/api/item/:item_id', (req, res) => {
    getItemById(req, res);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});