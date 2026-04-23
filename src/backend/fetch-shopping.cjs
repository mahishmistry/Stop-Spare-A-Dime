require('dotenv').config({ path: require('path').resolve(__dirname, '../../', '.env') });

const fs = require('fs/promises');
const path = require('path');
const { getJson } = require('serpapi');

/**
 * Main execution function for the SerpApi fetch script.
 * Reads the product name and optional location from command-line arguments,
 * queries the Google Shopping API, and saves the formatted results to a local JSON file.
 * @returns {Promise<void>} A Promise that resolves when the file is successfully written.
 */
async function main() {
    const product = `Grocery ${process.argv[2]}`;
    
    if (!product) {
        throw new Error('A product name must be provided as the first argument.');
    }

    const location = process.argv[3] || 'United States';
    const outputPath = path.join(__dirname, `${product.replace(/\s+/g, '-')}-google-shopping.json`);

    if (!process.env.SERPAPI_KEY) {
        throw new Error('SERPAPI_KEY is not set in the environment.');
    }

    console.log(`Fetching results for ${product} in ${location}...`);

    const response = await getJson({
        engine: 'google_shopping',
        q: product,
        location: location,
        hl: 'en',
        gl: 'us',
        api_key: process.env.SERPAPI_KEY
    });

    await fs.writeFile(outputPath, JSON.stringify(response, null, 2));

    const resultCount = Array.isArray(response.shopping_results)
        ? response.shopping_results.length
        : 0;

    console.log(`Saved ${resultCount} shopping results to ${outputPath}`);
}

main().catch((error) => {
    console.error('Failed to fetch Google Shopping results from SerpApi:', error);
    process.exitCode = 1;
});