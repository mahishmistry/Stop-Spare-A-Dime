// Quantity unit canonicalization and conversion helpers
// Canonical targets: oz, g, lb, l, quart, count
export const QUANTITY_INDICATORS = ["oz", "g", "lb", "l", "quart", "count"];
export const simplify_quantity_indicator = {
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
export function _normalize_quantity_indicator(token) {
    const cleaned = token.toLowerCase().replace(/[^a-z]/g, "");
    if (cleaned.length === 0)
        return cleaned;
    if (Object.prototype.hasOwnProperty.call(simplify_quantity_indicator, cleaned)) {
        return simplify_quantity_indicator[cleaned];
    }
    if (cleaned.endsWith("s") && cleaned.length > 1) {
        const singular = cleaned.slice(0, -1);
        if (Object.prototype.hasOwnProperty.call(simplify_quantity_indicator, singular)) {
            return simplify_quantity_indicator[singular];
        }
        if (QUANTITY_INDICATORS.includes(singular)) {
            return singular;
        }
    }
    if (QUANTITY_INDICATORS.includes(cleaned)) {
        return cleaned;
    }
    return cleaned;
}
export function _convert_value_to_canonical(value, originalVariant, canonical) {
    const v = value;
    switch (canonical) {
        case "g":
            if (originalVariant === "kg" || originalVariant === "kilogram" || originalVariant === "kilograms") {
                return { value: v * 1000, type: "g" };
            }
            return { value: v, type: "g" };
        case "l":
            if (originalVariant === "ml" || originalVariant === "milliliter" || originalVariant === "milliliters") {
                return { value: v / 1000, type: "l" };
            }
            return { value: v, type: "l" };
        case "quart":
            if (originalVariant === "gallon" || originalVariant === "gallons") {
                return { value: v * 4, type: "quart" };
            }
            return { value: v, type: "quart" };
        case "oz":
            return { value: v, type: "oz" };
        case "lb":
            return { value: v, type: "lb" };
        case "count":
            return { value: v, type: "count" };
        default:
            return { value: v, type: canonical };
    }
}
//# sourceMappingURL=quantity.js.map