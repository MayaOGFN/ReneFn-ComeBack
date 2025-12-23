const express = require('express');
const axios = require('axios'); // You may need to run: npm install axios
const app = express();
const PORT = process.env.PORT || 8080;

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1452945319993151489/I_-RN8rItVDOay4D7yCJ5AJpxv2KF6FeU1prtSfF3LuBfrqIoMCCQV7LNiTDX8wXsvro";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DISCORD WEBHOOK FUNCTION ---
async function sendDiscordLog(title, message, color = 3447003) {
    try {
        await axios.post(DISCORD_WEBHOOK, {
            embeds: [{
                title: title,
                description: message,
                color: color,
                timestamp: new Date()
            }]
        });
    } catch (err) {
        console.error("Discord Webhook failed");
    }
}

// --- 1. AUTH & QUEUE FIXES ---

// Fix for "Checking Epic Services Queue"
app.get('/waitingroom/api/waitingroom/privateserver', (req, res) => {
    res.status(204).send();
});

app.post('/account/api/oauth/token', (req, res) => {
    const displayName = req.body.username || "ReneFn Player";
    
    sendDiscordLog("User Login", `**${displayName}** is logging into the lobby!`, 5763719);

    res.json({
        access_token: 'renefn_access_token',
        expires_in: 28800,
        token_type: 'bearer',
        account_id: 'renefn_user',
        client_id: 'fortnite_pc_client',
        displayName: displayName
    });
});

// --- 2. SHOP & CONTENT LOGS ---

app.get('/fortnite/api/storefront/v2/catalog', (req, res) => {
    sendDiscordLog("Shop Accessed", "A player is viewing the Item Shop.", 15105570);
    res.json({
        refreshIntervalHrs: 24,
        storefronts: [{
            name: 'BRDailyStorefront',
            catalogEntries: [{
                offerId: 'vbuck_offer_1',
                devName: 'Renegade Raider',
                prices: [{ currencyType: 'MtxCurrency', finalPrice: 0 }],
                itemGrants: [{ templateId: 'AthenaCharacter:CID_028_Athena_Character_Knight', quantity: 1 }]
            }]
        }]
    });
});

// --- 3. THE "ALL FEATURES" & VERSION CHECK ---

app.get('/fortnite/api/game/v2/enabled_features', (req, res) => {
    res.json([
        "Storefront.EnableVBuckPurchase",
        "Social.EnableFriendFinder",
        "Locker.EnableCustomization"
    ]);
});

app.get('/fortnite/api/v2/versioncheck/*', (req, res) => {
    res.json({ type: 'NO_UPDATE' });
});

// --- 4. MCP / PROFILE (The Locker) ---
app.post('/fortnite/api/game/v2/profile/*/client/QueryProfile', (req, res) => {
    res.json({
        profileRevision: 1,
        profileId: "athena",
        profileChanges: [{
            changeType: "fullProfileUpdate",
            profile: {
                items: {
                    "vbucks_item": { templateId: "Currency:MtxPurchased", quantity: 99999 },
                    "renegade": { templateId: "AthenaCharacter:CID_028_Athena_Character_Knight", quantity: 1 }
                },
                stats: { attributes: { level: 100, accountLevel: 100 } }
            }
        }]
    });
});

// Lightswitch Status
app.get('/lightswitch/api/service/bulk/status', (req, res) => {
    res.json([{ serviceInstanceId: 'fortnite', status: 'UP', allowedActions: ['PLAY'] }]);
});

app.get('/', (req, res) => res.send("ReneFn Backend Online"));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    sendDiscordLog("Server Status", "ReneFn Backend has started on Render!", 16776960);
});
