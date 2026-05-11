require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const { query, body, validationResult } = require('express-validator');
const { getJson } = require('serpapi');
const { getBestItems, getItemById } = require('./comparison.cjs');
const { get_cached_search, set_cached_search, add_store, add_product, get_product_by_id, get_all_stores, _add_brand,add_item, add_deal} = require('../database/queries.ts');
const { create_user_context, create_new_user } = require('../database/user.ts');
const { initialize_pool } = require('../database/pool.ts');

const verifyToken = require("../../middleware/verifyToken.cjs");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

const searchHistory = [];

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DEFAULT_SEARCH_ZIP = '01003';
const DEFAULT_SEARCH_LOCATION = 'Amherst, MA, United States';

function normalizeSearchLocation(zipCode, requestedLocation) {
  const rawLocation = String(requestedLocation || zipCode || '').trim();

  if (!rawLocation) {
    return {
      cacheLocation: `${DEFAULT_SEARCH_ZIP}:${DEFAULT_SEARCH_LOCATION}`,
      serpLocation: DEFAULT_SEARCH_LOCATION,
      zipCode: DEFAULT_SEARCH_ZIP,
    };
  }

  const zipMatch = rawLocation.match(/\b\d{5}(?:-\d{4})?\b/);
  const zip = zipMatch?.[0] || (zipCode ? String(zipCode) : undefined);
  const cityState = rawLocation
    .replace(/\b\d{5}(?:-\d{4})?\b/g, '')
    .trim()
    .replace(/\s*,\s*$/, '')
    .replace(/\s+/g, ' ');

  if (cityState && /,\s*[A-Za-z]{2}$/.test(cityState)) {
    const [city, state] = cityState.split(',').map((part) => part.trim());
    const serpLocation = `${city}, ${state.toUpperCase()}, United States`;
    return {
      cacheLocation: zip ? `${zip}:${serpLocation}` : serpLocation,
      serpLocation,
      zipCode: zip,
    };
  }

  return {
    cacheLocation: rawLocation,
    serpLocation: rawLocation,
    zipCode: zip,
  };
}

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
  query('location').optional().isString().trim().isLength({ min: 1, max: 100 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { product, zipCode, location: requestedLocation } = req.query;
    
    // Construct cache key
    const searchLocation = normalizeSearchLocation(zipCode, requestedLocation);
    const cacheKey = `${product.toLowerCase().trim()}-${searchLocation.cacheLocation}`;
    
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
            searchHistory.push({ product, zipCode: searchLocation.zipCode, location: searchLocation.serpLocation, timestamp: new Date(), cached: true });
            
            // Filter cached results for blocked stores
            const filteredCache = cachedEntry.results.filter(item => !userBlockedStores.some(store => 
                item.source?.toLowerCase().includes(store.toLowerCase())
            ));

      // Check if valid cache exists in the database
      const cachedEntry = await get_cached_search(cacheKey);

      if (
        cachedEntry &&
        Date.now() - new Date(cachedEntry.last_fetched).getTime() <
          CACHE_DURATION_MS
      ) {
        // Return cached results
        searchHistory.push({
          product,
          zipCode,
          timestamp: new Date(),
          cached: true,
        });

        // Filter cached results for blocked stores
        const filteredCache = cachedEntry.results.filter(
          (item) =>
            !userBlockedStores.some((store) =>
              item.source?.toLowerCase().includes(store.toLowerCase()),
            ),
        );

        return res.json({
          count: filteredCache.length,
          data: filteredCache,
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
            location: searchLocation.serpLocation, 
            hl: "en",
            gl: "us",
            api_key: process.env.SERPAPI_KEY
        });

      const allResults = response.shopping_results || [];

        // Store un-filtered results in cache
        try {
            await set_cached_search(cacheKey, allResults);
            await saveSearchResultsToDb(allResults);
        } catch (error) {
            console.error("Cache/Product DB Write Error:", error);
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
      
      searchHistory.push({ product, zipCode: searchLocation.zipCode, location: searchLocation.serpLocation, timestamp: new Date(), cached: false });
      res.json({
        count: results.length,
        data: results,
      });
    } catch (error) {
      console.error("SerpApi Error:", error);
      res.status(500).json({ error: "Failed to fetch pricing data." });
    }
  },
);
async function saveSearchResultsToDb(allResults) {
  console.log("Saving search results to DB:", allResults.length);

  for (const item of allResults) {
    try {
      const title = item.title || item.name;
      const source = item.source;
      const link = item.link || "http://placeholder.com";
      const price = item.extracted_price || parseFloat(String(item.price || "").replace(/[^0-9.]/g, ""));
      const serpProductId = item.product_id;

      if (!title || !source) continue;

      // 1. Save store
      try {
        await add_store(source, link);
      } catch (e) {
        // probably duplicate store, ignore
      }

      // 2. Save brand
      let brandId = null;
      const brandName = title.split(" ")[0];

      if (brandName) {
        try {
          const brand = await _add_brand(brandName);
          brandId = brand.brand_id;
        } catch (e) {
          // duplicate brand or insert issue — ignore for now
        }
      }

      // 3. Save product
      let product = null;

      try {
        product = await add_product(title, brandId ?? undefined);
      } catch (e) {
        // duplicate product or insert issue — ignore for now
      }

      if (!product?.product_id) continue;

      // 4. Save item
      // add_item currently requires store_item_id to be a positive integer
      const storeItemId = String(item.product_id || `${title}-${source}`);

      let dbItem = null;

      try {
          dbItem = await add_item(
            product.product_id,
            source,
            storeItemId,
            item.rating ?? null,
            item.reviews ?? null
          );
      } catch (e) {
          // duplicate item or schema issue — ignore for now
        }

        // 5. Save deal/price
        if (dbItem?.item_id && Number.isFinite(price)) {
          try {
            await add_deal(
              dbItem.item_id,
              price,
              false,
              new Date()
            );
          } catch (e) {
            // duplicate deal or insert issue — ignore for now
          }
        }
      
    } catch (err) {
      console.error("Error saving search result to DB:", err);
    }
  }
}
/**
 * Protected endpoint returning local API hit history.
 * Pushes historical items array directly tied to the active server session runtime.
 *
 * @name GET /api/history (protected)
 * @function
 * @returns {Object} JSON array comprising all searches made prior in this server's session lifecycle.
 */
app.get("/api/history", verifyToken, (req, res) => {
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
app.post(
  "/api/block",
  verifyToken,
  body("store").isString().trim().escape().notEmpty(),
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
  },
);

/**
 * Exposes a user's full array list of implicitly blacklisted store locations out from PostgreSQL.
 * Verified and parsed dynamically using the authenticated request `user.email`.
 *
 * @name GET /api/block (protected)
 * @function
 * @returns {Object} JSON array comprising strictly of the user's previously blacklisted Merchant identifiers.
 */
app.get("/api/block", verifyToken, async (req, res) => {
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
app.get('/api/compare', optionalVerifyToken, 
 query('product').isString().trim().escape().notEmpty(),
 query('zipCode').optional().isPostalCode('US'),
 query('location').optional().isString().trim().isLength({ min: 1, max: 100 }),
  async (req, res) => {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  const { product, zipCode, location: requestedLocation } = req.query;
  const searchLocation = normalizeSearchLocation(zipCode, requestedLocation);
  const cacheKey = `${product.toLowerCase().trim()}-${searchLocation.cacheLocation}`;
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
app.get('/api/item/:item_id',
  query('product').isString().trim().escape().notEmpty(),
  query('zipCode').optional().isPostalCode('US'),
  query('location').optional().isString().trim().isLength({ min: 1, max: 100 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { product, zipCode, location: requestedLocation } = req.query;
    const searchLocation = normalizeSearchLocation(zipCode, requestedLocation);
    const cacheKey = `${product.toLowerCase().trim()}-${searchLocation.cacheLocation}`;

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
