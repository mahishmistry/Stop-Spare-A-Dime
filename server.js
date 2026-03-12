require('dotenv').config();
const express = require('express');
const { getJson } = require('serpapi');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Main endpoint for fetching grocery prices
app.get('/api/prices', async (req, res) => {
    const { product, zipCode } = req.query;

    if (!product) {
        return res.status(400).json({ error: 'A product query is required.' });
    }

    try {
        // Fetch data from SerpApi's Google Shopping engine
        const response = await getJson({
            engine: "google_shopping",
            q: product,
            location: zipCode || "United States", 
            hl: "en",
            gl: "us",
            api_key: process.env.SERPAPI_KEY
        });

        // Isolate shopping results from the metadata
        const results = response.shopping_results || [];
        
        res.json({ 
            count: results.length,
            data: results 
        });

    } catch (error) {
        console.error("SerpApi Error:", error);
        res.status(500).json({ error: 'Failed to fetch pricing data.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});