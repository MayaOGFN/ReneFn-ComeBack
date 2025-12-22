const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

// --- 1. MIDDLEWARE & DATABASE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');

// Ensure database directory exists
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));

// Helper: Read/Write Users
const readDB = () => JSON.parse(fs.readFileSync(usersFile));
const writeDB = (data) => fs.writeFileSync(usersFile, JSON.stringify(data, null, 2));

// --- 2. THE ROOT ROUTE (Fixes "Cannot GET /") ---
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
        <body style="background:#121212;color:white;font-family:sans-serif;text-align:center;padding:50px;">
            <h1 style="color:#0078d4;">ReneFN Backend v2.0</h1>
            <p>Status: <span style="color:#4caf50;">ONLINE</span></p>
            <div style="background:#1e1e1e;padding:20px;display:inline-block;border-radius:10px;border:1px solid #333;">
                <p>Game Endpoints Active: <b>32</b></p>
                <p>User Database: <b>Connected</b></p>
            </div>
        </body>
    `);
});

// --- 3. AUTHENTICATION & OAUTH2 BYPASS ---
app.post('/account/api/oauth/token', (req, res) => {
    const displayName = req.body.username || "RenePlayer";
    res.json({
        access_token: "access_token_" + crypto.randomBytes(16).toString('hex'),
        expires_in: 3600,
        token_type: "bearer",
        account_id: displayName,
        client_id: "fortnite",
        displayName: displayName
    });
});

app.get('/account/api/public/account/:accountId', (req, res) => {
    res.json({
        id: req.params.accountId,
        displayName: req.params.accountId,
        email: req.params.accountId + "@renefn.com",
        failed_login_attempts: 0,
        last_login: new Date().toISOString(),
        numberOfDisplayNameChanges: 0,
        ageGroup: "UNKNOWN",
        canModifyDisplayName: false
    });
});

// --- 4. THE ATHENA PROFILE (Lobby, Skins, Locker) ---
// 
const getLockerData = (accountId) => ({
    _id: accountId,
    stats: {
        attributes: {
            past_seasons: [],
            season_match_boost: 10,
            loadout_num: 1,
            favorite_character: "AthenaCharacter:CID_001_Athena_Character_Default",
            favorite_pickaxe: "AthenaPickaxe:DefaultPickaxe",
            level: 100,
            accountLevel: 500,
            xp: 0,
            season_number: 10
        }
    },
    items: {
        "DefaultSkin": {
            templateId: "AthenaCharacter:CID_001_Athena_Character_Default",
            attributes: { item_seen: true, favorite: false }
        },
        "SeasonXP": {
            templateId: "Token:season10_battlepass",
            attributes: { item_seen: true }
        },
        "VBucks": {
            templateId: "Currency:MtxPurchased",
            quantity: 999999,
            attributes: { platform: "EpicPC" }
        }
    }
});

app.post('/fortnite/api/game/v2/profile/:accountId/client/:command', (req, res) => {
    const { accountId, command } = req.params;
    const profileId = req.query.profileId || "common_core";

    res.json({
        profileRevision: 1,
        profileId: profileId,
        profileChangesBaseRevision: 1,
        profileChanges: [{
            changeType: "fullProfileUpdate",
            profile: profileId === "athena" ? getLockerData(accountId) : { _id: accountId, stats: { attributes: { current_mtx: 9999 } }, items: {} }
        }],
        serverTime: new Date().toISOString(),
        responseVersion: 1
    });
});

// --- 5. ITEM SHOP (CATALOG) ---
app.get('/fortnite/api/storefront/v2/catalog', (req, res) => {
    res.json({
        refreshIntervalHrs: 24,
        dailyAssets: [],
        storefronts: [
            {
                name: "BRDailyStorefront",
                catalogEntries: [{
                    offerId: "v2:/renefn_offer_1",
                    devName: "Renegade Raider",
                    offerType: "StaticPrice",
                    prices: [{ currencyType: "MtxCurrency", currencySubType: "", price: 1200 }],
                    itemGrants: [{ templateId: "AthenaCharacter:CID_028_Athena_Character_Default", quantity: 1 }]
                }]
            }
        ]
    });
});

// --- 6. GAME SERVICES (Lightswitch & Cloudstorage) ---
app.get('/lightswitch/api/service/bulk/status', (req, res) => {
    res.json([{
        serviceInstanceId: "fortnite",
        status: "UP",
        message: "ReneFN Servers Operational",
        allowedActions: ["PLAY"]
    }]);
});

app.get('/fortnite/api/cloudstorage/system', (req, res) => res.json([]));
app.get('/fortnite/api/v2/versioncheck/*', (req, res) => res.json({ type: "NO_UPDATE" }));

// --- 7. USER REGISTRATION (Launcher API) ---
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send("Missing data");
    
    let db = readDB();
    if (db.find(u => u.email === email)) return res.status(400).send("Exists");
    
    db.push({ email, password, id: crypto.randomUUID() });
    writeDB(db);
    res.send("Account Created!");
});

// --- 8. MATCHMAKING STUBS ---
app.get('/fortnite/api/matchmaking/session/findPlayer/*', (req, res) => res.status(204).end());
app.post('/fortnite/api/game/v2/grant_access', (req, res) => res.json({ access_token: "grant_token", expires_in: 3600 }));

// --- 9. START SERVER ---
app.listen(PORT, () => {
    console.log(`
    ============================================
    RENEFN BACKEND v2.0 RUNNING ON PORT ${PORT}
    ROOT ROUTE: http://localhost:${PORT}/
    BYPASS: Epic Login Bypass Enabled
    ============================================
    `);
});
