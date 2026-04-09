const fs = require('fs');
const path = require('path');

// Load the strawberries json
const dataPath = path.join(__dirname, 'strawberries-google-shopping.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const jsonData = JSON.parse(rawData);


/*
 * Compare function for shopping items based on specific criteria
 * @param {Array} items - Array of item objects
 * @param {string} criteria - 'price', 'rating', or 'bang for buck'
 * @returns {Array} - A new array of sorted items, from best to worst
 */
function compareItems(k, criteria) {
    const firstKItems = jsonData.shopping_results.slice(0,k)
    if (!['price', 'rating', 'bang for buck'].includes(criteria)) {
        throw new Error("Invalid criteria. Choose 'price', 'rating', or 'bang for buck'.");
    }

    // Create a copy to avoid mutating the original array
    return [...firstKItems].sort((a, b) => {
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
}

// Example usage to show it works
// const bestItems = compareItems(20, 'price');
// const bestItems = compareItems(20, 'rating');
const bestItems = compareItems(20, 'bang for buck');


console.log("Top 10 best items for your criteria:");
bestItems.slice(0, 10).forEach(item => {
    console.log(`- ${item.title} ($${item.extracted_price})  (${item.rating})`);
});

module.exports = {
    compareItems
};