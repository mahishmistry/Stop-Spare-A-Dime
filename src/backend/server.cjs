require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const { query, body, validationResult } = require('express-validator');
const { getJson } = require('serpapi');
const { getBestItems, getItemById } = require('./comparison.cjs');
const { get_cached_search, set_cached_search, add_store, add_product, get_product_by_id, get_all_stores } = require('../database/queries.ts');
const { create_user_context, create_new_user } = require('../database/user.ts');
const { initialize_pool } = require('../database/pool.ts');

const verifyToken = require("../../middleware/verifyToken.cjs");
const optionalVerifyToken = require("../../middleware/optionalVerifyToken.cjs");
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');


// Initialize database pool
initialize_pool(process.env.NODE_ENV === 'test').catch(console.error);

app.use(helmet());
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
// run npm install cors, these lines above + adding const cors helps the browser front end connect to backend requests 

const searchHistory = [];

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// this route is adding user to database if they do not exist 
app.post('/api/user/register', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;
    const name = req.body.name || req.user.name || email;

    if (!email) {
      return res.status(400).json({ error: "Missing user email" });
    }

    let userContext = await create_user_context(email);

    if (!userContext) {
      await create_new_user(email, name);
      userContext = await create_user_context(email);
    }

    res.json({
      message: "User registered",
      email,
      name
    });
  } catch (err) {
    console.error("User registration error:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// fetches user data! different from post
app.get('/api/user/profile', verifyToken, async (req, res) => {
  const userContext = await create_user_context(req.user.email);

  if (!userContext) {
    return res.status(404).json({ error: "User not found in database." });
  }

  res.json({
    name: userContext.name,
    email: req.user.email
  });
});

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
app.get('/api/prices', optionalVerifyToken,
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
    
    let userBlockedStores = [];
    let favoriteIdentifiers = [];

    try {
      if(req.user?.email){
        const userContext = await create_user_context(req.user.email);
          if (userContext) {
            userBlockedStores = await userContext.get_blacklisted_stores();
            const favIds = await userContext.get_favorite_products(100);
            for (const fid of favIds) {
                const prod = await get_product_by_id(fid);
                if (prod) favoriteIdentifiers.push(prod.name);
            }
            // Trigger addition to the user's database search history
            await userContext.add_search_history(product, new Date());
        }
      } 
    } catch (e) {
      console.error("Error fetching user context for filters/favorites:", e);
    }

    try {
        // Check if valid cache exists in the database
        const cachedEntry = await get_cached_search(cacheKey);
        
        if (cachedEntry && (Date.now() - new Date(cachedEntry.last_fetched).getTime() < CACHE_DURATION_MS)) {
            // Return cached results
            searchHistory.push({ product, zipCode, timestamp: new Date(), cached: true });
            
            // Filter cached results for blocked stores
            const filteredCache = cachedEntry.results.filter(item => !userBlockedStores.some(store => 
                item.source?.toLowerCase().includes(store.toLowerCase())
            ));

            // Highlight favorites (show first)
            filteredCache.sort((a, b) => {
                const aFav = (favoriteIdentifiers.includes(a.product_id) || favoriteIdentifiers.includes(a.title)) ? 1 : 0;
                const bFav = (favoriteIdentifiers.includes(b.product_id) || favoriteIdentifiers.includes(b.title)) ? 1 : 0;
                return bFav - aFav;
            });

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
        
        //Filter for blocked stores
        const results = allResults.filter(item => !userBlockedStores.some(store => 
            item.source?.toLowerCase().includes(store.toLowerCase())
        ));
        
        // Highlight favorites (show first)
        results.sort((a, b) => {
            const aFav = (favoriteIdentifiers.includes(a.product_id) || favoriteIdentifiers.includes(a.title)) ? 1 : 0;
            const bFav = (favoriteIdentifiers.includes(b.product_id) || favoriteIdentifiers.includes(b.title)) ? 1 : 0;
            return bFav - aFav;
        });
      
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
        try {
          await add_store(store, "http://placeholder.com");
        } catch (e) {}

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
 * Removes a specific "store" name identifier from a user's persistent Database blocklist.
 * Filters via the verifyToken session email embedded into Req.
 *
 * @name DELETE /api/block (protected)
 * @function
 * @param {string} req.body.store - The literal store source parameter identifying the merchant to stop ignoring.
 * @returns {Object} JSON payload explicitly detailing the user's updated blocklist arrays upon successful removal.
 */
app.delete('/api/block', verifyToken,
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
        await userContext.unblacklist_store(store);
        const blockedStores = await userContext.get_blacklisted_stores();
        res.json({ blockedStores });
      } else {
        res.status(404).json({ error: "User not found in database." });
      }
    } catch (err) {
      console.error("Error unblacklisting store:", err);
      res.status(500).json({ error: "Failed to unblacklist store." });
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
 * Inserts a specific product identifier to a user's persistent favorites list.
 * 
 * @name POST /api/favorites (protected)
 */
app.post('/api/favorites', verifyToken,
  body('productId').isString().trim().escape().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { productId } = req.body;
    
    try {
      const userContext = await create_user_context(req.user.email);
      if (userContext) {
        try {
          await add_product(productId);
        } catch (e) {}

        await userContext.favorite_product(productId);
        const favorites = await userContext.get_favorite_products(100);
        res.json({ favorites });
      } else {
        res.status(404).json({ error: "User not found in database." });
      }
    } catch (err) {
      console.error("Error adding favorite product:", err);
      res.status(500).json({ error: "Failed to favorite product." });
    }
  }
);

/**
 * Removes a specific product identifier from a user's persistent favorites list.
 *
 * @name DELETE /api/favorites (protected)
 */
app.delete('/api/favorites', verifyToken,
  body('productId').isString().trim().escape().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId } = req.body;

    try {
      const userContext = await create_user_context(req.user.email);
      if (userContext) {
        await userContext.unfavorite_product(productId);
        const favorites = await userContext.get_favorite_products(100);
        res.json({ favorites });
      } else {
        res.status(404).json({ error: "User not found in database." });
      }
    } catch (err) {
      console.error("Error unfavoriting product:", err);
      res.status(500).json({ error: "Failed to unfavorite product." });
    }
  }
);

/**
 * Exposes a user's full array list of favorited products.
 * 
 * @name GET /api/favorites (protected)
 */
app.get('/api/favorites', verifyToken, async (req, res) => {
  try {
    const userContext = await create_user_context(req.user.email);
    if (userContext) {
      const favorites = await userContext.get_favorite_products(100);
      res.json({ favorites });
    } else {
      res.status(404).json({ error: "User not found in database." });
    }
  } catch (err) {
    console.error("Error getting favorites:", err);
    res.status(500).json({ error: "Failed to get favorites." });
  }
});

/**
 * Exposes a user's recent search queries from the database.
 * 
 * @name GET /api/search-history (protected)
 */
app.get('/api/search-history', verifyToken, async (req, res) => {
  try {
    const userContext = await create_user_context(req.user.email);
    if (userContext) {
      // Fetch the last 50 recent search queries
      const history = await userContext.get_search_history(50);
      res.json({ history });
    } else {
      res.status(404).json({ error: "User not found in database." });
    }
  } catch (err) {
    console.error("Error getting search history:", err);
    res.status(500).json({ error: "Failed to get search history." });
  }
});

/**
 * Adds a specific search query to a user's persistent search history.
 * 
 * @name POST /api/search-history (protected)
 */
app.post('/api/search-history', verifyToken,
  body('query').isString().trim().escape().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { query } = req.body;
    
    try {
      const userContext = await create_user_context(req.user.email);
      if (userContext) {
        await userContext.add_search_history(query, new Date());
        const history = await userContext.get_search_history(50);
        res.json({ history });
      } else {
        res.status(404).json({ error: "User not found in database." });
      }
    } catch (err) {
      console.error("Error adding search history:", err);
      res.status(500).json({ error: "Failed to add search history." });
    }
  }
);

/**
 * Updates the authenticated user's profile details.
 * 
 * @name PUT /api/user/profile (protected)
 */
app.put('/api/user/profile', verifyToken,
  body('name').optional().isString().trim().escape(),
  body('email').optional().isEmail().normalizeEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email } = req.body;
    
    try {
      const userContext = await create_user_context(req.user.email);
      if (userContext) {
        let updated = false;
        if (name !== undefined) {
          await userContext.update_name(name);
          updated = true;
        }
        if (email !== undefined) {
          await userContext.update_email(email);
          updated = true;
        }
        
        res.json({ success: updated, message: "Profile updated successfully.", name: userContext.name, email: userContext.email });
      } else {
        res.status(404).json({ error: "User not found in database." });
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      // Safely pass back specific duplicate email errors from the database if they occur
      res.status(500).json({ error: err.message || "Failed to update profile." });
    }
  }
);

