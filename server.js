const express = require('express');
const cors = require('cors');
const app = express();

// Use the port Render gives us, or default to 8080 for local testing
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// 1. Version Check (Used for forcing updates)
app.get('/launcher/version', (req, res) => {
    res.send("1.0"); 
});

// 2. News Feed (Shows in the news panel)
app.get('/news', (req, res) => {
    res.json([
        {
            "name": "ReneFN is LIVE!",
            "image": "https://i.imgur.com/DYhYsgd.png"
        },
        {
            "name": "Local Backend Connected",
            "image": "https://i.imgur.com/your-image.png"
        }
    ]);
});

// 3. Item Shop (Shows in the shop panel)
app.get('/shop', (req, res) => {
    res.json([
        {
            "name": "Renegade Raider",
            "image": "https://fortnite-api.com/images/cosmetics/br/cid_028_athena_commando_f/featured.png"
        }
    ]);
});

// 4. Redeem Page (A simple HTML placeholder)
app.get('/redeem', (req, res) => {
    res.send("<h1>ReneFN Redeem</h1><p>Redeem system coming soon.</p>");
});

app.listen(PORT, () => {
    console.log(`ReneFN Backend is active on port ${PORT}`);
});
