/**
 * Normalizes weight to a common unit (grams or milliliters).
 * @param {number} value 
 * @param {string} unit 
 * @returns {number | null}
 */
const normalizeWeight = (value, unit) => {
    if (!unit) return null;
    const conversionTable = {
        'oz': 28.3495,
        'ounce': 28.3495,
        'ounces': 28.3495,
        'lb': 453.592,
        'pound': 453.592,
        'pounds': 453.592,
        'g': 1,
        'gram': 1,
        'grams': 1,
        'kg': 1000,
        'kilogram': 1000,
        'kilograms': 1000,
        'ml': 1,
        'l': 1000,
        'fl oz': 29.5735,
        'quart': 946.352946,
        'quarts': 946.352946,
        'qt': 946.352946
    };
    
    const factor = conversionTable[unit.toLowerCase()];
    return factor ? value * factor : null;
};


/**
 * Parses query parameters and returns the best items based on specific criteria ("price", "rating", "bang for buck", or "unit price").
 * Filters out items from stores matching the blockedStores array.
 * 
 * @param {Array<Object>} items - The array of items to compare.
 * @param {import('express').Request} req - The Express Request object containing query logic (k limit and criteria).
 * @param {import('express').Response} res - The Express Response object used to send back JSON data.
 * @param {Array<string>} [blockedStores=[]] - Optional array of blocklisted store names to filter out of the shopping results.
 * @param {Object} [itemMetrics={}] - Optional map of pre-parsed item metrics, keyed by product_id, containing { weight, unit }.
 * @returns {import('express').Response} A JSON response containing a limited array of sorted item objects, or an error status.
 */
const getBestItems = (items, req, res, blockedStores = [], itemMetrics = {}) => {
    // If k is provided, parse it. Otherwise, use the total length (no limit by default)
    const k = req.query.k ? parseInt(req.query.k, 10) : items.length;
    
    // Get criteria from query, default to 'price'
    const criteria = req.query.criteria || 'price';

    if (!['price', 'rating', 'bang for buck', 'unit price'].includes(criteria)) {
        return res.status(400).json({ error: "Invalid criteria. Choose 'price', 'rating', 'bang for buck', or 'unit price'." });
    }

    // Filter for blocked stores
    let results = items;
    if (blockedStores && blockedStores.length > 0) {
        results = results.filter(item => !blockedStores.some(store => 
            item.source?.toLowerCase().includes(store.toLowerCase())
        ));
    }

    // If itemMetrics weren't provided, try to derive metrics from titles using NLP
    if (parse_product_data && (!itemMetrics || Object.keys(itemMetrics).length === 0)) {
        itemMetrics = itemMetrics || {};
        for (const item of results) {
            const id = item.product_id || item.id;
            if (id && itemMetrics[id]) continue;

            const title = item.title || item.product_title || item.snippet || (item.product && item.product.title) || '';
            if (!title) continue;

            try {
                const parsed = parse_product_data(title);
                const q = parsed.quantity_values_and_types || [];
                const weightToken = q.find(t => ['oz','g','lb','l','quart'].includes(t.type));
                const countToken = q.find(t => t.type === 'count');
                if (weightToken) {
                    const totalWeight = countToken ? weightToken.value * countToken.value : weightToken.value;
                    itemMetrics[id || String(Math.random())] = { weight: totalWeight, unit: weightToken.type };
                } else if (countToken) {
                    itemMetrics[id || String(Math.random())] = { weight: countToken.value, unit: 'count' };
                }
            } catch (e) {
                // ignore parse failures
            }
        }
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
        } else if (criteria === 'unit price') {
            const calculateUnitPrice = (item, itemPrice) => {
                if (itemPrice === Infinity || itemPrice <= 0) return Infinity;
                const metrics = itemMetrics[item.product_id] || item;
                const normWeight = normalizeWeight(metrics && metrics.weight, metrics && metrics.unit);
                return normWeight ? itemPrice / normWeight : Infinity;
            };

            const unitPriceA = calculateUnitPrice(a, priceA);
            const unitPriceB = calculateUnitPrice(b, priceB);

            return unitPriceA - unitPriceB;
        }
    });

    // Annotate returned items with canonical unit_type and price_per_unit (price per single unit)
    const bestItems = sortedItems.slice(0, k).map((item) => {
        const copy = Object.assign({}, item);
        const metrics = itemMetrics[item.product_id] || item;
        const normWeight = normalizeWeight(metrics && metrics.weight, metrics && metrics.unit);

        const price = item.extracted_price || Infinity;

        if (metrics && metrics.unit === 'count') {
            copy.unit_type = 'count';
            copy.price_per_unit = (price !== Infinity && metrics.weight > 0) ? (price / metrics.weight) : null;
        } else if (metrics && metrics.unit) {
            // For other canonical units (oz, g, lb, l, quart), report price per single unit
            copy.unit_type = metrics.unit;
            copy.price_per_unit = (price !== Infinity && metrics.weight > 0) ? (price / metrics.weight) : null;
        } else if (normWeight) {
            // If we only have normalized grams but no unit, report per gram
            copy.unit_type = 'g';
            copy.price_per_unit = (price !== Infinity && normWeight > 0) ? (price / normWeight) : null;
        } else {
            copy.unit_type = null;
            copy.price_per_unit = null;
        }

        copy.normalized_weight = normWeight || null;

        return copy;
    });

    return res.json(bestItems);
};

