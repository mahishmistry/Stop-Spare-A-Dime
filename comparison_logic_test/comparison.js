const fs = require('fs');
const path = require('path');

// Load the strawberries json
const dataPath = path.join(__dirname, 'strawberries-google-shopping.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const jsonData = JSON.parse(rawData);


/*
 * Express endpoint to get the best items based on specific criteria
 * Query params: 
 * - k: Optional limit number (defaults to no limit)
 * - criteria: 'price', 'rating', or 'bang for buck' (defaults to 'price')
 */
const getBestItems = (req, res) => {
    // If k is provided, parse it. Otherwise, use the total length (no limit by default)
    const k = req.query.k ? parseInt(req.query.k, 10) : jsonData.shopping_results.length;
    
    // Get criteria from query, default to 'price'
    const criteria = req.query.criteria || 'price';

    if (!['price', 'rating', 'bang for buck'].includes(criteria)) {
        return res.status(400).json({ error: "Invalid criteria. Choose 'price', 'rating', or 'bang for buck'." });
    }

    // Create a copy to avoid mutating the original array
    let sortedItems = [...jsonData.shopping_results].sort((a, b) => {
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

/*
 * Express endpoint to get a specific item by its product_id
 * Route params:
 * - item_id: The product_id to search for
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