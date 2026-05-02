import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";
import { initialize_pool } from "../database/pool.js";
import { get_all_brand_names, get_all_product_names } from "../database/queries.js";

const require = createRequire(import.meta.url);
const natural = require("natural") as {
  PorterStemmer: { stem: (word: string) => string };
  NGrams: { ngrams: (tokens: string[], n: number) => string[][] };
};

const { PorterStemmer, NGrams } = natural;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QuantityToken {
  value: number;
  type: string;
}

export interface ParsedProductData {
  tokens?: string[];
  numeric_tokens?: string[];
  alphabetic_tokens?: string[];
  stemmed_product_name?: string;
  brand_names?: string[];
  quantity_values_and_types?: QuantityToken[];
}

const tokenizer = {
  tokenize(text: string): string[] {
    return text.split(/\s+/).filter((token) => token.length > 0);
  }
};

const QUANTITY_INDICATORS = ["oz", "g", "kg", "lb", "ml", "l", "pack", "count"];

let brand_lexicon = _load_lexicon_csv("brand_names.csv");
const packaging_lexicon = new Set(
  _load_lexicon_csv("packaging_words.csv").map((term) => PorterStemmer.stem(term))
);
let product_lexicon: string[] = [];

function _load_lexicon_csv(csv_name: string): string[] {
  const csv_path = path.join(__dirname, csv_name);
  const csv_content = fs.readFileSync(csv_path, "utf-8");
  const lines = csv_content.trim().split("\n");
  return lines
    .slice(1)
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length > 0);
}

async function _load_brand_lexicon_from_db(): Promise<boolean> {
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

async function _load_product_lexicon_from_db(): Promise<boolean> {
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

export async function refresh_lexicons(): Promise<void> {
  await initialize_pool(false);
  await _load_brand_lexicon_from_db();
  await _load_product_lexicon_from_db();
}

/**
 * Given a product title, extract structured data including brand names,
 * stemmed product names, and quantity values/types.
 */
export function parse_product_data(title: string): ParsedProductData {
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

function _find_brand_names(tokens: string[], maxN: number): { brand_names: string[]; non_brand_tokens: string[] } {
  const cleaned = tokens.map((t) => t.replace(/[^\w'\-]/g, "").toLowerCase());
  const matchedIndices = new Set<number>();
  const brand_names: string[] = [];

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

function _extract_quantity_tokens(tokens: string[]): QuantityToken[] {
  const quantity_tokens = tokens
    .map((token) => _get_quantity_value_and_type(token))
    .filter((token): token is QuantityToken => token !== null);

  for (let i = 0; i < tokens.length - 1; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];
    if (!_is_numeric_only_token(current) || !_is_quantity_indicator_only_token(next)) {
      continue;
    }

    const numericValue = parseFloat(current);
    const normalizedNext = next.toLowerCase().replace(/[^a-z]/g, "");
    quantity_tokens.push({ value: numericValue, type: normalizedNext });
  }

  return quantity_tokens;
}

function _get_quantity_value_and_type(token: string): QuantityToken | null {
  const lowerToken = token.toLowerCase();
  if (!QUANTITY_INDICATORS.some((indicator) => lowerToken.includes(indicator)) || Number.isNaN(parseFloat(token))) {
    return null;
  }

  const value = parseFloat(token);
  const type = QUANTITY_INDICATORS.find((indicator) => lowerToken.includes(indicator));
  if (!type) {
    return null;
  }

  return { value, type };
}

function _is_numeric_only_token(token: string): boolean {
  const cleaned = token.trim().replace(/,/g, "");
  return /^\d+(?:\.\d+)?$/.test(cleaned);
}

function _is_quantity_indicator_only_token(token: string): boolean {
  const normalized = token.toLowerCase().replace(/[^a-z]/g, "");
  const stripped = token.toLowerCase().replace(/[^a-z0-9]/g, "");
  return QUANTITY_INDICATORS.includes(normalized) && stripped === normalized;
}

function _is_alphabetic(token: string): boolean {
  return /^[a-zA-Z'"]+$/.test(token) && !QUANTITY_INDICATORS.some((indicator) => token.toLowerCase() === indicator);
}

async function main(): Promise<void> {
  await refresh_lexicons();
  console.log(parse_product_data("Driscoll Strawberries 16oz, 2-pack"));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
