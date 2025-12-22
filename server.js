const express = require('express');
const cors = require('cors');
const app = express();

// Render uses dynamic ports; this line is critical for deployment
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// --- 1. VERSION API ---
// If the launcher's CurrentVersion (1.0) is LOWER than this number, 
// the launcher will block access and show "UPDATE REQUIRED".
app.get('/launcher/version', (req, res) => {
    res.send("1.0"); 
});

// --- 2. NEWS API ---
// These appear in the top box of your news/shop page
app.get('/news', (req, res) => {
    res.json([
        {
            "name": "Welcome to ReneFN",
            "image": "https://i.imgur.com/DYhYsgd.png"
        },
        {
            "name": "Join our Discord",
            "image": "https://i.imgur.com/your-discord-image.png"
        }
    ]);
});

// --- 3. ITEM SHOP API ---
// These appear in the bottom box of your news/shop page
app.get('/shop', (req, res) => {
    res.json([
        {
            "name": "Renegade Raider",
            "image": "https://fortnite-api.com/images/cosmetics/br/cid_028_athena_commando_f/featured.png"
        },
        {
            "name": "Ariel Specialist",
            "image": "https://fortnite-api.com/images/cosmetics/br/cid_017_athena_commando_f/featured.png"
        }
    ]);
});

// --- 4. REDEEM API ---
// This is the page that opens when the 'Redeem' button is clicked
app.get('/redeem', (req, res) => {
    res.send("<h1>ReneFN Code Redemption</h1><p>Redeem system is currently under maintenance.</p>");
});

app.listen(PORT, () => {
    console.log(`ReneFN Backend running on port ${PORT}`);
});
