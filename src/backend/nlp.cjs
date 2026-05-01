var natural = require('natural/lib/natural/tokenizers');
var stemmers = require('natural/lib/natural/stemmers/');
var fs = require('fs');
var path = require('path');


// Custom tokenizer that only splits on whitespace
var tokenizer = {
    tokenize: function(text) {
        return text.split(/\s+/).filter(token => token.length > 0);
    }
};

// Load brand lexicon from CSV file
function loadBrandLexicon() {
    const csvPath = path.join(__dirname, 'brand_names.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    // Skip header row and extract brand names
    return lines.slice(1).map(line => line.trim().toLowerCase()).filter(line => line.length > 0);
}

const BRAND_LEXICON = loadBrandLexicon();

// Demo run after BRAND_LEXICON is available
console.log(parse_product_data("Driscoll's Strawberries 16oz, 2-pack"));

function parse_product_data(text) {
    var tokens = tokenizer.tokenize(text);
    var split_tokens = split_tokens_by_type(tokens);
    var stemmed_non_brand_tokens = split_tokens.non_brand_tokens.map(token => stemmers.PorterStemmer.stem(token));
    var quantity_tokens = tokens.map(token => get_quantity_value_and_type(token)).filter(token => token !== null);
    return {
        alphabetic_tokens: split_tokens.alphabetic_tokens,
        brands: split_tokens.brand_tokens,
        products: stemmed_non_brand_tokens,
        quantity_values_and_types: quantity_tokens
    }
}

function split_tokens_by_type(tokens) {
    var numeric_tokens = tokens.filter(token => !isNaN(parseFloat(token)));
    var alphabetic_tokens = tokens.filter(token => isNaN(parseFloat(token)));
    var brand_tokens = alphabetic_tokens.filter(token => BRAND_LEXICON.includes(token.toLowerCase()));
    var non_brand_tokens = alphabetic_tokens.filter(token => !BRAND_LEXICON.includes(token.toLowerCase()));
    return { numeric_tokens, alphabetic_tokens, brand_tokens, non_brand_tokens };
}

function get_quantity_value_and_type(token) {
    
    var quantity_indicators = ['oz', 'g', 'kg', 'lb', 'ml', 'l', 'pack', 'count'];
    if (!quantity_indicators.some(indicator => token.toLowerCase().includes(indicator)) || isNaN(parseFloat(token))) {
        return null; // Not a quantity token
    }
    var value = parseFloat(token);
    var type = quantity_indicators.find(indicator => token.toLowerCase().includes(indicator));
    return { value, type };
}


function get_brand_name(text) {
}

function get_product_name(text) {
}
