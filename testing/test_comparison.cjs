const mockData = {
    shopping_results: [
        {
            product_id: "1",
            title: "Strawberries 16 oz",
            extracted_price: 4.00,
            source: "Store A"
            // weight/unit will be passed via itemMetrics
        },
        {
            product_id: "2",
            title: "Strawberries 2 lb",
            extracted_price: 7.00,
            source: "Store B",
            // Alternatively, properties can be on the item itself
            weight: 2,
            unit: 'lb'
        },
        {
            product_id: "3",
            title: "Strawberries (No weight)",
            extracted_price: 5.00,
            source: "Store C"
        }
    ]
};

// NOW require the module
const { getBestItems } = require('../src/backend/comparison.cjs');

const runTests = () => {
    console.log("Running Unit Price Comparison Tests...");

    // Test Case 1: Unit Price sorting
    // Item 1 is passed via itemMetrics: $4.00 / 16 oz = $0.25/oz
    // Item 2 has properties on the object: $7.00 / 32 oz = $0.218/oz
    // Item 3 has no weight/unit, so it should be filtered out.
    // Order should be Item 2, then Item 1. Item 3 should be missing.
    
    let mockReq = {
        query: {
            criteria: 'unit price'
        }
    };
    
    let mockRes = {
        status: function(s) { this.statusCode = s; return this; },
        json: function(data) { this.data = data; return this; }
    };

    const itemMetrics = {
        "1": { weight: 16, unit: "oz" }
    };

    getBestItems(mockData.shopping_results, mockReq, mockRes, [], itemMetrics);

    if (mockRes.data && mockRes.data.length === 2 && mockRes.data[0].product_id === "2" && mockRes.data[1].product_id === "1") {
        console.log("Test Case 1 Passed: Sorted correctly and filtered out items without weight/unit.");
    } else {
        console.error("Test Case 1 Failed: Expected item 2 to be first, followed by item 1. Item 3 should be omitted.");
        console.log("Actual order:", mockRes.data ? mockRes.data.map(i => i.product_id) : "No data");
    }

    // Test Case 2: Invalid criteria
    mockReq.query.criteria = 'invalid';
    getBestItems(mockData.shopping_results, mockReq, mockRes);
    if (mockRes.statusCode === 400) {
        console.log("Test Case 2 Passed: Handled invalid criteria.");
    } else {
        console.error("Test Case 2 Failed: Expected 400 status code.");
    }
};

runTests();
