const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DATABASE SETUP ---
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const usersFile = path.join(dataDir, 'users.json');
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));

// --- 1. ROOT ROUTE (FIXES "CANNOT GET /") ---
app.get('/', (req, res) => {
    res.send(`
        <body style="background:#111;color:white;text-align:center;padding-top:100px;font-family:Arial;">
            <h1 style="color:#0078d4;">RENEFN SERVER ONLINE</h1>
            <p>Bypassing "Checking for Updates"...</p>
            <div style="border:1px solid #333;padding:20px;display:inline-block;border-radius:8px;">
                Status: <span style="color:lime;">Operational</span><br>
                V-Bucks System: <span style="color:lime;">Active</span>
            </div>
        </body>
    `);
});

// --- 2. AUTH & LOGIN BYPASS ---
app.post('/account/api/oauth/token', (req, res) => {
    const id = req.body.username || "RenePlayer";
    res.json({
        access_token: "rene_token_" + crypto.randomBytes(8).toString('hex'),
        expires_in: 3600,
        token_type: "bearer",
        account_id: id,
        displayName: id
    });
});

app.get('/account/api/public/account/:accountId', (req, res) => {
    res.json({ id: req.params.accountId, displayName: req.params.accountId, email: "dev@renefn.com" });
});

// --- 3. VERSION CHECK BYPASS (FIXES "CHECKING FOR UPDATES") ---
app.get('/fortnite/api/v2/versioncheck/*', (req, res) => {
    res.json({ type: "NO_UPDATE" });
});

app.get('/content/api/pages/fortnite-game', (req, res) => {
    res.json({
        "jcr:checkedOut": true,
        "dynamicbackgrounds": {
            "backgrounds": {
                "backgrounds": [{ "stage": "season10", "backgroundimage": "https://i.imgur.com/DYhYsgd.png" }]
            }
        },
        "news": { "news": { "messages": [{ "title": "ReneFN", "body": "Welcome to Season X!", "image": "https://i.imgur.com/DYhYsgd.png" }] } }
    });
});

// --- 4. THE V-BUCKS & BATTLE PASS FIX (COMMON_CORE) ---
const getCommonCore = (accountId) => ({
    _id: accountId,
    stats: {
        attributes: {
            mtx_gradual_currency: 999999, // Displays V-Bucks in top right
            current_mtx: 999999,
            mtx_purchase_history: [],
            level: 100
        }
    },
    items: {
        "VBucks_Main": {
            templateId: "Currency:MtxPurchased",
            quantity: 999999,
            attributes: { platform: "EpicPC" }
        },
        "BP_Token": {
            templateId: "Token:season10_battlepass",
            attributes: { item_seen: true }
        }
    }
});

// --- 5. ATHENA PROFILE (LOCKER & SKINS) ---
const getAthenaProfile = (accountId) => ({
    _id: accountId,
    stats: {
        attributes: {
            level: 100,
            accountLevel: 500,
            season_number: 10,
            favorite_character: "AthenaCharacter:CID_001_Athena_Character_Default"
        }
    },
    items: {
        "Skin1": { templateId: "AthenaCharacter:CID_001_Athena_Character_Default", attributes: { item_seen: true } },
        "Skin2": { templateId: "AthenaCharacter:CID_431_Athena_Character_Default", attributes: { item_seen: true } },
        "Pick1": { templateId: "AthenaPickaxe:DefaultPickaxe", attributes: { item_seen: true } }
    }
});

// --- 6. MCP COMMANDS ---
app.post('/fortnite/api/game/v2/profile/:accountId/client/:command', (req, res) => {
    const profileId = req.query.profileId;
    const accountId = req.params.accountId;
    let pData = { _id: accountId };

    if (profileId === "athena") pData = getAthenaProfile(accountId);
    else if (profileId === "common_core") pData = getCommonCore(accountId);

    res.json({
        profileRevision: 1,
        profileId: profileId,
        profileChangesBaseRevision: 1,
        profileChanges: [{ changeType: "fullProfileUpdate", profile: pData }],
        serverTime: new Date().toISOString(),
        responseVersion: 1
    });
});

// --- 7. ITEM SHOP (CATALOG) ---
app.get('/fortnite/api/storefront/v2/catalog', (req, res) => {
    res.json({
        refreshIntervalHrs: 24,
        storefronts: [{
            name: "BRDailyStorefront",
            catalogEntries: [{
                offerId: "v2:/offer1",
                devName: "Renegade Raider",
                prices: [{ currencyType: "MtxCurrency", price: 1200 }],
                itemGrants: [{ templateId: "AthenaCharacter:CID_028_Athena_Character_Default", quantity: 1 }]
            }]
        }]
    });
});

// --- 8. SERVICE BYPASSES ---
app.get('/lightswitch/api/service/bulk/status', (req, res) => {
    res.json([{ serviceInstanceId: "fortnite", status: "UP", allowedActions: ["PLAY"] }]);
});

app.get('/fortnite/api/cloudstorage/system', (req, res) => res.json([]));
app.post('/fortnite/api/game/v2/grant_access', (req, res) => res.json({ access_token: "grant", expires_in: 3600 }));
app.get('/fortnite/api/game/v2/chat/:accountId/rooms', (req, res) => res.json([]));
app.get('/fortnite/api/matchmaking/session/findPlayer/*', (req, res) => res.status(204).end());

// --- 9. REGISTRATION ---
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    let db = JSON.parse(fs.readFileSync(usersFile));
    if (db.find(u => u.email === email)) return res.status(400).send("User exists");
    db.push({ email, password });
    fs.writeFileSync(usersFile, JSON.stringify(db, null, 2));
    res.send("Account Created!");
});

// --- 10. SERVER INIT ---
app.listen(PORT, () => {
    console.log(`[SYSTEM] Backend Live on Port ${PORT}`);
    console.log(`[BYPASS] "Checking for Updates" patch applied.`);
    console.log(`[VBUCKS] mtx_gradual_currency set to 999,999.`);
});
