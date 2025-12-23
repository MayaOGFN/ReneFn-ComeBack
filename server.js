const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// --- 1. OAUTH & TOKEN (FIXES THE "GOING TO EPIC" ERROR) ---
app.post('/account/api/oauth/token', (req, res) => {
    console.log(`[AUTH] Login attempt for: ${req.body.username || "ExchangeCode"}`);
    res.json({
        access_token: "renefn_token",
        expires_in: 28800,
        token_type: "bearer",
        account_id: "renefn_user",
        displayName: "ReneFnPlayer",
        app: "fortnite",
        in_app_id: "renefn_user",
        device_id: "renefn_device"
    });
});

app.get('/account/api/oauth/verify', (req, res) => {
    res.json({ token: "renefn_token", account_id: "renefn_user", display_name: "ReneFnPlayer" });
});

// --- 2. CMS & LOADING SCREEN (FIXES THE "PRE-LOAD" HANG) ---
app.get('/content/api/pages/fortnite-game', (req, res) => {
    res.json({
        "jcr:isCheckedOut": true,
        "_title": "Fortnite Game",
        "logininterpolation": {
            "active": true,
            "backgrounds": [{ "stage": "Lobby", "background": "Season7" }]
        },
        "battleroyalenews": {
            "news": {
                "messages": [{ "title": "RENEFN IS LIVE", "body": "Login Successful!", "image": "https://i.imgur.com/DYhYsgd.png", "adspace": "OG" }]
            }
        }
    });
});

// --- 3. MCP (LOCKER & STATS) ---
app.post('/fortnite/api/game/v2/profile/:accountId/client/:operation', (req, res) => {
    res.json({
        profileRevision: 1,
        profileId: req.query.profileId || "athena",
        profileChanges: [{
            changeType: "fullProfileUpdate",
            profile: {
                _id: "renefn_id",
                accountId: req.params.accountId,
                updated: new Date().toISOString(),
                items: { "Currency:MtxPurchased": { templateId: "Currency:MtxPurchased", quantity: 99999 } },
                stats: { attributes: { level: 100 } }
            }
        }],
        serverTime: new Date().toISOString()
    });
});

// --- 4. LIGHTSWITCH & CLOUD ---
app.get('/lightswitch/api/service/bulk/status', (req, res) => {
    res.json([{ serviceInstanceId: "fortnite", status: "UP", message: "Live", allowedActions: ["PLAY"] }]);
});
app.get('/fortnite/api/cloudstorage/system', (req, res) => res.json([]));
app.get('/fortnite/api/cloudstorage/user/:accountId', (req, res) => res.json([]));

app.listen(PORT, () => console.log(`ReneFn Backend running on port ${PORT}`));