/**
 * Extrapolates detailed information of a given item matching a provided `product_id`.
 * 
 * @param {Array<Object>} items - The array of items to search in.
 * @param {import('express').Request} req - The Express Request object containing route params (item_id).
 * @param {import('express').Response} res - The Express Response object used to send back JSON data.
 * @returns {import('express').Response} A JSON response containing a singular item's complete data structure, or a 404 error if missing.
 */
const getItemById = (items, req, res) => {
    const { item_id } = req.params;

    if (!item_id) {
        return res.status(400).json({ error: "Item ID is required." });
    }

    const item = items.find(i => i.product_id === item_id);

    if (!item) {
        return res.status(404).json({ error: "Item not found." });
    }

    return res.json(item);
};

module.exports = {
    getBestItems,
    getItemById
};

/**
 * Comparator function for two item objects that orders by their unit price.
 * Returns `[comparisonValue, meta]`, where `comparisonValue` is negative if a < b,
 * positive if a > b, or 0 if equal, and `meta` is one of the shared unit type,
 * `'norm'` for normalized weight comparisons, or `'whole'` for whole-item pricing.
 * Accepts an optional itemMetrics map to derive units/weights when present.
 *
 * @param {Object} a
 * @param {Object} b
 * @param {Object} [itemMetrics={}] - optional map keyed by product_id with {weight, unit}
 * @returns {number}
 */
