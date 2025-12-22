const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

// --- 1. SETUP & DATABASE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));

const readDB = () => JSON.parse(fs.readFileSync(usersFile));
const writeDB = (data) => fs.writeFileSync(usersFile, JSON.stringify(data, null, 2));

// --- 2. ROOT ROUTE (FIXES "CANNOT GET /") ---
app.get('/', (req, res) => {
    res.send(`
        <body style="background:#0f0f0f;color:white;font-family:sans-serif;text-align:center;padding:100px;">
            <h1 style="color:#00a2ff;font-size:3rem;">RENEFN BACKEND</h1>
            <p style="font-size:1.5rem;">STATUS: <span style="color:#00ff88;">CONNECTED</span></p>
            <hr style="width:300px;border:1px solid #333;">
            <p>Ready for Season X Login</p>
        </body>
    `);
});

// --- 3. AUTHENTICATION ---
app.post('/account/api/oauth/token', (req, res) => {
    const id = req.body.username || "RenePlayer";
    res.json({
        access_token: "token_" + crypto.randomBytes(16).toString('hex'),
        expires_in: 3600,
        token_type: "bearer",
        account_id: id,
        client_id: "fortnite",
        displayName: id
    });
});

app.get('/account/api/public/account/:accountId', (req, res) => {
    res.json({ id: req.params.accountId, displayName: req.params.accountId, email: "dev@renefn.com" });
});

// --- 4. THE V-BUCKS & BATTLE PASS FIX (COMMON_CORE) ---
const getCommonCore = (accountId) => ({
    _id: accountId,
    stats: {
        attributes: {
            mtx_gradual_currency: 999999, // FIXED: Game checks this for V-Buck display
            mtx_purchase_history: [],
            current_mtx: 999999,
            weekly_mtx_count: 0,
            daily_mtx_count: 0,
            level: 100
        }
    },
    items: {
        "VBucks_Item": {
            templateId: "Currency:MtxPurchased", // FIXED: Required for locker display
            quantity: 999999,
            attributes: { platform: "EpicPC" }
        },
        "Season10_Pass": {
            templateId: "Token:season10_battlepass",
            attributes: { item_seen: true }
        }
    }
});

// --- 5. ATHENA PROFILE (SKINS & LOBBY) ---
const getAthenaProfile = (accountId) => ({
    _id: accountId,
    stats: {
        attributes: {
            season_match_boost: 10,
            loadout_num: 1,
            favorite_character: "AthenaCharacter:CID_001_Athena_Character_Default",
            favorite_pickaxe: "AthenaPickaxe:DefaultPickaxe",
            level: 100,
            accountLevel: 500,
            season_number: 10
        }
    },
    items: {
        "Skin_1": { templateId: "AthenaCharacter:CID_001_Athena_Character_Default", attributes: { item_seen: true } },
        "Skin_2": { templateId: "AthenaCharacter:CID_431_Athena_Character_Default", attributes: { item_seen: true } },
        "Pickaxe_1": { templateId: "AthenaPickaxe:DefaultPickaxe", attributes: { item_seen: true } }
    }
});

// --- 6. MCP COMMANDS ---
app.post('/fortnite/api/game/v2/profile/:accountId/client/:command', (req, res) => {
    const { accountId } = req.params;
    const profileId = req.query.profileId;
    let data = { _id: accountId };

    if (profileId === "athena") data = getAthenaProfile(accountId);
    else if (profileId === "common_core") data = getCommonCore(accountId);

    res.json({
        profileRevision: 1,
        profileId: profileId,
        profileChangesBaseRevision: 1,
        profileChanges: [{ changeType: "fullProfileUpdate", profile: data }],
        serverTime: new Date().toISOString(),
        responseVersion: 1
    });
});

// --- 7. ITEM SHOP (CATALOG) ---
app.get('/fortnite/api/storefront/v2/catalog', (req, res) => {
    res.json({
        refreshIntervalHrs: 24,
        dailyAssets: [],
        storefronts: [
            {
                name: "BRDailyStorefront",
                catalogEntries: [
                    {
                        offerId: "v2:/offer_1",
                        devName: "Renegade Raider",
                        offerType: "StaticPrice",
                        prices: [{ currencyType: "MtxCurrency", price: 1200 }],
                        itemGrants: [{ templateId: "AthenaCharacter:CID_028_Athena_Character_Default", quantity: 1 }]
                    },
                    {
                        offerId: "v2:/offer_2",
                        devName: "Aerial Threat",
                        offerType: "StaticPrice",
                        prices: [{ currencyType: "MtxCurrency", price: 1500 }],
                        itemGrants: [{ templateId: "AthenaCharacter:CID_142_Athena_Character_Default", quantity: 1 }]
                    }
                ]
            }
        ]
    });
});

// --- 8. SERVICE BYPASSES ---
app.get('/lightswitch/api/service/bulk/status', (req, res) => {
    res.json([{ serviceInstanceId: "fortnite", status: "UP", allowedActions: ["PLAY"] }]);
});

app.get('/fortnite/api/cloudstorage/system', (req, res) => res.json([]));
app.get('/fortnite/api/v2/versioncheck/*', (req, res) => res.json({ type: "NO_UPDATE" }));

app.get('/content/api/pages/fortnite-game', (req, res) => {
    res.json({
        "jcr:checkedOut": true,
        "dynamicbackgrounds": {
            "backgrounds": { "backgrounds": [{ "stage": "season10", "backgroundimage": "https://i.imgur.com/DYhYsgd.png" }] }
        }
    });
});

// --- 9. LAUNCHER REGISTRATION ---
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send("Invalid Info");
    let db = readDB();
    if (db.find(u => u.email === email)) return res.status(400).send("Already Registered");
    db.push({ email, password, date: new Date() });
    writeDB(db);
    res.send("Success! Account created.");
});

// --- 10. SYSTEM ROUTES ---
app.get('/fortnite/api/game/v2/chat/:accountId/rooms', (req, res) => res.json([]));
app.get('/fortnite/api/matchmaking/session/findPlayer/*', (req, res) => res.status(204).end());
app.post('/fortnite/api/game/v2/grant_access', (req, res) => res.json({ access_token: "grant", expires_in: 3600 }));

// --- 11. STARTUP ---
app.listen(PORT, () => {
    console.log(`[RENEFN] Backend active on port ${PORT}`);
    console.log(`[RENEFN] V-Bucks Fixed: 999,999 granted per user.`);
    console.log(`[RENEFN] Season X Lobby & Battle Pass Ready.`);
});
