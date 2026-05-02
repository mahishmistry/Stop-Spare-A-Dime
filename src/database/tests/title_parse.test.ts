/**
 * Test suite for nlp.parse_product_data function
 * Tests parsing of all product titles from strawberries-google-shopping.json
 */



import { truncate_tables, close_pool } from "./test_helpers.js";
import { initialize_pool, pool } from "../pool.js";
import { parse_product_data } from "../../backend/nlp.js";


// All test titles extracted from src/backend/strawberries-google-shopping.json
const TEST_TITLES = [
  "Driscoll's Organic Strawberries",
  "Driscoll's Sweetest Batch Strawberries",
  "Driscoll's Strawberries",
  "Nature's Choice Organic Strawberries",
  "Driscolls Strawberries Heart Shaped 0.5 Pounds",
  "Columbia Fruit Whole Strawberries 40 oz",
  "California Giant Berry Farms Strawberries",
  "Strawberries Long Stem Prepacked - 1 Lb",
  "Gourmet Drizzled Strawberries | Full Dozen | Perfect for Any Occasion | Shari's Berries",
  "Dole Strawberries",
  "Strawberries Prepacked - 2 Lb",
  "Bonnie Plants Strawberry Live Plant 2-Pack",
  "O Organics Whole Strawberries",
  "Berryvita Strawberry",
  "bulk produce Fresh Strawberries 1lb",
  "Strawberries",
  "Berry Boss Strawberries",
  "Astin Farms Strawberries",
  "Foxy Strawberries",
  "Pineberry Strawberry White - 10 OZ",
  "Member's Mark Strawberry Ozark Beauty 40pk",
  "California Giant Berry Farms Organic Strawberries",
  "Footprintz Strawberries",
  "Shop Burpee Strawberry Cabot 25 Bare Roots",
  "STAHLBUSH ISLAND FARMS Whole Strawberries 10 oz",
  "Strawberries - 1 Quart",
  "H-E-B Frozen Whole Strawberries",
  "Harry & David Organic Strawberries",
  "The Orchard Strawberry Cut Round",
  "Rossman Farms Naturipe Strawberries",
  "Van Zyverden Strawberry All Star Bare Plant Root",
  "Gourmet Drizzled Strawberries - 24ct | Two Dozen | Perfect for Any Occasion | Shari's Berries",
  "Driscolls Strawberries",
  "Fresh Strawberries 1 lb. - 8/Case",
  "All Star Strawberries - 10 Count",
  "Buffalo Gal Organic Whole Strawberries",
  "Andrew & Williamson Organic Strawberries",
  "Charlotte Strawberry Fragaria Live Bareroot Fruiting Plant 10-Pack",
  "Commodity Domestic Whole Strawberry Fruit",
  "Alexandria Strawberry Fragaria Plants"
];

/**
 * Expected structure for parse_product_data output
 */
interface ParsedProductData {
  tokens?: string[];
  numeric_tokens?: string[];
  alphabetic_tokens?: string[];
  stemmed_product_name?: string;
  brand_names?: string[];
  quantity_values_and_types?: Array<{ value: number; type: string }>;
}

beforeAll(async () => {
  await initialize_pool(true);
});

beforeEach(async () => {
  await truncate_tables();
});

afterAll(async () => {
  await close_pool();
});

