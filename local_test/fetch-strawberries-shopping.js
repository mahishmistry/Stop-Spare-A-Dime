require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const fs = require('fs/promises');
const path = require('path');
const { getJson } = require('serpapi');

const OUTPUT_PATH = path.join(__dirname, 'strawberries-google-shopping.json');

async function main() {
    if (!process.env.SERPAPI_KEY) {
        throw new Error('SERPAPI_KEY is not set in the environment.');
    }

    const response = await getJson({
        engine: 'google_shopping',
        q: 'strawberries',
        location: '01003',
        hl: 'en',
        gl: 'us',
        api_key: process.env.SERPAPI_KEY
    });

    await fs.writeFile(OUTPUT_PATH, JSON.stringify(response, null, 2));

    const resultCount = Array.isArray(response.shopping_results)
        ? response.shopping_results.length
        : 0;

    console.log(`Saved ${resultCount} shopping results to ${OUTPUT_PATH}`);
}

main().catch((error) => {
    console.error('Failed to fetch Google Shopping results from SerpApi:', error);
    process.exitCode = 1;
});