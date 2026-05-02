import fs from "fs";
import path from "path";
import { createRequire } from "module";

const localRequire = createRequire(path.resolve(process.cwd(), "package.json"));

let PorterStemmer: any;
let NGrams: any;

try {
  const natural = localRequire("natural");
  PorterStemmer = natural.PorterStemmer;
  NGrams = natural.NGrams;
} catch (error) {
  // Natural library has ESM-only dependencies (afinn-165) that fail in Jest's CommonJS.
  // Fallback to minimal implementations for testing.
  PorterStemmer = {
    stem: (word: string) => word.toLowerCase().replace(/s$/, "")
  };
  NGrams = {
    ngrams: (tokens: string[], n: number) => {
      if (n <= 0 || tokens.length < n) return [];
      const result = [];
      for (let i = 0; i <= tokens.length - n; i++) {
        result.push(tokens.slice(i, i + n));
      }
      return result;
    }
  };
}

const cjsDirname = typeof __dirname === "string" ? __dirname : undefined;

function resolveBackendAssetPath(fileName: string): string {
  const candidateDirs = [
    cjsDirname,
    path.resolve(process.cwd(), "src/backend"),
    path.resolve(process.cwd(), "dist/backend")
  ].filter((dir): dir is string => Boolean(dir));

  for (const dir of candidateDirs) {
    const candidate = path.join(dir, fileName);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Unable to locate NLP asset file: ${fileName}`);
}

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

// Canonical simplified quantity indicators (all lowercase)
const QUANTITY_INDICATORS = [
  "oz",
  "g",
  "lb",
  "l",
  "quart",
  "count"
];

// Map variations -> simplified canonical indicator (all lowercase)
// Canonical targets: oz, g, lb, l, quart, count
const simplify_quantity_indicator: Record<string, string> = {
  // ounces
  ounce: "oz",
  ounces: "oz",
  ozs: "oz",
  oz: "oz",

  // grams & kilograms -> canonical `g`
  g: "g",
  gram: "g",
  grams: "g",
  kg: "g",
  kilogram: "g",
  kilograms: "g",

  // pounds -> canonical `lb`
  lb: "lb",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",

  // milliliters & liters -> canonical `l`
  ml: "l",
  milliliter: "l",
  milliliters: "l",
  l: "l",
  liter: "l",
  liters: "l",

  // packaging / counts -> canonical `count`
  pack: "count",
  packs: "count",
  count: "count",
  counts: "count",
  ct: "count",
  pcs: "count",
  pc: "count",
  piece: "count",
  pieces: "count",

  // volume -> canonical `quart`
  quart: "quart",
  quarts: "quart",
  gallon: "quart",
  gallons: "quart",

  // produce (treated as count)
  root: "count",
  roots: "count"
};


let brand_lexicon = _load_lexicon_csv("brand_names.csv");
const packaging_lexicon = new Set(
  _load_lexicon_csv("packaging_words.csv").map((term) => PorterStemmer.stem(term))
);
let product_lexicon: string[] = [];

function _load_lexicon_csv(csv_name: string): string[] {
  const csv_path = resolveBackendAssetPath(csv_name);
  const csv_content = fs.readFileSync(csv_path, "utf-8");
  const lines = csv_content.trim().split("\n");
  return lines
    .slice(1)
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length > 0);
}

async function _load_brand_lexicon_from_db(): Promise<boolean> {
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

async function _load_product_lexicon_from_db(): Promise<boolean> {
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

export async function refresh_lexicons(): Promise<void> {
  const { initialize_pool } = await import("../database/pool.js");
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

function _get_quantity_value_and_type(token: string): QuantityToken | null {
  const lowerToken = token.toLowerCase();
  if (Number.isNaN(parseFloat(token))) return null;

  // find any known variant inside the token
  const lower = lowerToken.replace(/[^a-z]/g, "");
  let foundVariant: string | null = null;
  const variants = Object.keys(simplify_quantity_indicator).sort((a, b) => b.length - a.length);
  for (const variant of variants) {
    if (lower.includes(variant)) {
      foundVariant = variant;
      break;
    }
  }

  if (!foundVariant) return null;

  const rawValue = parseFloat(token);
  const canonical = simplify_quantity_indicator[foundVariant] || _normalize_quantity_indicator(foundVariant);
  const converted = _convert_value_to_canonical(rawValue, foundVariant, canonical);
  return { value: converted.value, type: converted.type };
}

function _convert_value_to_canonical(value: number, originalVariant: string, canonical: string): { value: number; type: string } {
  const v = value;
  switch (canonical) {
    case "g":
      // kg -> g (handled by mapping where variant 'kg' -> 'g')
      if (originalVariant === "kg" || originalVariant === "kilogram" || originalVariant === "kilograms") {
        return { value: v * 1000, type: "g" };
      }
      // otherwise assume already grams
      return { value: v, type: "g" };
    case "l":
      // ml -> l
      if (originalVariant === "ml" || originalVariant === "milliliter" || originalVariant === "milliliters") {
        return { value: v / 1000, type: "l" };
      }
      return { value: v, type: "l" };
    case "quart":
      // gallon -> quart
      if (originalVariant === "gallon" || originalVariant === "gallons") {
        return { value: v * 4, type: "quart" };
      }
      return { value: v, type: "quart" };
    case "oz":
      // keep ounces as-is
      return { value: v, type: "oz" };
    case "lb":
      return { value: v, type: "lb" };
    case "count":
      return { value: v, type: "count" };
    default:
      return { value: v, type: canonical };
  }
}

function _is_numeric_only_token(token: string): boolean {
  const cleaned = token.trim().replace(/,/g, "");
  return /^\d+(?:\.\d+)?$/.test(cleaned);
}

function _is_quantity_indicator_only_token(token: string): boolean {
  const cleaned = token.toLowerCase().replace(/[^a-z]/g, "");
  const canonical = _normalize_quantity_indicator(token);
  const stripped = token.toLowerCase().replace(/[^a-z0-9]/g, "");
  // If the cleaned token is a known variant or maps to a canonical indicator, accept it
  if (Object.prototype.hasOwnProperty.call(simplify_quantity_indicator, cleaned)) return QUANTITY_INDICATORS.includes(canonical);
  return QUANTITY_INDICATORS.includes(canonical) && (stripped === canonical || stripped === `${canonical}s`);
}

function _normalize_quantity_indicator(token: string): string {
  const cleaned = token.toLowerCase().replace(/[^a-z]/g, "");

  if (cleaned.length === 0) return cleaned;

  // If there's a direct mapping for the cleaned token, return the canonical form
  if (Object.prototype.hasOwnProperty.call(simplify_quantity_indicator, cleaned)) {
    return simplify_quantity_indicator[cleaned];
  }

  // If cleaned is plural (ends with 's'), try stripping and mapping
  if (cleaned.endsWith("s") && cleaned.length > 1) {
    const singular = cleaned.slice(0, -1);
    if (Object.prototype.hasOwnProperty.call(simplify_quantity_indicator, singular)) {
      return simplify_quantity_indicator[singular];
    }
    if (QUANTITY_INDICATORS.includes(singular)) {
      return singular;
    }
  }

  // Fallback: if cleaned already matches a canonical indicator, return it
  if (QUANTITY_INDICATORS.includes(cleaned)) {
    return cleaned;
  }

  return cleaned;
}

function _is_alphabetic(token: string): boolean {
  const isAlpha = /^[a-zA-Z'"]+$/.test(token);
  if (!isAlpha) return false;
  const cleaned = token.toLowerCase().replace(/[^a-z]/g, "");
  if (Object.prototype.hasOwnProperty.call(simplify_quantity_indicator, cleaned)) return false;
  return !QUANTITY_INDICATORS.some((indicator) => token.toLowerCase() === indicator);
}

async function main(): Promise<void> {
  await refresh_lexicons();
  console.log(parse_product_data("Driscoll Strawberries 16oz, 2-pack"));
}

if (process.argv[1] && /(?:^|[\\/])nlp\.(?:ts|js)$/.test(process.argv[1])) {
  void main();
}
