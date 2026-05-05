import fs from "fs";
import path from "path";
import { createRequire } from "module";
const localRequire = createRequire(path.resolve(process.cwd(), "package.json"));
let PorterStemmer;
let NGrams;
try {
    const natural = localRequire("natural");
    PorterStemmer = natural.PorterStemmer;
    NGrams = natural.NGrams;
}
catch (error) {
    // Natural library has ESM-only dependencies (afinn-165) that fail in Jest's CommonJS.
    // Fallback to minimal implementations for testing.
    PorterStemmer = {
        stem: (word) => word.toLowerCase().replace(/s$/, "")
    };
    NGrams = {
        ngrams: (tokens, n) => {
            if (n <= 0 || tokens.length < n)
                return [];
            const result = [];
            for (let i = 0; i <= tokens.length - n; i++) {
                result.push(tokens.slice(i, i + n));
            }
            return result;
        }
    };
}
const cjsDirname = typeof __dirname === "string" ? __dirname : undefined;
function resolveBackendAssetPath(fileName) {
    const candidateDirs = [
        cjsDirname,
        path.resolve(process.cwd(), "src/backend"),
        path.resolve(process.cwd(), "dist/backend")
    ].filter((dir) => Boolean(dir));
    for (const dir of candidateDirs) {
        const candidate = path.join(dir, fileName);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    throw new Error(`Unable to locate NLP asset file: ${fileName}`);
}
const tokenizer = {
    tokenize(text) {
        return text.split(/\s+/).filter((token) => token.length > 0);
    }
};
import { QUANTITY_INDICATORS, simplify_quantity_indicator, _normalize_quantity_indicator, _convert_value_to_canonical } from "./quantity.js";
let brand_lexicon = _load_lexicon_csv("brand_names.csv");
const packaging_lexicon = new Set(_load_lexicon_csv("packaging_words.csv").map((term) => PorterStemmer.stem(term)));
let product_lexicon = [];
function _load_lexicon_csv(csv_name) {
    const csv_path = resolveBackendAssetPath(csv_name);
    const csv_content = fs.readFileSync(csv_path, "utf-8");
    const lines = csv_content.trim().split("\n");
    return lines
        .slice(1)
        .map((line) => line.trim().toLowerCase())
        .filter((line) => line.length > 0);
}
async function _load_brand_lexicon_from_db() {
    const { initialize_pool } = await import("../database/pool.js");
    const { get_all_brand_names } = await import("../database/queries.js");
    await initialize_pool(false);
    const result = await get_all_brand_names();
    if (!(result instanceof Set)) {
        console.warn("No brand names found in database, falling back to CSV lexicon.");
        return false;
    }
    const brand_names = Array.from(result);
    if (brand_names.length === 0) {
        console.warn("No brand names found in database, falling back to CSV lexicon.");
        return false;
    }
    brand_lexicon = brand_names;
    return true;
}
async function _load_product_lexicon_from_db() {
    const { initialize_pool } = await import("../database/pool.js");
    const { get_all_product_names } = await import("../database/queries.js");
    await initialize_pool(false);
    const result = await get_all_product_names();
    if (!(result instanceof Set)) {
        console.warn("No product names found in database.");
        return false;
    }
    const product_names = Array.from(result);
    if (product_names.length === 0) {
        console.warn("No product names found in database.");
        return false;
    }
    product_lexicon = product_names;
    return true;
}
export async function refresh_lexicons() {
    const { initialize_pool } = await import("../database/pool.js");
    await initialize_pool(false);
    await _load_brand_lexicon_from_db();
    await _load_product_lexicon_from_db();
}
/**
 * Given a product title, extract structured data including brand names,
 * stemmed product names, and quantity values/types.
 */
export function parse_product_data(title) {
    const tokens = tokenizer.tokenize(title);
    if (tokens.length === 0) {
        return {};
    }
    if (tokens.length === 1) {
        const singleToken = tokens[0];
        const stemmed_product_name = PorterStemmer.stem(singleToken);
        return {
            tokens,
            stemmed_product_name
        };
    }
    const numeric_tokens = tokens.filter((token) => !Number.isNaN(parseFloat(token)));
    const alphabetic_tokens = tokens.filter((token) => _is_alphabetic(token));
    const brand_result = _find_brand_names(alphabetic_tokens, 3);
    const brand_tokens = brand_result.brand_names;
    const non_brand_tokens = brand_result.non_brand_tokens;
    const stemmed_non_brand_tokens = non_brand_tokens
        .map((token) => PorterStemmer.stem(token))
        .filter((token) => !packaging_lexicon.has(token.toLowerCase()));
    const stemmed_product_name = stemmed_non_brand_tokens.join(" ");
    const quantity_tokens = _extract_quantity_tokens(tokens);
    return {
        tokens,
        numeric_tokens,
        alphabetic_tokens,
        stemmed_product_name,
        brand_names: brand_tokens,
        quantity_values_and_types: quantity_tokens
    };
}
function _find_brand_names(tokens, maxN) {
    const cleaned = tokens.map((t) => t.replace(/[^\w'\-]/g, "").toLowerCase());
    const matchedIndices = new Set();
    const brand_names = [];
    for (let n = Math.min(maxN, cleaned.length); n >= 1; n--) {
        const ngrams = NGrams.ngrams(cleaned, n);
        for (let i = 0; i < ngrams.length; i++) {
            const gram = ngrams[i];
            const phrase = gram.join(" ").trim();
            if (brand_lexicon.includes(phrase)) {
                brand_names.push(phrase);
                for (let j = 0; j < n; j++) {
                    matchedIndices.add(i + j);
                }
            }
        }
    }
    const non_brand_tokens = tokens.filter((_, idx) => !matchedIndices.has(idx));
    return { brand_names, non_brand_tokens };
}
function _extract_quantity_tokens(tokens) {
    const quantity_tokens = tokens
        .map((token) => _get_quantity_value_and_type(token))
        .filter((token) => token !== null);
    for (let i = 0; i < tokens.length - 1; i++) {
        const current = tokens[i];
        if (!_is_numeric_only_token(current)) {
            continue;
        }
        let matched = false;
        for (let offset = 1; offset <= 2 && i + offset < tokens.length; offset++) {
            const candidate = tokens[i + offset];
            if (_is_quantity_indicator_only_token(candidate)) {
                const normalizedVariant = candidate.toLowerCase().replace(/[^a-z]/g, "");
                const canonical = _normalize_quantity_indicator(candidate);
                const numericValue = parseFloat(current);
                const converted = _convert_value_to_canonical(numericValue, normalizedVariant, canonical);
                quantity_tokens.push({ value: converted.value, type: converted.type });
                matched = true;
                break;
            }
        }
        if (!matched) {
            continue;
        }
    }
    return quantity_tokens;
}
function _get_quantity_value_and_type(token) {
    const lowerToken = token.toLowerCase();
    if (Number.isNaN(parseFloat(token)))
        return null;
    // find any known variant inside the token
    const lower = lowerToken.replace(/[^a-z]/g, "");
    let foundVariant = null;
    const variants = Object.keys(simplify_quantity_indicator).sort((a, b) => b.length - a.length);
    for (const variant of variants) {
        if (lower.includes(variant)) {
            foundVariant = variant;
            break;
        }
    }
    if (!foundVariant)
        return null;
    const rawValue = parseFloat(token);
    const canonical = simplify_quantity_indicator[foundVariant] || _normalize_quantity_indicator(foundVariant);
    const converted = _convert_value_to_canonical(rawValue, foundVariant, canonical);
    return { value: converted.value, type: converted.type };
}
function _is_numeric_only_token(token) {
    const cleaned = token.trim().replace(/,/g, "");
    return /^\d+(?:\.\d+)?$/.test(cleaned);
}
function _is_quantity_indicator_only_token(token) {
    const cleaned = token.toLowerCase().replace(/[^a-z]/g, "");
    const canonical = _normalize_quantity_indicator(token);
    const stripped = token.toLowerCase().replace(/[^a-z0-9]/g, "");
    // If the cleaned token is a known variant or maps to a canonical indicator, accept it
    if (Object.prototype.hasOwnProperty.call(simplify_quantity_indicator, cleaned))
        return QUANTITY_INDICATORS.includes(canonical);
    return QUANTITY_INDICATORS.includes(canonical) && (stripped === canonical || stripped === `${canonical}s`);
}
function _is_alphabetic(token) {
    const isAlpha = /^[a-zA-Z'"]+$/.test(token);
    if (!isAlpha)
        return false;
    const cleaned = token.toLowerCase().replace(/[^a-z]/g, "");
    if (Object.prototype.hasOwnProperty.call(simplify_quantity_indicator, cleaned))
        return false;
    return !QUANTITY_INDICATORS.some((indicator) => token.toLowerCase() === indicator);
}
async function main() {
    await refresh_lexicons();
    console.log(parse_product_data("Driscoll Strawberries 16oz, 2-pack"));
}
if (process.argv[1] && /(?:^|[\\/])nlp\.(?:ts|js)$/.test(process.argv[1])) {
    void main();
}
//# sourceMappingURL=nlp.js.map