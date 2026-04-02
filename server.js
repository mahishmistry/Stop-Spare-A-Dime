require('dotenv').config();
const express = require('express');
const { getJson } = require('serpapi');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

//Array for search history
const searchHistory = [];

//Array for blocked stores
const blockedStores = [];


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

        //Filter for blocked stores
        const results = (response.shopping_results || [])
            .filter(item => !blockedStores.some(store => 
            item.source?.toLowerCase().includes(store.toLowerCase())
        ));
        

        
        searchHistory.push({ product, zipCode, timestamp: new Date() });
        
        res.json({ 
            count: results.length,
            data: results 
        });

    } catch (error) {
        console.error("SerpApi Error:", error);
        res.status(500).json({ error: 'Failed to fetch pricing data.' });
    }
});

//Search history endpoint
app.get('/api/history', (req, res) => {
    res.json({ history: searchHistory });
  });

//Add blocked store
app.post('/api/block', (req, res) => {
    const { store } = req.body;
    if (!store) return res.status(400).json({ error: 'Store name required.' });
    if (!blockedStores.includes(store)) blockedStores.push(store);
    res.json({ blockedStores });
  });

//Get the blocked stores
app.get('/api/block', (req, res) => {
    res.json({ blockedStores });
  });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});