const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8080;

app.use(cors());

// --- 1. Version Check ---
app.get('/launcher/version', (req, res) => {
    res.send("1.0"); // Change this to 1.1 to force an update lockdown
});

// --- 2. News Feed ---
app.get('/news', (req, res) => {
    res.json([
        {
            "name": "ReneFN is Live!",
            "image": "https://i.imgur.com/DYhYsgd.png"
        },
        {
            "name": "Local Backend Connected",
            "image": "https://i.imgur.com/your-image.png"
        }
    ]);
});

// --- 3. Item Shop ---
app.get('/shop', (req, res) => {
    res.json([
        {
            "name": "Renegade Raider",
            "image": "https://fortnite-api.com/images/cosmetics/br/cid_028_athena_commando_f/featured.png"
        }
    ]);
});

// --- 4. Redeem Code (Placeholder) ---
app.get('/redeem', (req, res) => {
    res.send("<h1>ReneFN Redeem Page</h1><p>Enter your code here.</p>");
});

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
    console.log("Fynox connection removed. Launcher now using ReneFN Local.");
});
