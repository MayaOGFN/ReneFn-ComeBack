const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

// --- DATABASE & FOLDER SYSTEM ---
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const storageDir = path.join(dataDir, 'cloudstorage');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir);
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- HELPERS ---
const getUsers = () => JSON.parse(fs.readFileSync(usersFile));
const saveUsers = (data) => fs.writeFileSync(usersFile, JSON.stringify(data, null, 2));

// --- 1. THE "BYPASS" AUTH SYSTEM ---
// This handles the OAuth2 handshake the game performs after injection.

app.post('/account/api/oauth/token', (req, res) => {
    res.json({
        access_token: crypto.randomBytes(16).toString('hex'),
        expires_in: 3600,
        token_type: "bearer",
        account_id: req.body.username || "ReneFN_User",
        client_id: "fortnite",
        displayName: req.body.username || "ReneFN_Player"
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

// --- 2. GAME SERVICE STATUS (Lightswitch) ---
// If this returns anything other than "UP", you get the "Unable to connect" error.
app.get('/lightswitch/api/service/bulk/status', (req, res) => {
    res.json([{
        serviceInstanceId: "fortnite",
        status: "UP",
        message: "ReneFN Servers are Operational",
        maintenanceUri: null,
        allowedActions: ["PLAY", "DOWNLOAD"],
        banned: false
    }]);
});

// --- 3. CLOUD STORAGE (Settings/Keybinds) ---
app.get('/fortnite/api/cloudstorage/system', (req, res) => {
    const files = fs.readdirSync(storageDir).map(file => ({
        uniqueFilename: file,
        filename: file,
        hash: crypto.createHash('sha1').update(file).digest('hex'),
        hash256: crypto.createHash('sha256').update(file).digest('hex'),
        length: fs.statSync(path.join(storageDir, file)).size,
        contentType: "application/octet-stream",
        uploaded: new Date().toISOString(),
        storageType: "S3",
        storageIds: {},
        doNotCache: false
    }));
    res.json(files);
});

app.get('/fortnite/api/cloudstorage/system/:file', (req, res) => {
    const filePath = path.join(storageDir, req.params.file);
    if (fs.existsSync(filePath)) res.sendFile(filePath);
    else res.status(404).end();
});

// --- 4. MCP & PROFILE (The "Athena" Skin System) ---
// This is what populates your locker and lets you past the "Checking for Updates" screen.
app.post('/fortnite/api/game/v2/profile/:accountId/client/:command', (req, res) => {
    const { command, accountId } = req.params;
    const profileId = req.query.profileId || "common_core";

    let response = {
        profileRevision: 1,
        profileId: profileId,
        profileChangesBaseRevision: 1,
        profileChanges: [],
        serverTime: new Date().toISOString(),
        responseVersion: 1
    };

    // Athena profile handles Skins/Emotes
    if (profileId === "athena") {
        response.profileChanges.push({
            changeType: "fullProfileUpdate",
            profile: {
                _id: accountId,
                accountId: accountId,
                stats: { attributes: { level: 100, accountLevel: 100 } },
                items: {
                    "ReneFN_Skin": {
                        templateId: "AthenaCharacter:CID_001_Athena_Character_Default",
                        attributes: { favorite: true }
                    }
                    // You can add 1,000+ items here manually to simulate a full locker
                }
            }
        });
    }

    res.json(response);
});

// --- 5. MATCHMAKING & WAITING ROOM ---
app.get('/fortnite/api/matchmaking/session/findPlayer/*', (req, res) => res.status(204).end());
app.get('/fortnite/api/game/v2/chat/:accountId/rooms', (req, res) => res.json([]));
app.post('/fortnite/api/game/v2/grant_access', (req, res) => res.json({ access_token: "renefn_access", expires_in: 3600 }));

// --- 6. LAUNCHER SPECIFIC ROUTES ---
app.get('/', (req, res) => res.send("<h1>ReneFN Backend Online</h1>"));
app.get('/news', (req, res) => res.json([{ name: "Welcome to Season X", image: "https://i.imgur.com/DYhYsgd.png", adspace: "Play Now!" }]));

app.post('/register', (req, res) => {
    const { email, password } = req.body;
    let users = getUsers();
    if (users.find(u => u.email === email)) return res.status(400).send("User already exists!");
    users.push({ email, password });
    saveUsers(users);
    res.send("Account registered successfully!");
});

// --- 7. MISC BYPASSES ---
app.get('/fortnite/api/v2/versioncheck/*', (req, res) => res.json({ type: "NO_UPDATE" }));
app.get('/fortnite/api/storefront/v2/catalog', (req, res) => res.json({ refreshIntervalHrs: 24, dailyAssets: [], weeklyAssets: [] }));
app.get('/content/api/pages/fortnite-game', (req, res) => res.json({ "jcr:checkedOut": true, "_type": "Fortnite Game", "dynamicbackgrounds": {} }));

app.listen(PORT, () => {
    console.log(`ReneFN Backend running on Port ${PORT}`);
    console.log(`Compatible with Season X / Starfall DLL`);
});
