const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// In-memory session tracking
const players = new Map();

// --- AUTH (FIXES THE EPIC LOGIN LEAK) ---
app.post('/account/api/oauth/token', (req, res) => {
    // Determine player identity
    const displayName = req.body.username || "RenePlayer_" + Math.floor(Math.random() * 999);
    const accountId = crypto.createHash('md5').update(displayName).digest('hex');
    const accessToken = crypto.randomBytes(16).toString('hex');

    // Save session
    players.set(accessToken, { accountId, displayName });
    console.log(`[AUTH] Login: ${displayName} | ID: ${accountId}`);

    res.json({
        access_token: accessToken,
        expires_in: 28800,
        token_type: "bearer",
        account_id: accountId,
        displayName: displayName,
        app: "fortnite",
        in_app_id: accountId,
        device_id: "renefn_device"
    });
});

app.get('/account/api/oauth/verify', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const player = players.get(token);

    if (player) {
        res.json({ token, account_id: player.accountId, display_name: player.displayName, app: "fortnite" });
    } else {
        res.status(401).json({ error: "Invalid Token" });
    }
});

// --- CMS (FIXES PRE-LOAD HANG) ---
app.get('/content/api/pages/fortnite-game', (req, res) => {
    res.json({
        "jcr:isCheckedOut": true,
        "logininterpolation": { "active": true, "backgrounds": [{ "stage": "Lobby", "background": "Season7" }] },
        "battleroyalenews": {
            "news": {
                "messages": [{ "title": "RENEFN", "body": "Welcome back!", "image": "https://i.imgur.com/DYhYsgd.png" }]
            }
        }
    });
});

// --- MCP (LOCKER & STATS) ---
app.post('/fortnite/api/game/v2/profile/:accountId/client/:operation', (req, res) => {
    res.json({
        profileRevision: 1,
        profileId: req.query.profileId || "athena",
        profileChanges: [{
            changeType: "fullProfileUpdate",
            profile: {
                _id: req.params.accountId,
                accountId: req.params.accountId,
                updated: new Date().toISOString(),
                items: { "Currency:MtxPurchased": { templateId: "Currency:MtxPurchased", quantity: 99999 } },
                stats: { attributes: { level: 100, xp: 0 } }
            }
        }],
        serverTime: new Date().toISOString()
    });
});

// --- LIGHTSWITCH ---
app.get('/lightswitch/api/service/bulk/status', (req, res) => {
    res.json([{ serviceInstanceId: "fortnite", status: "UP", message: "Live", allowedActions: ["PLAY"] }]);
});

app.listen(PORT, () => console.log(`Backend Active on Port ${PORT}`));
