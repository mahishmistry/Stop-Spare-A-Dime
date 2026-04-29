require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const { query, body, validationResult } = require('express-validator');
const { getJson } = require('serpapi');
const { getBestItems, getItemById } = require('./comparison.cjs');
const { get_cached_search, set_cached_search } = require('../database/queries.ts');
const { create_user_context } = require('../database/user.ts');

const verifyToken = require("../../middleware/verifyToken.cjs");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

const searchHistory = [];

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Main endpoint for fetching grocery prices.
 * Queries SerpApi or directly loads cached 24h data from the PostgreSQL database.
 * Auto-filters response natively based on user's specific blacklist settings.
 * 
 * @name GET /api/prices (protected)
 * @function
 * @param {string} req.query.product - The product name/string required to search.
 * @param {string} [req.query.zipCode] - Optional ZIP Code to bind geo-location data for prices.
 * @returns {Object} JSON payload holding total active item counts and raw filtered item results.
 */
app.get('/api/prices', verifyToken,
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
        let userBlockedStores = [];
        const userContext = await create_user_context(req.user.email);
        if (userContext) {
            userBlockedStores = await userContext.get_blacklisted_stores();
        }

        // Check if valid cache exists in the database
        const cachedEntry = await get_cached_search(cacheKey);
        
        if (cachedEntry && (Date.now() - new Date(cachedEntry.last_fetched).getTime() < CACHE_DURATION_MS)) {
            // Return cached results
            searchHistory.push({ product, zipCode, timestamp: new Date(), cached: true });
            
            // Filter cached results for blocked stores
            const filteredCache = cachedEntry.results.filter(item => !userBlockedStores.some(store => 
                item.source?.toLowerCase().includes(store.toLowerCase())
            ));

            return res.json({
                count: filteredCache.length,
                data: filteredCache
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

        const allResults = response.shopping_results || [];

        // Store un-filtered results in cache
        try {
            await set_cached_search(cacheKey, allResults);
        } catch (error) {
            console.error("Cache Write Error:", error);
        }
        
        let userBlockedStores = [];
        try {
            const userContext = await create_user_context(req.user.email);
            if (userContext) userBlockedStores = await userContext.get_blacklisted_stores();
        } catch (e) {
            console.error("Error fetching user context for filter:", e);
        }

        //Filter for blocked stores
        const results = allResults.filter(item => !userBlockedStores.some(store => 
            item.source?.toLowerCase().includes(store.toLowerCase())
        ));
      
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

/**
 * Protected endpoint returning local API hit history.
 * Pushes historical items array directly tied to the active server session runtime.
 * 
 * @name GET /api/history (protected)
 * @function
 * @returns {Object} JSON array comprising all searches made prior in this server's session lifecycle.
 */
app.get('/api/history', verifyToken, (req, res) => {
  res.json({ history: searchHistory });
});

/**
 * Inserts a specific "store" name identifier directly to a user's persistent Database blocklist.
 * Filters via the verifyToken session email embedded into Req.
 * 
 * @name POST /api/block (protected)
 * @function
 * @param {string} req.body.store - The literal store source parameter identifying the merchant to ignore entirely.
 * @returns {Object} JSON payload explicitly detailing the user's updated blocklist arrays upon successful insert.
 */
app.post('/api/block', verifyToken,
  body('store').isString().trim().escape().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { store } = req.body;
    
    try {
      const userContext = await create_user_context(req.user.email);
      if (userContext) {
        await userContext.blacklist_store(store);
        const blockedStores = await userContext.get_blacklisted_stores();
        res.json({ blockedStores });
      } else {
        res.status(404).json({ error: "User not found in database." });
      }
    } catch (err) {
      console.error("Error blacklisting store:", err);
      res.status(500).json({ error: "Failed to blacklist store." });
    }
  }
);

/**
 * Exposes a user's full array list of implicitly blacklisted store locations out from PostgreSQL.
 * Verified and parsed dynamically using the authenticated request `user.email`.
 * 
 * @name GET /api/block (protected)
 * @function
 * @returns {Object} JSON array comprising strictly of the user's previously blacklisted Merchant identifiers.
 */
app.get('/api/block', verifyToken, async (req, res) => {
  try {
    const userContext = await create_user_context(req.user.email);
    if (userContext) {
      const blockedStores = await userContext.get_blacklisted_stores();
      res.json({ blockedStores });
    } else {
      res.status(404).json({ error: "User not found in database." });
    }
  } catch (err) {
    console.error("Error getting blacklisted stores:", err);
    res.status(500).json({ error: "Failed to get blocked stores." });
  }
});

/**
 * Reroutes comparison processing logic out of server instance and into algorithmic `getBestItems` structure.
 * Automatically bundles in the authenticated user's merchant blocklist for algorithmic filtering logic.
 * 
 * @name GET /api/compare (protected)
 * @function
 * @param {string} [req.query.criteria] - Filter structure dictating best sorting values (defaults to 'price').
 * @param {number} [req.query.k] - An optional limiting parameters dictating returned items maximum map array length limit.
 * @returns {Array<Object>} Sorted payload map array of items strictly passing through the algorithm.
 */
app.get('/api/compare', verifyToken, async (req, res) => {
  try {
    let userBlockedStores = [];
    const userContext = await create_user_context(req.user.email);
    if (userContext) {
      userBlockedStores = await userContext.get_blacklisted_stores();
    }
    getBestItems(req, res, userBlockedStores);
  } catch (err) {
    console.error("Comparison Error:", err);
    getBestItems(req, res, []);
  }
});

/**
 * Fetches an explicitly specified exact singular local JSON dataset item mapped purely off `product_id`.
 * Intended to be an unauthenticated open local query fetch endpoint route bridging to `getItemById`.
 * 
 * @name GET /api/item/:item_id
 * @function
 * @param {string} req.params.item_id - The strict alphanumeric URL route parameter literal mapping to an item identifier tag.
 * @returns {Object} JSON payload directly mimicking the exact raw `shopping_results` property map structure object for given item tag.
 */
app.get('/api/item/:item_id', (req, res) => {
    getItemById(req, res);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});