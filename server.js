require('dotenv').config();
const express = require('express');
const { getJson } = require('serpapi');
const helmet = require('helmet');
const { query, body, validationResult } = require('express-validator');
const { getBestItems } = require('./comparison_logic_test/comparison');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
// Middleware to parse JSON
app.use(express.json());

//Array for search history
const searchHistory = [];
//Array for blocked stores
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
<<<<<<< HEAD
      const response = await getJson({
        engine: "google_shopping",
        q: product,
        location: zipCode || "United States",
        hl: "en",
        gl: "us",
        api_key: process.env.SERPAPI_KEY
      });
      const results = (response.shopping_results || [])
        .filter(item => !blockedStores.some(store =>
          item.source?.toLowerCase().includes(store.toLowerCase())
=======
        // Fetch data from SerpApi's Google Shopping engine
        const response = await getJson({
            engine: "google_shopping",
            q: `Grocery ${product}`,
            location: zipCode || "United States", 
            hl: "en",
            gl: "us",
            api_key: process.env.SERPAPI_KEY
        });

        //Filter for blocked stores
        const results = (response.shopping_results || [])
            .filter(item => !blockedStores.some(store => 
            item.source?.toLowerCase().includes(store.toLowerCase())
>>>>>>> fc75f2672e4dc3746698e305b03a796706165baf
        ));
      searchHistory.push({ product, zipCode, timestamp: new Date() });
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

//Search history endpoint
app.get('/api/history', (req, res) => {
  res.json({ history: searchHistory });
});

//Add blocked store
app.post('/api/block',
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

//Get the blocked stores
app.get('/api/block', (req, res) => {
  res.json({ blockedStores });
});

// Endpoint for comparison logic
app.get('/api/compare', (req, res) => {
    getBestItems(req, res);
});

app.listen(PORT, () => {
<<<<<<< HEAD
  console.log(`Server is running on http://localhost:${PORT}`);
});
=======
    console.log(`Server is running on http://localhost:${PORT}`);
});

>>>>>>> fc75f2672e4dc3746698e305b03a796706165baf
