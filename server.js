const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

// --- 1. CORE CONFIG & DATABASE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const usersFile = path.join(dataDir, 'users.json');
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));

// --- 2. ROOT ROUTE (Fixes "Cannot GET /") ---
app.get('/', (req, res) => {
    res.send(`
        <body style="background:#0a0a0a;color:#00eaff;font-family:monospace;text-align:center;padding-top:100px;">
            <h1 style="text-shadow:0 0 15px #00eaff;">RENEFN PRO BACKEND</h1>
            <p style="color:white;font-size:1.2em;">STATUS: <span style="color:lime;">OPERATIONAL</span></p>
            <div style="border:1px solid #333;padding:25px;display:inline-block;border-radius:10px;background:#111;">
                <p>Version: <b>Season 10 (10.40)</b></p>
                <p>V-Bucks System: <b>Unlimited (999,999)</b></p>
                <p>Redirects: <b>Force-Enabled</b></p>
            </div>
            <p style="margin-top:20px;color:#555;">Ready for Starfall Injection</p>
        </body>
    `);
});

// --- 3. AUTHENTICATION (OAUTH BYPASS) ---
app.post('/account/api/oauth/token', (req, res) => {
    const user = req.body.username || "RenePlayer";
    res.json({
        access_token: "rene_access_" + crypto.randomBytes(8).toString('hex'),
        expires_in: 3600,
        token_type: "bearer",
        account_id: user,
        displayName: user,
        client_id: "fortnite",
        internal_client: true
    });
});

app.get('/account/api/public/account/:accountId', (req, res) => {
    res.json({ id: req.params.accountId, displayName: req.params.accountId, email: "dev@renefn.com" });
});

// --- 4. THE V-BUCKS & LOCKER (MCP PROFILE) ---
const getProfile = (accountId, profileId) => {
    let p = {
        _id: accountId,
        created: new Date(),
        updated: new Date(),
        rvn: 1,
        profileId: profileId,
        stats: { attributes: { level: 100, season_match_boost: 10, season_number: 10 } },
        items: {}
    };

    if (profileId === "common_core") {
        p.stats.attributes.mtx_gradual_currency = 999999;
        p.stats.attributes.current_mtx = 999999;
        p.items["Currency:VBucks"] = { 
            templateId: "Currency:MtxPurchased", 
            quantity: 999999, 
            attributes: { platform: "EpicPC" } 
        };
    }

    if (profileId === "athena") {
        // Skins Automation
        const skins = ["CID_001_Athena_Character_Default", "CID_028_Athena_Character_Default", "CID_431_Athena_Character_Default"];
        skins.forEach((id, i) => {
            p.items[`Skin_${i}`] = { templateId: `AthenaCharacter:${id}`, attributes: { item_seen: true } };
        });
        p.items["SeasonPass"] = { templateId: "Token:season10_battlepass", attributes: { item_seen: true } };
    }
    return p;
};

app.post('/fortnite/api/game/v2/profile/:accountId/client/:command', (req, res) => {
    const profileId = req.query.profileId;
    res.json({
        profileRevision: 1,
        profileId: profileId,
        profileChangesBaseRevision: 1,
        profileChanges: [{ changeType: "fullProfileUpdate", profile: getProfile(req.params.accountId, profileId) }],
        serverTime: new Date().toISOString(),
        responseVersion: 1
    });
});

// --- 5. SYSTEM BYPASSES (Fixes Checking for Updates & Freezes) ---
app.get('/fortnite/api/v2/versioncheck/*', (req, res) => res.json({ type: "NO_UPDATE" }));
app.get('/lightswitch/api/service/bulk/status', (req, res) => res.json([{ serviceInstanceId: "fortnite", status: "UP", allowedActions: ["PLAY"] }]));
app.get('/fortnite/api/game/v2/enabled_features', (req, res) => res.json([]));
app.get('/fortnite/api/game/v2/chat/:accountId/rooms', (req, res) => res.json([]));
app.get('/eula/api/public/agreements/fn/*', (req, res) => res.status(204).end());
app.post('/datarouter/api/v1/public/data', (req, res) => res.status(204).end());
app.get('/fortnite/api/waitingroom/v1/waitingroom', (req, res) => res.status(204).end());
app.post('/fortnite/api/game/v2/grant_access', (req, res) => res.json({ access_token: "grant", expires_in: 3600 }));

// --- 6. SHOP & CONTENT ---
app.get('/fortnite/api/storefront/v2/catalog', (req, res) => {
    res.json({ refreshIntervalHrs: 24, dailyAssets: [], storefronts: [] });
});

app.get('/content/api/pages/fortnite-game', (req, res) => {
    res.json({
        "dynamicbackgrounds": { 
            "backgrounds": { "backgrounds": [{ "stage": "season10", "backgroundimage": "https://i.imgur.com/DYhYsgd.png" }] } 
        }
    });
});

// --- 7. USER REGISTRATION ---
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    let db = JSON.parse(fs.readFileSync(usersFile));
    db.push({ email, password, id: crypto.randomUUID() });
    fs.writeFileSync(usersFile, JSON.stringify(db, null, 2));
    res.send("Account Created! You can now log in.");
});

// --- 8. START ---
app.listen(PORT, () => {
    console.log(`[RENEFN] Backend active on port ${PORT}`);
    console.log(`[RENEFN] Use URL: https://renefn-comeback.onrender.com`);
});
