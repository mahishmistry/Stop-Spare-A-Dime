// var natural = require('natural/lib/natural/tokenizers');
var stemmers = require('natural/lib/natural/stemmers/');
var fs = require('fs');
var path = require('path');
var NGrams = require('natural/lib/natural/ngrams').NGrams;


// Custom tokenizer that only splits on whitespace.
var tokenizer = {
    tokenize: function(text) {
        return text.split(/\s+/).filter(token => token.length > 0);
    }
};

// Load brand lexicon from CSV file.
function _load_brand_lexicon() {
    const csvPath = path.join(__dirname, 'brand_names.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    // Skip header row and extract brand brand_names
    return lines.slice(1).map(line => line.trim().toLowerCase()).filter(line => line.length > 0);
}

const BRAND_LEXICON = _load_brand_lexicon();

// Global list of quantity indicators for parsing tokens
const QUANTITY_INDICATORS = ['oz', 'g', 'kg', 'lb', 'ml', 'l', 'pack', 'count'];

// Demo run after BRAND_LEXICON is available
console.log(parse_product_data("Strawberries Long Stem Prepacked - 1 Lb"));

/**
 * Given a product title, extract structured data including brand names, stemmed product names, and quantity values/types.
 * @param {*} title A product title string to parse, e.g., "Green Giant Strawberries 16oz, 2-pack". 
 * @returns 
 */
function parse_product_data(title) {
    var tokens = tokenizer.tokenize(title);

    var numeric_tokens = tokens.filter(token => !isNaN(parseFloat(token)));
    var alphabetic_tokens = tokens.filter(token => _is_alphabetic(token));
    
    var brand_result = _find_brand_names(alphabetic_tokens, 3);
    
    var brand_tokens = brand_result.brand_names;
    var non_brand_tokens = brand_result.non_brand_tokens;
    
    var stemmed_non_brand_tokens = non_brand_tokens.map(token => stemmers.PorterStemmer.stem(token));
    var quantity_tokens = tokens.map(token => _get_quantity_value_and_type(token)).filter(token => token !== null);
    
    return {
        tokens: tokens,
        numeric_tokens: numeric_tokens,
        alphabetic_tokens: alphabetic_tokens,
        stemmed_product_names: stemmed_non_brand_tokens,
        brand_names: brand_tokens,
        quantity_values_and_types: quantity_tokens
    }
}

function _is_alphabetic(token) { // Allow letters, apostrophes, and quotes for brand names like "Nature's Choice". Ignore tokens that are quantity indicators like "Lb".
    return /^[a-zA-Z'"]+$/.test(token) && !QUANTITY_INDICATORS.some(indicator => token.toLowerCase() === (indicator));
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
            if (BRAND_LEXICON.includes(phrase)) {
                brand_names.push(phrase);
                for (var j = 0; j < n; j++) matchedIndices.add(i + j);
            }
        }
    }

    var non_brand_tokens = tokens.filter((t, idx) => !matchedIndices.has(idx));
    return { brand_names, non_brand_tokens };
}

function _get_quantity_value_and_type(token) {
    if (!QUANTITY_INDICATORS.some(indicator => token.toLowerCase().includes(indicator)) || isNaN(parseFloat(token))) {
        return null; // Not a quantity token
    }
    var value = parseFloat(token);
    var type = QUANTITY_INDICATORS.find(indicator => token.toLowerCase().includes(indicator));
    return { value, type };
}
