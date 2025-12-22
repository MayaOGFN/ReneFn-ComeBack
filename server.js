const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DATABASE HELPERS ---
function loadUsers() {
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}
function saveUser(user) {
    let users = loadUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) users[index] = user; else users.push(user);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 4));
}

// --- 1. THE FRONTEND (SIGN UP & LOBBY CONFIG) ---
app.get('/', (req, res) => {
    res.send(`
        <body style="background:#000; color:#00ffff; font-family:monospace; text-align:center; padding:50px;">
            <h1 style="text-shadow: 0 0 10px #00ffff;">RENE-FN SEASON X</h1>
            <div style="border:1px solid #333; padding:20px; display:inline-block; border-radius:10px;">
                <p>Welcome to the custom backend.</p>
                <a href="/signup"><button style="padding:10px 20px; background:#00ffff; border:none; cursor:pointer;">SIGN UP CONFIG</button></a>
            </div>
        </body>
    `);
});

app.get('/signup', (req, res) => {
    res.send(`
        <body style="background:#000; color:#fff; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh;">
            <form action="/api/register" method="POST" style="background:#111; padding:30px; border-radius:10px; width:300px;">
                <h2 style="color:#00ffff;">CREATE ACCOUNT</h2>
                <input type="text" name="username" placeholder="Username" required style="width:100%; margin:10px 0; padding:10px;"><br>
                <input type="email" name="email" placeholder="Email" required style="width:100%; margin:10px 0; padding:10px;"><br>
                <input type="password" name="password" placeholder="Password" required style="width:100%; margin:10px 0; padding:10px;"><br>
                <button type="submit" style="width:100%; padding:10px; background:#00ffff; border:none; font-weight:bold;">REGISTER</button>
            </form>
        </body>
    `);
});

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    const user = { id: crypto.randomBytes(12).toString('hex'), username, email, password, vbucks: 999999, level: 100 };
    saveUser(user);
    res.send("<h1>Account Created! Log in through Fortnite.</h1><a href='/'>Back</a>");
});

// --- 2. OAUTH & ACCOUNT HANDSHAKE ---
app.post('/account/api/oauth/token', (req, res) => {
    const name = req.body.username || "Player";
    const users = loadUsers();
    const user = users.find(u => u.username === name) || { id: "guest", username: name };
    res.json({
        access_token: `access_${user.id}`, expires_in: 3600, token_type: "bearer",
        account_id: user.id, displayName: user.username, client_id: "fortnite", internal_client: true
    });
});

app.get('/account/api/public/account/:accountId', (req, res) => {
    const user = loadUsers().find(u => u.id === req.params.accountId) || { username: "Player" };
    res.json({ id: req.params.accountId, displayName: user.username, email: user.email || "bot@rene.fn" });
});

// --- 3. THE HEART: PROFILE LOGIC (LOCKER, BATTLEPASS, VBUCKS) ---
const getProfile = (user, profileId) => {
    const profile = {
        _id: user.id, created: "2025-01-01T00:00:00Z", updated: new Date().toISOString(), rvn: 1,
        profileId: profileId, stats: { attributes: { season_match_boost: 100, loadout_num: 0, level: 100 } }, items: {}
    };

    if (profileId === "athena") {
        // SEASON X BATTLE PASS & SKINS
        profile.items["SeasonX_Pass"] = { templateId: "Token:season10_battlepass", attributes: { item_seen: true } };
        profile.items["Skin_UltimaKnight"] = { templateId: "AthenaCharacter:CID_484_Athena_Character_Default", attributes: { item_seen: true } };
        profile.items["Skin_Catalyst"] = { templateId: "AthenaCharacter:CID_474_Athena_Character_Default", attributes: { item_seen: true } };
        profile.stats.attributes.book_level = 100;
        profile.stats.attributes.book_xp = 1000;
        profile.stats.attributes.season_num = 10;
    }

    if (profileId === "common_core") {
        profile.items["Currency:VBucks"] = { templateId: "Currency:MtxPurchased", quantity: 999999, attributes: { platform: "EpicPC" } };
    }
    return profile;
};

app.post('/fortnite/api/game/v2/profile/:accountId/client/:command', (req, res) => {
    const user = loadUsers().find(u => u.id === req.params.accountId) || { id: "guest", username: "Player" };
    const profileId = req.query.profileId || "common_core";
    res.json({
        profileRevision: 1, profileId, profileChangesBaseRevision: 1,
        profileChanges: [{ changeType: "fullProfileUpdate", profile: getProfile(user, profileId) }],
        serverTime: new Date().toISOString(), responseVersion: 1
    });
});

// --- 4. GAME CONTENT (LOBBY, SHOP, COMPETE) ---
app.get('/content/api/pages/fortnite-game', (req, res) => {
    res.json({
        "dynamicbackgrounds": { "backgrounds": { "backgrounds": [{ "stage": "season10", "backgroundimage": "https://i.imgur.com/DYhYsgd.png" }] } },
        "shopsections": { "sections": [{ "sectionId": "Featured", "sectionDisplayName": "Featured" }] },
        "battlepassaboutmessages": { "news": [{ "title": "SEASON X", "body": "Out of Time!", "image": "https://i.imgur.com/DYhYsgd.png" }] }
    });
});

// COMPETE TAB & TOURNAMENTS
app.get('/fortnite/api/game/v2/events/player/:accountId', (req, res) => res.json({ playerEvents: [], eventTokens: [], created: new Date().toISOString() }));
app.get('/fortnite/api/stats/events/leaderboards/*', (req, res) => res.json({ entries: [] }));

// GAME MODES (Solos, Duos, Squads, Creative)
app.get('/fortnite/api/game/v2/enabled_features', (req, res) => res.json(["Creative", "BattleRoyale", "Lobby"]));

// --- 5. STABILITY STUBS ---
app.get('/lightswitch/api/service/bulk/status', (req, res) => res.json([{ serviceInstanceId: "fortnite", status: "UP", allowedActions: ["PLAY"] }]));
app.get('/fortnite/api/v2/versioncheck/*', (req, res) => res.json({ type: "NO_UPDATE" }));
app.get('/fortnite/api/waitingroom/v1/waitingroom', (req, res) => res.status(204).end());
app.post('/datarouter/api/v1/public/data', (req, res) => res.status(204).end());

app.listen(PORT, () => console.log(`RENE-FN Backend Running on Port ${PORT}`));
