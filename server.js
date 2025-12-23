const express = require('express');
const axios = require('axios'); 
const app = express();
const PORT = process.env.PORT || 8080;

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1452945319993151489/I_-RN8rItVDOay4D7yCJ5AJpxv2KF6FeU1prtSfF3LuBfrqIoMCCQV7LNiTDX8wXsvro";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Discord Logger Helper (Safe Version)
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
        console.log("Discord Webhook Error (Server is still running)");
    }
}

// --- 2. AUTH & QUEUE FIXES (The "checking epic services" fix) ---

app.post('/account/api/oauth/token', (req, res) => {
    // Detect login type for Discord log
    const grantType = req.body.grant_type || req.query.grant_type || "unknown";
    sendDiscordLog("Auth Request", `User attempting login via **${grantType}**`, 5763719);

    res.json({
        access_token: 'renefn_access_token',
        expires_in: 28800,
        token_type: 'bearer',
        account_id: 'renefn_user',
        client_id: 'fortnite_pc_client',
        displayName: "ReneFn Player"
    });
});

// The actual "Queue" bypass
app.get('/waitingroom/api/waitingroom/privateserver', (req, res) => {
    res.status(204).send();
});

// --- 3. SHOP, NEWS & CONTENT ---

app.get('/fortnite/api/game/v2/world/info', (req, res) => {
    res.json({
        battleroyalenews: {
            news: {
                messages: [{
                    image: 'https://i.imgur.com/DYhYsgd.png',
                    title: 'ReneFn Online',
                    body: 'Backend is fully linked to Discord!',
                    adspace: 'SeasonX'
                }]
            }
        }
    });
});

app.get('/fortnite/api/storefront/v2/catalog', (req, res) => {
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

// --- 4. PROFILE & LOCKER ---

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
                stats: { attributes: { level: 100 } }
            }
        }]
    });
});

// --- 5. SYSTEM ROUTES ---

app.get('/lightswitch/api/service/bulk/status', (req, res) => {
    res.json([{ serviceInstanceId: 'fortnite', status: 'UP', allowedActions: ['PLAY'] }]);
});

app.get('/fortnite/api/v2/versioncheck/*', (req, res) => res.json({ type: 'NO_UPDATE' }));

app.get('/', (req, res) => res.send("ReneFn Backend Online"));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
