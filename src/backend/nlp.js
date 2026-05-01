import stemmers from 'natural/lib/natural/stemmers/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NGrams } from 'natural/lib/natural/ngrams/index.js';
import { initialize_pool } from "../../dist/database/pool.js";
import { get_all_brand_names, get_all_product_names } from "../../dist/database/queries.js";
import { get } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom tokenizer that only splits on whitespace.
var tokenizer = {
    tokenize: function(text) {
        return text.split(/\s+/).filter(token => token.length > 0);
    }
};

// Global list of quantity indicators for parsing tokens
const QUANTITY_INDICATORS = ['oz', 'g', 'kg', 'lb', 'ml', 'l', 'pack', 'count'];

// LEXICONS
var brand_lexicon = _load_lexicon_csv('brand_names.csv');
var packaging_lexicon = new Set(_load_lexicon_csv('packaging_words.csv').map(term => stemmers.PorterStemmer.stem(term)));
var product_lexicon = [];

function _load_lexicon_csv(csv_name) {
    const csv_path = path.join(__dirname, csv_name);
    const csv_content = fs.readFileSync(csv_path, 'utf-8');
    const lines = csv_content.trim().split('\n');
    return lines.slice(1).map(line => line.trim().toLowerCase()).filter(line => line.length > 0);
}

async function _load_brand_lexicon_from_db() {
    await initialize_pool(false);
    var result = await get_all_brand_names();
    if (!(result instanceof Set)) {
        console.warn("No brand names found in database, falling back to CSV lexicon.");
        return false;
    }
    var brand_names = Array.from(result);
    if (brand_names.length === 0) {
        console.warn("No brand names found in database, falling back to CSV lexicon.");
        return false;
    }
    brand_lexicon = brand_names;
    return true;
}

async function _load_product_lexicon_from_db() {
    await initialize_pool(false);
    var result = await get_all_product_names();
    if (!(result instanceof Set)) {
        console.warn("No product names found in database.");
        return false;
    }
    var product_names = Array.from(result);
    if (product_names.length === 0) {
        console.warn("No product names found in database.");
        return false;
    }
    product_lexicon = product_names;
    return true;
}

async function refresh_lexicons() {
    await initialize_pool(false);
    await _load_brand_lexicon_from_db();
    await _load_product_lexicon_from_db();
}

/**
 * Given a product title, extract structured data including brand names, stemmed product names, and quantity values/types.
 * @param {*} title A product title string to parse, e.g., "Green Giant Strawberries 16oz, 2-pack". 
 * @returns 
 */
function parse_product_data(title) {
    var tokens = tokenizer.tokenize(title);

    // Separate numeric and alphabetic tokens for more targeted processing
    var numeric_tokens = tokens.filter(token => !isNaN(parseFloat(token)));
    var alphabetic_tokens = tokens.filter(token => _is_alphabetic(token));
    
    // Look for brand names, up to trigrams. Also returns the remaining non-brand tokens for further processing.
    var brand_result = _find_brand_names(alphabetic_tokens, 3);
    var brand_tokens = brand_result.brand_names;
    var non_brand_tokens = brand_result.non_brand_tokens;
    
    // Stem non-brand tokens and filter out packaging words to get a cleaner product name for matching against the product lexicon.
    var stemmed_non_brand_tokens = non_brand_tokens
        .map(token => stemmers.PorterStemmer.stem(token))
        .filter(token => !packaging_lexicon.has(token.toLowerCase()));
    var stemmed_product_name = stemmed_non_brand_tokens.join(' ');

    // Extract quantity values and types from tokens, including combined forms like "16oz" or "2-pack".
    var quantity_tokens = _extract_quantity_tokens(tokens);
    
    return {
        tokens: tokens,
        numeric_tokens: numeric_tokens,
        alphabetic_tokens: alphabetic_tokens,
        stemmed_product_name: stemmed_product_name,
        brand_names: brand_tokens,
        quantity_values_and_types: quantity_tokens
    }
}

// Find brand brand_names using n-grams up to `maxN` (e.g., 3 for trigrams)
function _find_brand_names(tokens, maxN) {
    var cleaned = tokens.map(t => t.replace(/[^\w'\-]/g, '').toLowerCase());
    var matchedIndices = new Set();
    var brand_names = [];

    for (var n = Math.min(maxN, cleaned.length); n >= 1; n--) {
        var ngrams = NGrams.ngrams(cleaned, n);
        for (var i = 0; i < ngrams.length; i++) {
            var gram = ngrams[i];
            var phrase = gram.join(' ').trim();
            if (brand_lexicon.includes(phrase)) {
                brand_names.push(phrase);
                for (var j = 0; j < n; j++) matchedIndices.add(i + j);
            }
        }
    }

    var non_brand_tokens = tokens.filter((t, idx) => !matchedIndices.has(idx));
    return { brand_names, non_brand_tokens };
}

function _extract_quantity_tokens(tokens) {
    var quantity_tokens = tokens
        .map(token => _get_quantity_value_and_type(token))
        .filter(token => token !== null);

    for (var i = 0; i < tokens.length - 1; i++) {
        var current = tokens[i];
        var next = tokens[i + 1];
        if (!_is_numeric_only_token(current) || !_is_quantity_indicator_only_token(next)) {
            continue;
        }

        var numericValue = parseFloat(current);
        var normalizedNext = next.toLowerCase().replace(/[^a-z]/g, '');
        quantity_tokens.push({ value: numericValue, type: normalizedNext });
    }

    return quantity_tokens;
}

// TOKEN HELPERS

function _get_quantity_value_and_type(token) {
    if (!QUANTITY_INDICATORS.some(indicator => token.toLowerCase().includes(indicator)) || isNaN(parseFloat(token))) {
        return null; // Not a quantity token
    }
    var value = parseFloat(token);
    var type = QUANTITY_INDICATORS.find(indicator => token.toLowerCase().includes(indicator));
    return { value, type };
}

function _is_numeric_only_token(token) {
    var cleaned = token.trim().replace(/,/g, '');
    return /^\d+(?:\.\d+)?$/.test(cleaned);
}

function _is_quantity_indicator_only_token(token) {
    var normalized = token.toLowerCase().replace(/[^a-z]/g, '');
    var stripped = token.toLowerCase().replace(/[^a-z0-9]/g, '');
    return QUANTITY_INDICATORS.includes(normalized) && stripped === normalized;
}

function _is_alphabetic(token) { // Allow letters, apostrophes, and quotes for brand names like "Nature's Choice". Ignore tokens that are quantity indicators like "Lb".
    return /^[a-zA-Z'"]+$/.test(token) && !QUANTITY_INDICATORS.some(indicator => token.toLowerCase() === (indicator));
}


async function main() {
    await refresh_lexicons();
    // Demo run after brand_lexicon is available
    console.log(parse_product_data("INGLEHoffer Spicy Brown Mustard"));
    
}

main();