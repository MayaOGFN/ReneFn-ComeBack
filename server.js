const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// --- DATABASE SETUP ---
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));

// --- 1. BASIC ROUTES ---
app.get('/', (req, res) => res.send("ReneFN Game Server API is Online."));

app.post('/register', (req, res) => {
    const { email, password } = req.body;
    let users = JSON.parse(fs.readFileSync(usersFile));
    if (users.find(u => u.email === email)) return res.status(400).send("User exists!");
    users.push({ email, password, id: email });
    fs.writeFileSync(usersFile, JSON.stringify(users));
    res.send("Account created!");
});

// --- 2. FORTNITE COMPATIBILITY ENDPOINTS ---
// These are what Starfall.dll redirects the game to find.

// Auth Access Token (Allows the game to "log in")
app.post('/fortnite/api/game/v2/grant_access', (req, res) => {
    res.json({ access_token: "renefn_token", expires_in: 3600 });
});

// Cloudstorage (Stops the "Failed to download settings" error)
app.get('/fortnite/api/cloudstorage/system', (req, res) => {
    res.json([]);
});

// User Profile (Tells the game who you are)
app.get('/fortnite/api/game/v2/profile/:accountId/client/QueryProfile', (req, res) => {
    res.json({
        profileRevision: 1,
        profileId: "athena",
        stats: { attributes: { level: 100, accountLevel: 100 } },
        items: {} // Add skins here later
    });
});

// Version Check
app.get('/fortnite/api/v2/versioncheck/*', (req, res) => {
    res.json({ type: "NO_UPDATE" });
});

// Lightswitch (Tells the game the server is UP)
app.get('/lightswitch/api/service/bulk/status', (req, res) => {
    res.json([{
        serviceInstanceId: "fortnite",
        status: "UP",
        message: "ReneFN is Online",
        maintenanceUri: null,
        overrideCatalogIds: ["a7f138b4a7994d97ab34e402fd5dabe0"],
        allowedActions: ["PLAY", "DOWNLOAD"],
        banned: false
    }]);
});

app.listen(PORT, () => console.log(`Compatible Game Server running on port ${PORT}`));
