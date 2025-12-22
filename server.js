const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

// --- 1. CORE MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 2. DATABASE INITIALIZATION ---
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const usersFile = path.join(dataDir, 'users.json');
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));

// --- 3. FIX: ROOT ROUTE (No more "Cannot GET /") ---
app.get('/', (req, res) => {
    res.send(`
        <body style="background:#0a0a0a;color:#00d4ff;font-family:monospace;text-align:center;padding-top:100px;">
            <h1 style="font-size:3em;">RENEFN PRO BACKEND</h1>
            <p style="color:white;font-size:1.2em;">STATUS: <span style="color:#00ff88;">READY FOR INJECTION</span></p>
            <div style="border:2px solid #00d4ff;padding:20px;display:inline-block;border-radius:10px;margin-top:20px;">
                <p>Profile Version: <b>Season 10 (X)</b></p>
                <p>V-Bucks System: <b>Unlimited Enabled</b></p>
                <p>Locker: <b>Full Access</b></p>
            </div>
        </body>
    `);
});

// --- 4. AUTHENTICATION (Bypasses Epic Login) ---
app.post('/account/api/oauth/token', (req, res) => {
    const user = req.body.username || "RenePlayer";
    res.json({
        access_token: "rene_token_" + crypto.randomBytes(16).toString('hex'),
        expires_in: 3600,
        token_type: "bearer",
        account_id: user,
        displayName: user,
        client_id: "fortnite",
        internal_client: true,
        client_service: "fortnite"
    });
});

app.get('/account/api/public/account/:accountId', (req, res) => {
    res.json({ id: req.params.accountId, displayName: req.params.accountId, email: "dev@renefn.com", country: "US" });
});

// --- 5. THE MASSIVE PROFILE SYSTEM (MCP) ---
const createProfileResponse = (accountId, profileId) => {
    let p = {
        _id: accountId,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        rvn: 1,
        profileId: profileId,
        stats: { attributes: { level: 100, season_match_boost: 10, season_number: 10 } },
        items: {}
    };

    if (profileId === "common_core") {
        p.stats.attributes.current_mtx = 999999;
        p.stats.attributes.mtx_gradual_currency = 999999;
        p.items["Currency:MtxPurchased"] = { templateId: "Currency:MtxPurchased", quantity: 999999, attributes: { platform: "EpicPC" } };
        p.items["Token:Season10Pass"] = { templateId: "Token:season10_battlepass", attributes: { item_seen: true } };
    } 
    
    if (profileId === "athena") {
        // LOCKER LOADOUT (DEFAULT)
        p.stats.attributes.favorite_character = "AthenaCharacter:CID_001_Athena_Character_Default";
        p.stats.attributes.favorite_pickaxe = "AthenaPickaxe:DefaultPickaxe";
        
        // MASSIVE ITEM LIST (This makes it feel like a real server)
        const skins = [
            "CID_001_Athena_Character_Default", "CID_431_Athena_Character_Default", "CID_028_Athena_Character_Default",
            "CID_017_Athena_Character_Default", "CID_035_Athena_Character_Default", "CID_039_Athena_Character_Default",
            "CID_084_Athena_Character_Default", "CID_142_Athena_Character_Default", "CID_527_Athena_Character_Default"
        ];
        
        skins.forEach((id, index) => {
            p.items[`Skin_${index}`] = { templateId: `AthenaCharacter:${id}`, attributes: { item_seen: true, favorite: false } };
        });

        const axes = ["DefaultPickaxe", "Pickaxe_ID_013_SkullTrooper", "Pickaxe_Lockjaw", "Pickaxe_ID_011_CandyCane"];
        axes.forEach((id, index) => {
            p.items[`Pick_${index}`] = { templateId: `AthenaPickaxe:${id}`, attributes: { item_seen: true } };
        });
    }

    return p;
};

app.post('/fortnite/api/game/v2/profile/:accountId/client/:command', (req, res) => {
    const profileId = req.query.profileId;
    res.json({
        profileRevision: 1,
        profileId: profileId,
        profileChangesBaseRevision: 1,
        profileChanges: [{ changeType: "fullProfileUpdate", profile: createProfileResponse(req.params.accountId, profileId) }],
        serverTime: new Date().toISOString(),
        responseVersion: 1
    });
});

// --- 6. SHOP & CATALOG ---
app.get('/fortnite/api/storefront/v2/catalog', (req, res) => {
    res.json({
        refreshIntervalHrs: 24,
        storefronts: [
            {
                name: "BRDailyStorefront",
                catalogEntries: [
                    { offerId: "v2:/off1", devName: "S10_1", prices: [{ currencyType: "MtxCurrency", price: 0 }], itemGrants: [{ templateId: "AthenaCharacter:CID_431_Athena_Character_Default", quantity: 1 }] },
                    { offerId: "v2:/off2", devName: "S10_2", prices: [{ currencyType: "MtxCurrency", price: 0 }], itemGrants: [{ templateId: "AthenaCharacter:CID_028_Athena_Character_Default", quantity: 1 }] }
                ]
            }
        ]
    });
});

// --- 7. BYPASSES (Fixes "Checking for Updates" and Freezes) ---
app.get('/fortnite/api/v2/versioncheck/*', (req, res) => res.json({ type: "NO_UPDATE" }));
app.get('/lightswitch/api/service/bulk/status', (req, res) => res.json([{ serviceInstanceId: "fortnite", status: "UP", allowedActions: ["PLAY"] }]));
app.get('/fortnite/api/cloudstorage/system', (req, res) => res.json([]));
app.get('/fortnite/api/game/v2/chat/:accountId/rooms', (req, res) => res.json([]));
app.get('/fortnite/api/matchmaking/session/findPlayer/*', (req, res) => res.status(204).end());
app.get('/eula/api/public/agreements/fn/*', (req, res) => res.status(204).end());
app.post('/fortnite/api/game/v2/grant_access', (req, res) => res.json({ access_token: "grant", expires_in: 3600 }));

// --- 8. CONTENT & LOBBY BACKGROUND ---
app.get('/content/api/pages/fortnite-game', (req, res) => {
    res.json({
        "jcr:checkedOut": true,
        "dynamicbackgrounds": {
            "backgrounds": { "backgrounds": [{ "stage": "season10", "backgroundimage": "https://i.imgur.com/DYhYsgd.png" }] }
        },
        "news": { "news": { "messages": [{ "title": "ReneFN", "body": "Season X Private Server Online!", "image": "https://i.imgur.com/DYhYsgd.png" }] } }
    });
});

// --- 9. USER MANAGEMENT ---
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    let db = JSON.parse(fs.readFileSync(usersFile));
    if (db.find(u => u.email === email)) return res.status(400).send("User exists");
    db.push({ email, password, id: crypto.randomUUID() });
    fs.writeFileSync(usersFile, JSON.stringify(db, null, 2));
    res.send("Account Created!");
});

// --- 10. LAUNCH ---
app.listen(PORT, () => {
    console.log(`[RENEFN] Backend running on port ${PORT}`);
    console.log(`[RENEFN] Fix for "Cannot GET /" deployed.`);
    console.log(`[RENEFN] Unlimited V-Bucks & Battle Pass System Ready.`);
});
