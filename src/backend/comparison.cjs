const fs = require('fs');
const path = require('path');

// Load the strawberries json
const dataPath = path.join(__dirname, 'strawberries-google-shopping.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const jsonData = JSON.parse(rawData);


/**
 * Parses query parameters and returns the best items based on specific criteria ("price", "rating", or "bang for buck").
 * Filters out items from stores matching the blockedStores array.
 * 
 * @param {import('express').Request} req - The Express Request object containing query logic (k limit and criteria).
 * @param {import('express').Response} res - The Express Response object used to send back JSON data.
 * @param {Array<string>} [blockedStores=[]] - Optional array of blocklisted store names to filter out of the shopping results.
 * @returns {import('express').Response} A JSON response containing a limited array of sorted item objects, or an error status.
 */
const getBestItems = (req, res, blockedStores = []) => {
    // If k is provided, parse it. Otherwise, use the total length (no limit by default)
    const k = req.query.k ? parseInt(req.query.k, 10) : jsonData.shopping_results.length;
    
    // Get criteria from query, default to 'price'
    const criteria = req.query.criteria || 'price';

    if (!['price', 'rating', 'bang for buck'].includes(criteria)) {
        return res.status(400).json({ error: "Invalid criteria. Choose 'price', 'rating', or 'bang for buck'." });
    }

    // Filter for blocked stores
    let results = jsonData.shopping_results;
    if (blockedStores && blockedStores.length > 0) {
        results = results.filter(item => !blockedStores.some(store => 
            item.source?.toLowerCase().includes(store.toLowerCase())
        ));
    }

    // Create a copy to avoid mutating the original array
    let sortedItems = [...results].sort((a, b) => {
        // Fallback to reasonable defaults if data is missing
        const priceA = a.extracted_price || Infinity;
        const priceB = b.extracted_price || Infinity;
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        
        // Ensure reviews is at least 1 to avoid -Infinity from Math.log(0)
        const reviewsA = Math.max(a.reviews || 1, 1);
        const reviewsB = Math.max(b.reviews || 1, 1);

        if (criteria === 'price') {
            // Lowest price is best
            return priceA - priceB;
        } else if (criteria === 'rating') {
            // Highest rating is best
            return ratingB - ratingA;
        } else if (criteria === 'bang for buck') {
            // rating * log(reviews) / price (highest score is best)
            const scoreA = (priceA !== Infinity) && (priceA > 0) ? ((ratingA * Math.log(reviewsA)) / priceA) : 0;
            const scoreB = (priceB !== Infinity) && (priceB > 0) ? ((ratingB * Math.log(reviewsB)) / priceB) : 0;
            return scoreB - scoreA;
        }
    });

    const bestItems = sortedItems.slice(0, k);
    
    return res.json(bestItems);
};

/**
 * Extrapolates detailed information of a given item matching a provided `product_id`.
 * 
 * @param {import('express').Request} req - The Express Request object containing route params (item_id).
 * @param {import('express').Response} res - The Express Response object used to send back JSON data.
 * @returns {import('express').Response} A JSON response containing a singular item's complete data structure, or a 404 error if missing.
 */
const getItemById = (req, res) => {
    const { item_id } = req.params;

    if (!item_id) {
        return res.status(400).json({ error: "Item ID is required." });
    }

    const item = jsonData.shopping_results.find(i => i.product_id === item_id);

    if (!item) {
        return res.status(404).json({ error: "Item not found." });
    }

    return res.json(item);
};

module.exports = {
    getBestItems,
    getItemById
};