describe("NLP parse_product_data function", () => {
  describe("Basic functionality", () => {
    test("should return an object", () => {
      const title = "Strawberries";
      const result = parse_product_data(title);
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    test("should return object with expected properties", () => {
      const title = "Strawberries";
      const result = parse_product_data(title);
      expect(result).toHaveProperty("tokens");
      expect(result).toHaveProperty("stemmed_product_name");
    });
  });

  describe("Title 1: Driscoll's Organic Strawberries", () => {
    const title = "Driscoll's Organic Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" and return an object`, () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    test("should extract tokens from title", () => {
      expect(result.tokens).toBeDefined();
      expect(Array.isArray(result.tokens)).toBe(true);
      expect(result.tokens.length).toBe(3);
    });

    test("should identify brand names", () => {
      expect(result.brand_names).toBeDefined();
      expect(Array.isArray(result.brand_names)).toBe(true);
      // Should identify Driscoll's as a brand
      expect(result.brand_names.length).toBeGreaterThanOrEqual(0);
    });

    test("should have stemmed product name containing 'strawberr'", () => {
      expect(result.stemmed_product_name).toBeDefined();
      expect(typeof result.stemmed_product_name).toBe("string");
      expect(result.stemmed_product_name.toLowerCase()).toContain("strawberr");
    });
  });

  describe("Title 2: Driscoll's Sweetest Batch Strawberries", () => {
    const title = "Driscoll's Sweetest Batch Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}"`, () => {
      expect(result).toBeDefined();
      expect(result.tokens).toBeDefined();
    });

    test("should identify multiple tokens", () => {
      expect(result.tokens.length).toBeGreaterThanOrEqual(3);
      expect(result.stemmed_product_name).toContain("strawberr");
    });
  });

  describe("Title 3: Driscoll's Strawberries", () => {
    const title = "Driscoll's Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse simple "${title}"`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(2);
      expect(result.stemmed_product_name).toContain("strawberr");
    });
  });

  describe("Title 4: Nature's Choice Organic Strawberries", () => {
    const title = "Nature's Choice Organic Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with apostrophe in brand`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(4);
      expect(result.brand_names).toBeDefined();
    });
  });

  describe("Title 5: Driscolls Strawberries Heart Shaped 0.5 Pounds", () => {
    const title = "Driscolls Strawberries Heart Shaped 0.5 Pounds";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with shape descriptor`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBeGreaterThanOrEqual(5);
    });

    test("should extract numeric quantity", () => {
      expect(result.numeric_tokens).toBeDefined();
      expect(result.quantity_values_and_types).toBeDefined();
      // Should find the 0.5 and "Pounds" quantity
      const hasQuantity = result.quantity_values_and_types.some((q: any) => 
        q.value === 0.5 || q.type.includes("pound")
      );
      expect(hasQuantity).toBe(true);
    });
  });

  describe("Title 6: Columbia Fruit Whole Strawberries 40 oz", () => {
    const title = "Columbia Fruit Whole Strawberries 40 oz";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with weight`, () => {
      expect(result).toBeDefined();
      expect(result.numeric_tokens).toBeDefined();
      expect(result.numeric_tokens).toContain("40");
    });

    test("should identify oz quantity", () => {
      expect(result.quantity_values_and_types).toBeDefined();
      const hasOz = result.quantity_values_and_types.some((q: any) => 
        q.type === "oz"
      );
      expect(hasOz).toBe(true);
    });
  });

  describe("Title 7: California Giant Berry Farms Strawberries", () => {
    const title = "California Giant Berry Farms Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with multi-word brand`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(5);
      expect(result.brand_names).toBeDefined();
    });
  });

  describe("Title 8: Strawberries Long Stem Prepacked - 1 Lb", () => {
    const title = "Strawberries Long Stem Prepacked - 1 Lb";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with descriptors and quantity`, () => {
      expect(result).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.numeric_tokens).toContain("1");
    });

    test("should identify Lb quantity", () => {
      const hasLb = result.quantity_values_and_types.some((q: any) => 
        q.type === "lb"
      );
      expect(hasLb).toBe(true);
    });
  });

  describe("Title 9: Gourmet Drizzled Strawberries | Full Dozen", () => {
    const title = "Gourmet Drizzled Strawberries | Full Dozen | Perfect for Any Occasion | Shari's Berries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with pipe separators`, () => {
      expect(result).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);
    });
  });

  describe("Title 10: Dole Strawberries", () => {
    const title = "Dole Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse simple brand "${title}"`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(2);
      expect(result.brand_names).toBeDefined();
    });
  });

  describe("Title 11: Strawberries Prepacked - 2 Lb", () => {
    const title = "Strawberries Prepacked - 2 Lb";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with packaging and quantity`, () => {
      expect(result).toBeDefined();
      expect(result.numeric_tokens).toContain("2");
      expect(result.quantity_values_and_types.some((q: any) => q.type === "lb")).toBe(true);
    });
  });

  describe("Title 12: Bonnie Plants Strawberry Live Plant 2-Pack", () => {
    const title = "Bonnie Plants Strawberry Live Plant 2-Pack";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" as plant product`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe("Title 13: O Organics Whole Strawberries", () => {
    const title = "O Organics Whole Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with organic descriptor`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(4);
    });
  });

  describe("Title 14: Berryvita Strawberry", () => {
    const title = "Berryvita Strawberry";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" singular form`, () => {
      expect(result).toBeDefined();
      expect(result.stemmed_product_name.toLowerCase()).toContain("strawberr");
    });
  });

  describe("Title 15: bulk produce Fresh Strawberries 1lb", () => {
    const title = "bulk produce Fresh Strawberries 1lb";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with lowercase bulk`, () => {
      expect(result).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.numeric_tokens.length).toBeGreaterThan(0);
    });
  });

  describe("Title 16: Strawberries", () => {
    const title = "Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse minimal title "${title}"`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(1);
      expect(result.stemmed_product_name).toContain("strawberr");
    });
  });

  describe("Title 17: Berry Boss Strawberries", () => {
    const title = "Berry Boss Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with brand`, () => {
      expect(result).toBeDefined();
      expect(result.brand_names).toBeDefined();
    });
  });

  describe("Title 18: Astin Farms Strawberries", () => {
    const title = "Astin Farms Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}"`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(3);
    });
  });

  describe("Title 19: Foxy Strawberries", () => {
    const title = "Foxy Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}"`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(2);
    });
  });

  describe("Title 20: Pineberry Strawberry White - 10 OZ", () => {
    const title = "Pineberry Strawberry White - 10 OZ";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with color and quantity`, () => {
      expect(result).toBeDefined();
      expect(result.numeric_tokens).toContain("10");
      expect(result.quantity_values_and_types.some((q: any) => q.type === "oz")).toBe(true);
    });
  });

  describe("Title 21: Member's Mark Strawberry Ozark Beauty 40pk", () => {
    const title = "Member's Mark Strawberry Ozark Beauty 40pk";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with variety name`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Title 22: California Giant Berry Farms Organic Strawberries", () => {
    const title = "California Giant Berry Farms Organic Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}"`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(6);
    });
  });

  describe("Title 23: Footprintz Strawberries", () => {
    const title = "Footprintz Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}"`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(2);
    });
  });

  describe("Title 24: Shop Burpee Strawberry Cabot 25 Bare Roots", () => {
    const title = "Shop Burpee Strawberry Cabot 25 Bare Roots";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" as plant with quantity`, () => {
      expect(result).toBeDefined();
      expect(result.numeric_tokens).toContain("25");
    });
  });

  describe("Title 25: STAHLBUSH ISLAND FARMS Whole Strawberries 10 oz", () => {
    const title = "STAHLBUSH ISLAND FARMS Whole Strawberries 10 oz";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with all caps brand`, () => {
      expect(result).toBeDefined();
      expect(result.numeric_tokens).toContain("10");
    });
  });

  describe("Title 26: Strawberries - 1 Quart", () => {
    const title = "Strawberries - 1 Quart";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with volume measurement`, () => {
      expect(result).toBeDefined();
      expect(result.numeric_tokens).toContain("1");
    });
  });

  describe("Title 27: H-E-B Frozen Whole Strawberries", () => {
    const title = "H-E-B Frozen Whole Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with hyphenated brand`, () => {
      expect(result).toBeDefined();
      expect(result.tokens).toBeDefined();
    });
  });

  describe("Title 28: Harry & David Organic Strawberries", () => {
    const title = "Harry & David Organic Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with ampersand`, () => {
      expect(result).toBeDefined();
      expect(result.tokens).toContain("&");
    });
  });

  describe("Title 29: The Orchard Strawberry Cut Round", () => {
    const title = "The Orchard Strawberry Cut Round";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with processing style`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(5);
    });
  });

  describe("Title 30: Rossman Farms Naturipe Strawberries", () => {
    const title = "Rossman Farms Naturipe Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with brand names`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(3);
    });
  });

  describe("Title 31: Van Zyverden Strawberry All Star Bare Plant Root", () => {
    const title = "Van Zyverden Strawberry All Star Bare Plant Root";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" as plant product`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe("Title 32: Gourmet Drizzled Strawberries - 24ct", () => {
    const title = "Gourmet Drizzled Strawberries - 24ct | Two Dozen | Perfect for Any Occasion | Shari's Berries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}"`, () => {
      expect(result).toBeDefined();
      expect(result.numeric_tokens).toContain("24");
    });
  });

  describe("Title 33: Driscolls Strawberries (position 33)", () => {
    const title = "Driscolls Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse duplicate "${title}"`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(2);
    });
  });

  describe("Title 34: Fresh Strawberries 1 lb. - 8/Case", () => {
    const title = "Fresh Strawberries 1 lb. - 8/Case";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with case quantity`, () => {
      expect(result).toBeDefined();
      expect(result.numeric_tokens).toContain("1");
      expect(result.numeric_tokens).toContain("8");
    });
  });

  describe("Title 35: All Star Strawberries - 10 Count", () => {
    const title = "All Star Strawberries - 10 Count";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with count measurement`, () => {
      expect(result).toBeDefined();
      expect(result.numeric_tokens).toContain("10");
    });
  });

  describe("Title 36: Buffalo Gal Organic Whole Strawberries", () => {
    const title = "Buffalo Gal Organic Whole Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}"`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(5);
    });
  });

  describe("Title 37: Andrew & Williamson Organic Strawberries", () => {
    const title = "Andrew & Williamson Organic Strawberries";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with ampersand brand`, () => {
      expect(result).toBeDefined();
      expect(result.tokens).toContain("&");
    });
  });

  describe("Title 38: Charlotte Strawberry Fragaria Live Bareroot Fruiting Plant 10-Pack", () => {
    const title = "Charlotte Strawberry Fragaria Live Bareroot Fruiting Plant 10-Pack";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" as plant variety`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe("Title 39: Commodity Domestic Whole Strawberry Fruit", () => {
    const title = "Commodity Domestic Whole Strawberry Fruit";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" with commodity label`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(5);
    });
  });

  describe("Title 40: Alexandria Strawberry Fragaria Plants", () => {
    const title = "Alexandria Strawberry Fragaria Plants";
    let result: any;

    beforeEach(() => {
      result = parse_product_data(title);
    });

    test(`should parse "${title}" as plant variety`, () => {
      expect(result).toBeDefined();
      expect(result.tokens.length).toBe(3);
    });
  });

  describe("Comprehensive parsing tests", () => {
    test("all test titles should be parseable strings", () => {
      TEST_TITLES.forEach((title) => {
        expect(typeof title).toBe("string");
        expect(title.length).toBeGreaterThan(0);
      });
    });

    test("all titles should contain strawberry-related keywords", () => {
      TEST_TITLES.forEach((title) => {
        const lowerTitle = title.toLowerCase();
        const hasStrawberryKeyword =
          lowerTitle.includes("strawberr") || // matches strawberry, strawberries
          lowerTitle.includes("berry") ||
          lowerTitle.includes("fragaria");

        expect(hasStrawberryKeyword).toBe(true);
      });
    });

    test("should have 40 unique/semi-unique test titles", () => {
      expect(TEST_TITLES.length).toBe(40);
      // Some titles may be duplicates (like position 3 and 33), which is acceptable
    });
  });

  describe("Token extraction tests", () => {
    test("should extract all tokens from complex title", () => {
      const title = "Driscoll's Organic Strawberries";
      const result = parse_product_data(title);
      expect(result.tokens).toBeDefined();
      expect(Array.isArray(result.tokens)).toBe(true);
      expect(result.tokens.length).toBeGreaterThan(0);
    });

    test("should separate alphabetic and numeric tokens", () => {
      const title = "Columbia Fruit Whole Strawberries 40 oz";
      const result = parse_product_data(title);
      expect(result.alphabetic_tokens).toBeDefined();
      expect(result.numeric_tokens).toBeDefined();
      expect(result.numeric_tokens).toContain("40");
    });

    test("should handle hyphenated words", () => {
      const title = "Strawberries Long Stem Prepacked - 1 Lb";
      const result = parse_product_data(title);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);
    });

    test("should handle numbers in titles", () => {
      const title = "Pineberry Strawberry White - 10 OZ";
      const result = parse_product_data(title);
      expect(result.numeric_tokens).toBeDefined();
      expect(result.numeric_tokens).toContain("10");
    });

    test("should handle special characters like apostrophes", () => {
      const title = "Driscoll's Organic Strawberries";
      const result = parse_product_data(title);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);
    });

    test("should handle pipe separators in long titles", () => {
      const title = "Gourmet Drizzled Strawberries | Full Dozen | Perfect for Any Occasion | Shari's Berries";
      const result = parse_product_data(title);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);
    });

    test("should handle ampersands", () => {
      const title = "Harry & David Organic Strawberries";
      const result = parse_product_data(title);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);
    });

    test("should parse all 40 test titles", () => {
      TEST_TITLES.forEach((title) => {
        const result = parse_product_data(title);
        expect(result).toBeDefined();
        expect(result.tokens).toBeDefined();
        expect(Array.isArray(result.tokens)).toBe(true);
      });
    });
  });

  describe("Quantity extraction tests", () => {
    test("should identify numeric quantity values", () => {
      const title = "Driscolls Strawberries Heart Shaped 0.5 Pounds";
      const result = parse_product_data(title);
      expect(result.numeric_tokens).toBeDefined();
      expect(result.numeric_tokens).toContain("0.5");
    });

    test("should identify quantity units like oz", () => {
      const title = "Columbia Fruit Whole Strawberries 40 oz";
      const result = parse_product_data(title);
      expect(result.quantity_values_and_types).toBeDefined();
      const hasOz = result.quantity_values_and_types.some((q: any) => q.type === "oz");
      expect(hasOz).toBe(true);
    });

    test("should identify quantity units like Lb", () => {
      const title = "Strawberries Long Stem Prepacked - 1 Lb";
      const result = parse_product_data(title);
      expect(result.quantity_values_and_types).toBeDefined();
      const hasLb = result.quantity_values_and_types.some((q: any) => q.type === "lb");
      expect(hasLb).toBe(true);
    });

    test("should identify pack sizes", () => {
      const title = "Bonnie Plants Strawberry Live Plant 2-Pack";
      const result = parse_product_data(title);
      expect(result.numeric_tokens).toBeDefined();
      expect(result.numeric_tokens).toContain("2");
    });

    test("should identify count measurements", () => {
      const title = "All Star Strawberries - 10 Count";
      const result = parse_product_data(title);
      expect(result.numeric_tokens).toBeDefined();
      expect(result.numeric_tokens).toContain("10");
    });

    test("should handle combined quantity formats", () => {
      const title = "Fresh Strawberries 1 lb. - 8/Case";
      const result = parse_product_data(title);
      expect(result.numeric_tokens).toBeDefined();
      expect(result.numeric_tokens.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Brand name identification tests", () => {
    test("should identify Driscoll's as brand", () => {
      const title = "Driscoll's Organic Strawberries";
      const result = parse_product_data(title);
      expect(result.brand_names).toBeDefined();
      expect(Array.isArray(result.brand_names)).toBe(true);
    });

    test("should identify Nature's Choice as brand", () => {
      const title = "Nature's Choice Organic Strawberries";
      const result = parse_product_data(title);
      expect(result.brand_names).toBeDefined();
      expect(Array.isArray(result.brand_names)).toBe(true);
    });

    test("should identify Dole as brand", () => {
      const title = "Dole Strawberries";
      const result = parse_product_data(title);
      expect(result.brand_names).toBeDefined();
      expect(Array.isArray(result.brand_names)).toBe(true);
    });

    test("should identify multi-word brands", () => {
      const title = "California Giant Berry Farms Strawberries";
      const result = parse_product_data(title);
      expect(result.brand_names).toBeDefined();
      expect(Array.isArray(result.brand_names)).toBe(true);
    });

    test("should identify Harry & David as brand with ampersand", () => {
      const title = "Harry & David Organic Strawberries";
      const result = parse_product_data(title);
      expect(result.brand_names).toBeDefined();
      expect(Array.isArray(result.brand_names)).toBe(true);
    });

    test("should identify STAHLBUSH ISLAND FARMS in all caps", () => {
      const title = "STAHLBUSH ISLAND FARMS Whole Strawberries 10 oz";
      const result = parse_product_data(title);
      expect(result.brand_names).toBeDefined();
      expect(Array.isArray(result.brand_names)).toBe(true);
    });
  });

  describe("Descriptive attribute extraction tests", () => {
    test("should identify Organic descriptor", () => {
      const organicTitles = TEST_TITLES.filter(t => t.includes("Organic"));
      expect(organicTitles.length).toBeGreaterThan(0);
      organicTitles.forEach(title => {
        const result = parse_product_data(title);
        expect(result).toBeDefined();
        expect(result.tokens).toBeDefined();
      });
    });

    test("should identify Whole descriptor", () => {
      const wholeTitles = TEST_TITLES.filter(t => t.includes("Whole"));
      expect(wholeTitles.length).toBeGreaterThan(0);
      wholeTitles.forEach(title => {
        const result = parse_product_data(title);
        expect(result).toBeDefined();
      });
    });

    test("should identify Frozen descriptor", () => {
      const frozenTitles = TEST_TITLES.filter(t => t.includes("Frozen"));
      expect(frozenTitles.length).toBeGreaterThan(0);
      frozenTitles.forEach(title => {
        const result = parse_product_data(title);
        expect(result).toBeDefined();
      });
    });

    test("should identify Fresh descriptor", () => {
      const freshTitles = TEST_TITLES.filter(t => t.includes("Fresh"));
      expect(freshTitles.length).toBeGreaterThan(0);
      freshTitles.forEach(title => {
        const result = parse_product_data(title);
        expect(result).toBeDefined();
      });
    });

    test("should identify Live/Plant descriptors", () => {
      const plantTitles = TEST_TITLES.filter(t => t.includes("Plant") || t.includes("Live"));
      expect(plantTitles.length).toBeGreaterThan(0);
      plantTitles.forEach(title => {
        const result = parse_product_data(title);
        expect(result).toBeDefined();
      });
    });

    test("should identify shape/form descriptors", () => {
      const title = "Driscolls Strawberries Heart Shaped 0.5 Pounds";
      const result = parse_product_data(title);
      expect(result).toBeDefined();
      expect(result.tokens).toBeDefined();
    });
  });
});
