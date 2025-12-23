const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Simple In-Memory "Database"
const activePlayers = new Map();

// --- 1. OAUTH & TOKEN (DYNAMIC SESSIONS) ---
app.post('/account/api/oauth/token', (req, res) => {
    // If the launcher sends an exchange code, we treat it as a new session
    const displayName = req.body.username || "RenePlayer_" + Math.floor(Math.random() * 9000);
    const accountId = crypto.createHash('md5').update(displayName).digest('hex');
    const token = crypto.randomBytes(16).toString('hex');

    // Store this player's data
    activePlayers.set(token, { accountId, displayName });

    console.log(`[LOGIN] User: ${displayName} | ID: ${accountId}`);

    res.json({
        access_token: token,
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
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    const player = activePlayers.get(token);

    if (player) {
        res.json({ token: token, account_id: player.accountId, display_name: player.displayName, app: "fortnite" });
    } else {
        res.status(401).json({ error: "Invalid Session" });
    }
});

// --- 2. CMS & LOADING (PREVENTS HANGS) ---
app.get('/content/api/pages/fortnite-game', (req, res) => {
    res.json({
        "jcr:isCheckedOut": true,
        "logininterpolation": { "active": true, "backgrounds": [{ "stage": "Lobby", "background": "Season7" }] },
        "battleroyalenews": {
            "news": {
                "messages": [{ "title": "RENEFN", "body": "Unique Session Active", "image": "https://i.imgur.com/DYhYsgd.png" }]
            }
        }
    });
});

// --- 3. MCP (PLAYER-SPECIFIC PROFILES) ---
app.post('/fortnite/api/game/v2/profile/:accountId/client/:operation', (req, res) => {
    res.json({
        profileRevision: 1,
        profileId: req.query.profileId || "athena",
        profileChanges: [{
            changeType: "fullProfileUpdate",
            profile: {
                _id: req.params.accountId,
                accountId: req.params.accountId,
                items: { "Currency:MtxPurchased": { templateId: "Currency:MtxPurchased", quantity: 1337 } },
                stats: { attributes: { level: 100 } }
            }
        }],
        serverTime: new Date().toISOString()
    });
});

app.listen(PORT, () => console.log(`ReneFn Backend live on port ${PORT}`));
