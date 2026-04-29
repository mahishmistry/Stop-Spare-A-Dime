import 'dotenv/config';

async function runTest() {
    const baseUrl = 'http://localhost:3000';
    
    // Firebase auth token is required since /api/prices and /api/block are protected.
    const token = process.env.TEST_AUTH_TOKEN;
    
    if (!token) {
        console.error("❌ Please set TEST_AUTH_TOKEN in your .env file to a valid Firebase ID token.");
        console.error("💡 You can get one by authenticating via your app client and copying the 'Bearer ...' token from the network tab.");
        process.exit(1);
    }
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        console.log("1. Searching for Strawberries (ZipCode: 01003)...");
        const searchRes1 = await fetch(`${baseUrl}/api/prices?product=Strawberries&zipCode=01003`, { headers });
        if (!searchRes1.ok) {
             const errorTxt = await searchRes1.text();
             throw new Error(`Search 1 failed [${searchRes1.status}]: ${errorTxt}`);
        }
        
        const searchData1 = await searchRes1.json();
        console.log(`Found ${searchData1.count || 0} items.`);
        
        if (!searchData1.data || searchData1.data.length === 0) {
            console.error("No strawberries found. Cannot test blacklisting.");
            return;
        }

        // Sort by price to get the cheapest one
        const sortedItems = [...searchData1.data].sort((a, b) => {
             const priceA = a.extracted_price || Infinity;
             const priceB = b.extracted_price || Infinity;
             return priceA - priceB;
        });
        
        const firstItem = sortedItems[0];
        const storeToBlacklist = firstItem.source;
        
        if (!storeToBlacklist) {
            console.error("The cheapest item has no valid store/source property to blacklist.");
            return;
        }

        console.log(`\nLowest price item is from: "${storeToBlacklist}" ($${firstItem.extracted_price}).`);
        console.log(`2. Adding "${storeToBlacklist}" to blacklist via POST /api/block...`);
        
        const blockRes = await fetch(`${baseUrl}/api/block`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ store: storeToBlacklist })
        });
        
        if (!blockRes.ok) {
            const errBody = await blockRes.text();
            throw new Error(`Failed to blacklist store: ${blockRes.status} ${errBody}`);
        }
        
        const blockData = await blockRes.json();
        console.log(`Blacklisted stores updated. Current list:`, blockData.blockedStores);

        console.log(`\n3. Searching for Strawberries again (the blacklisted store should now be filtered out)...`);
        const searchRes2 = await fetch(`${baseUrl}/api/prices?product=Strawberries&zipCode=01003`, { headers });
        if (!searchRes2.ok) {
             const errorTxt = await searchRes2.text();
             throw new Error(`Search 2 failed: [${searchRes2.status}] ${errorTxt}`);
        }
        
        const searchData2 = await searchRes2.json();
        console.log(`Found ${searchData2.count || 0} items after applying blacklist.`);
        
        // 4. Verify the store is not in the new results
        const stillAppears = searchData2.data.some(item => 
            item.source && item.source.toLowerCase().includes(storeToBlacklist.toLowerCase())
        );

        if (stillAppears) {
            console.error(`\n❌ TEST FAILED: "${storeToBlacklist}" still showed up in the results even after blacklisting!`);
        } else {
            console.log(`\n✅ TEST PASSED: "${storeToBlacklist}" was successfully hidden from search results!`);
        }

    } catch (err) {
        console.error("\nError during test workflow:", err.message);
    }
}

runTest();
