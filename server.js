const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Helper function to read JSON files easily
const readJson = (fileName) => {
    const filePath = path.join(__dirname, 'data', fileName);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

// --- ROUTES ---

// 0. Home Page (Fixes "Cannot GET /")
app.get('/', (req, res) => {
    res.send("<h1>ReneFN Backend is Online</h1><p>The API is running correctly.</p>");
});

// 1. Version API
app.get('/launcher/version', (req, res) => {
    const data = readJson('launcherVersion.json');
    res.send(data.version);
});

// 2. News API
app.get('/news', (req, res) => {
    res.json(readJson('news.json'));
});

// 3. Item Shop API
app.get('/shop', (req, res) => {
    res.json(readJson('shop.json'));
});

// 4. Redeem API (Static for now)
app.get('/redeem', (req, res) => {
    res.send("<h1>Redeem Page</h1><p>Redeem system coming soon.</p>");
});

app.listen(PORT, () => {
    console.log(`ReneFN Backend running on port ${PORT}`);
});
