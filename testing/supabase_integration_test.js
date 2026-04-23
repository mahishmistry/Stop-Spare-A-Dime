import 'dotenv/config';
import { add_store, add_product, add_item, add_deal, get_item_by_id } from '../src/database/queries.ts';
import { pool, initialize_pool } from '../src/database/pool.ts';

async function runTest() {
    // Set to FALSE to use the REMOTE production/real database configuration from .env
    await initialize_pool(false);

    const baseUrl = 'http://localhost:3000';

    try {
        console.log("1. Searching Strawberries with 01003 zipcode...");
        const searchRes = await fetch(`${baseUrl}/api/prices?product=Strawberries&zipCode=01003`);
        const searchData = await searchRes.json();
        console.log(`Found ${searchData.count || 0} items.`);

        console.log("2. Comparing by bang for buck...");
        const compareRes = await fetch(`${baseUrl}/api/compare?criteria=bang%20for%20buck`);
        const compareData = await compareRes.json();
        
        if (!compareData || compareData.length === 0) {
            throw new Error("No data returned from comparison endpoint.");
        }

        const firstItem = compareData[0];
        const firstItemId = firstItem.product_id;
        console.log(`Best item determined by 'bang for buck': ${firstItem.title} (ID: ${firstItemId})`);

        console.log("3. Calling get item by id...");
        const itemRes = await fetch(`${baseUrl}/api/item/${firstItemId}`);
        const itemData = await itemRes.json();
        console.log(`Got item details: ${itemData.title}, Price: $${itemData.extracted_price}`);

        console.log("4. Loading to REAL Supabase database...");
        
        // Add Store (catch error if it already exists)
        const storeName = itemData.source || 'Unknown Store';
        try {
            await add_store(storeName, itemData.product_link || "http://example.com");
            console.log(`Store '${storeName}' added.`);
        } catch (e) {
            // It might already exist (e.g. duplicate key on source block)
            console.log(`Store '${storeName}' might already exist or error:`, e.message);
        }

        // Add Product
        const productTitle = itemData.title || 'Unknown Product';
        const product = await add_product(productTitle);
        console.log(`Product "${productTitle}" added with DB ID ${product.product_id}.`);

        // Add Item
        const storeItemId = Math.floor(Math.random() * 1000000); // Unique or random store_item_id
        const dbItem = await add_item(
            product.product_id, 
            storeName, 
            storeItemId, 
            itemData.rating || null, 
            itemData.reviews || null
        );
        console.log(`Item mapped in DB with ID ${dbItem.item_id}.`);

        // Add Deal (item_id, original_price, on_sale, last_fetched, sale_price, membership_sale)
        const price = itemData.extracted_price || 0;
        await add_deal(dbItem.item_id, price, false, new Date(), price, false);
        console.log(`Deal added for Item ID ${dbItem.item_id} at price $${price}.`);

        console.log("\n5. Confirming item retrieval from real database...");
        const retrievedItem = await get_item_by_id(dbItem.item_id);
        if (retrievedItem) {
            console.log(`Successfully retrieved item from DB!`);
            console.log(` DB Item ID: ${retrievedItem.item_id}`);
            console.log(` Store Source: ${retrievedItem.store_source}`);
            console.log(` Product ID: ${retrievedItem.product_id}`);
        } else {
            console.error(`Failed to retrieve item ${dbItem.item_id} from DB!`);
        }

        console.log("\nSupabase integration test workflow completed successfully!");
    } catch (err) {
        console.error("Error during test workflow:", err);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

runTest();