/**
 * Updates the authenticated user's notification preferences.
 * 
 * @name PUT /api/user/notifications (protected)
 */
app.put('/api/user/notifications', verifyToken,
  body('enabled').isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { enabled } = req.body;
    
    try {
      const userContext = await create_user_context(req.user.email);
      if (userContext) {
        await userContext.update_notifications(enabled);
        res.json({ success: true, notifications_enabled: enabled });
      } else {
        res.status(404).json({ error: "User not found in database." });
      }
    } catch (err) {
      console.error("Error updating notifications:", err);
      res.status(500).json({ error: "Failed to update notifications." });
    }
  }
);

/**
 * Exposes a full list of all known store names in the database for autocomplete.
 * 
 * @name GET /api/stores
 */
app.get('/api/stores', async (req, res) => {
  try {
    const stores = await get_all_stores();
    res.json({ stores });
  } catch (err) {
    console.error("Error fetching stores:", err);
    res.status(500).json({ error: "Failed to fetch stores." });
  }
});

/**
 * Reroutes comparison processing logic out of server instance and into algorithmic `getBestItems` structure.
 * Automatically bundles in the authenticated user's merchant blocklist for algorithmic filtering logic.
 * 
 * @name GET /api/compare (protected)
 * @function
 * @param {string} req.query.product - The product name to retrieve cached items for.
 * @param {string} [req.query.zipCode] - Optional ZIP Code.
 * @param {string} [req.query.criteria] - Filter structure dictating best sorting values (defaults to 'price').
 * @param {number} [req.query.k] - An optional limiting parameters dictating returned items maximum map array length limit.
 * @returns {Array<Object>} Sorted payload map array of items strictly passing through the algorithm.
 */