function compareByUnitPrice(a, b, itemMetrics = {}) {
    const priceA = a.extracted_price || Infinity;
    const priceB = b.extracted_price || Infinity;

    const metricsA = itemMetrics[a.product_id] || a;
    const metricsB = itemMetrics[b.product_id] || b;

    const returnWithMeta = (val, meta) => [val, meta];

    // If items already contain `price_per_unit` and `unit_type`/`normalized_weight` (from getBestItems), prefer those
    const ppuA = (a && typeof a.price_per_unit === 'number') ? a.price_per_unit : undefined;
    const ppuB = (b && typeof b.price_per_unit === 'number') ? b.price_per_unit : undefined;
    const unitA = a.unit_type || (metricsA && metricsA.unit) || undefined;
    const unitB = b.unit_type || (metricsB && metricsB.unit) || undefined;
    const normA = (a && typeof a.normalized_weight === 'number') ? a.normalized_weight : (metricsA && normalizeWeight(metricsA.weight, metricsA.unit));
    const normB = (b && typeof b.normalized_weight === 'number') ? b.normalized_weight : (metricsB && normalizeWeight(metricsB.weight, metricsB.unit));

    // If both have explicit ppu and unit_type
    if (ppuA !== undefined && ppuB !== undefined && unitA !== undefined && unitB !== undefined) {
        if (unitA === unitB) {
            // same unit: compare price_per_unit directly
            if (!isFinite(ppuA) && !isFinite(ppuB)) return returnWithMeta(0, unitA);
            if (!isFinite(ppuA)) return returnWithMeta(1, unitA);
            if (!isFinite(ppuB)) return returnWithMeta(-1, unitA);
            const diff = ppuA - ppuB;
            if (Math.abs(diff) < Number.EPSILON) return returnWithMeta(0, unitA);
            return returnWithMeta(diff, unitA);
        }
        // different units: if one ppu is infinite and the other finite, order accordingly
        if (ppuA !== undefined && ppuB !== undefined) {
            if (!isFinite(ppuA) && isFinite(ppuB)) return returnWithMeta(1, 'whole');
            if (isFinite(ppuA) && !isFinite(ppuB)) return returnWithMeta(-1, 'whole');
        }

        // if both have normalized_weight, compare price per normalized weight (price per gram/ml)
        if (normA != null && normB != null) {
            const pricePerNormA = (priceA === Infinity || normA === 0) ? Infinity : priceA / normA;
            const pricePerNormB = (priceB === Infinity || normB === 0) ? Infinity : priceB / normB;
            if (pricePerNormA === pricePerNormB) return returnWithMeta(0, 'norm');
            if (pricePerNormA === Infinity) return returnWithMeta(1, 'norm');
            if (pricePerNormB === Infinity) return returnWithMeta(-1, 'norm');
            return returnWithMeta(pricePerNormA - pricePerNormB, 'norm');
        }
        // otherwise fall through to fallback logic below
    }

    // If either metrics object is missing or has undefined/null weight/unit, fall back to total-price comparison
    if (!metricsA || !metricsB || metricsA.weight == null || metricsB.weight == null || metricsA.unit == null || metricsB.unit == null) {
        console.log("Missing metrics for one or both items, falling back to total price comparison");
        if (priceA === priceB) return returnWithMeta(0, 'whole');
        if (priceA === Infinity) return returnWithMeta(1, 'whole');
        if (priceB === Infinity) return returnWithMeta(-1, 'whole');
        return returnWithMeta(priceA - priceB, 'whole');
    }

    // count units are interpreted as price per single count
    const calc = (price, metrics) => {
        if (price === Infinity || price <= 0) return Infinity;
        if (metrics && metrics.unit === 'count' && metrics.weight > 0) {
            return price / metrics.weight;
        }
        const norm = normalizeWeight(metrics && metrics.weight, metrics && metrics.unit);
        return norm ? (price / norm) : Infinity;
    };

    const unitPriceA = calc(priceA, metricsA);
    const unitPriceB = calc(priceB, metricsB);

    if (unitPriceA === unitPriceB) {
        // decide meta: same canonical unit?
        if (metricsA.unit && metricsB.unit && metricsA.unit === metricsB.unit) return returnWithMeta(0, metricsA.unit);
        if (normA != null && normB != null) return returnWithMeta(0, 'norm');
        return returnWithMeta(0, 'whole');
    }
    if (unitPriceA === Infinity) return returnWithMeta(1, 'whole');
    if (unitPriceB === Infinity) return returnWithMeta(-1, 'whole');
    // choose meta: if both metrics share a unit, prefer that; else if both normalized, 'norm', else 'whole'
    if (metricsA.unit && metricsB.unit && metricsA.unit === metricsB.unit) return returnWithMeta(unitPriceA - unitPriceB, metricsA.unit);
    if (normA != null && normB != null) return returnWithMeta(unitPriceA - unitPriceB, 'norm');
    return returnWithMeta(unitPriceA - unitPriceB, 'whole');
}

module.exports.compareByUnitPrice = compareByUnitPrice;

// Use the shared NLP parser when available (running under tsx/node that can require .ts)
let parse_product_data;
try {
    parse_product_data = require('./nlp.ts').parse_product_data;
} catch (e) {
    // If unavailable, parse_product_data will remain undefined and upstream callers
    // can supply `itemMetrics` directly.
}

// Add comparator logic