import { add_user, get_user_by_email, add_store, get_store_by_source, add_store_location, add_product, get_product_by_id, get_product_by_name, add_item, get_item_by_store_item_id, get_item_by_id, get_item_by_name, add_deal, get_deal_by_id, } from '../queries.ts';
from;
'../queries.js';
import { initialize_pool } from '../pool.js';
import { truncate_tables, close_pool } from './test_helpers.js';
async function main() {
    await initialize_pool(true); // Initialize the database connection pool in test mode
    await truncate_tables(); // Clear the database tables before running the tests
    try {
        console.log("Testing add_user...");
        const user = await add_user("josie_test@example.com", "Josie Test");
        console.log(user);
        console.log("Testing get_user_by_email...");
        const foundUser = await get_user_by_email("josie_test@example.com");
        console.log(foundUser);
        console.log("Testing add_store...");
        const store = await add_store("test_store", "https://example.com");
        console.log(store);
        console.log("Testing get_store_by_source...");
        const foundStore = await get_store_by_source("test_store");
        console.log(foundStore);
        console.log("Testing add_store_location...");
        const location = await add_store_location("test_store", {
            street: "123 Main St",
            city: "Amherst",
            state: "MA",
            zip_code: "01002",
        });
        console.log(location);
        console.log("Testing add_product...");
        const product = await add_product("Test Milk");
        console.log(product);
        console.log("Testing get_product_by_id...");
        const foundProductById = await get_product_by_id(product.product_id);
        console.log(foundProductById);
        console.log("Testing get_product_by_name...");
        const foundProductByName = await get_product_by_name("Test Milk");
        console.log(foundProductByName);
        console.log("Testing add_item...");
        const item = await add_item(product.product_id, "test_store", 1111, 4.5, 10, 1, null);
        console.log(item);
        console.log("Testing get_item_by_store_item_id...");
        const foundItemByStoreId = await get_item_by_store_item_id("test_store", 1111);
        console.log(foundItemByStoreId);
        console.log("Testing get_item_by_id...");
        const foundItemById = await get_item_by_id(item.item_id);
        console.log(foundItemById);
        console.log("Testing get_item_by_name...");
        const foundItemsByName = await get_item_by_name("Test Milk");
        console.log(foundItemsByName);
        console.log("Testing add_deal...");
        const deal = await add_deal(item.item_id, 5.99, true, new Date(), 4.99, false);
        console.log(deal);
        console.log("Testing get_deal_by_id...");
        const foundDeal = await get_deal_by_id(deal.deal_id);
        console.log(foundDeal);
        console.log("All tests finished.");
    }
    catch (err) {
        console.error("Test failed:", err);
    }
    await close_pool(); // Close the database connection pool after running the tests
}
main();
//# sourceMappingURL=test_general_queries.js.map