app.get('/api/compare', optionalVerifyToken, 
 query('product').isString().trim().escape().notEmpty(),
 query('zipCode').optional().isPostalCode('US'),
  async (req, res) => {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  const { product, zipCode } = req.query;
  const location = zipCode || "United States";
  const cacheKey = `${product.toLowerCase().trim()}-${location}`;
  try {
    const cachedEntry = await get_cached_search(cacheKey);
    if (!cachedEntry) {
        return res.status(404).json({ error: "Product search results not found in cache. Please search first." });
    }
    const items = cachedEntry.results;  
    let userBlockedStores = [];
    if(req.user?.email){
      const userContext = await create_user_context(req.user.email);
      if (userContext) {
        userBlockedStores = await userContext.get_blacklisted_stores();
      }
  }
  getBestItems(items, req, res, userBlockedStores);
 } catch (err) {
   console.error("Comparison Error:", err);
   res.status(500).json({ error: "Failed to compare items." });
 }
});

/**
 * Fetches an explicitly specified exact singular local JSON dataset item mapped purely off `product_id`.
 * Intended to be an unauthenticated open local query fetch endpoint route bridging to `getItemById`.
 * 
 * @name GET /api/item/:item_id
 * @function
 * @param {string} req.params.item_id - The strict alphanumeric URL route parameter literal mapping to an item identifier tag.
 * @param {string} req.query.product - The product name to retrieve cached items for.
 * @param {string} [req.query.zipCode] - Optional ZIP Code.
 * @returns {Object} JSON payload directly mimicking the exact raw `shopping_results` property map structure object for given item tag.
 */
app.get('/api/item/:item_id',
  query('product').isString().trim().escape().notEmpty(),
  query('zipCode').optional().isPostalCode('US'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { product, zipCode } = req.query;
    const location = zipCode || "United States";
    const cacheKey = `${product.toLowerCase().trim()}-${location}`;

    try {
        const cachedEntry = await get_cached_search(cacheKey);
        if (!cachedEntry) {
            return res.status(404).json({ error: "Product search results not found in cache." });
        }
        const items = cachedEntry.results;
        
        getItemById(items, req, res);
    } catch (err) {
        console.error("Item Fetch Error:", err);
        res.status(500).json({ error: "Failed to fetch item." });
    }
});

// replaced old app.listen to initialize pool (database connect)
initialize_pool(true)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database pool:", err);
    process.exit(1);
  });