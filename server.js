/**
 * RENEFN MASTER BACKEND - 2025 Edition
 * Integrated with Starfall Redirection & Discord Webhooks
 * Handles: Auth, MCP, Storefront, Cloudstorage, and Friends
 */

const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

// --- CONFIGURATION ---
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1452945319993151489/I_-RN8rItVDOay4D7yCJ5AJpxv2KF6FeU1prtSfF3LuBfrqIoMCCQV7LNiTDX8wXsvro";
const SERVER_NAME = "ReneFn OG";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DISCORD MONITORING SYSTEM ---
async function sendDiscordLog(title, message, color = 3447003) {
    try {
        await axios.post(DISCORD_WEBHOOK, {
            username: "ReneFn Watchdog",
            embeds: [{
                title: `[${SERVER_NAME}] ${title}`,
                description: message,
                color: color,
                footer: { text: "System Status: Online" },
                timestamp: new Date()
            }]
        });
    } catch (err) {
        console.log("Discord log failed, check webhook URL.");
    }
}

// --- MIDDLEWARE ---
app.use((req, res, next) => {
    // Log every request to the console for debugging Starfall hits
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// ==========================================
// 1. OAUTH & AUTHENTICATION SYSTEM
// ==========================================

app.post('/account/api/oauth/token', (req, res) => {
    const grantType = req.body.grant_type || req.query.grant_type || "unknown";
    const userEmail = req.body.username || "ReneFn_User";

    sendDiscordLog("🔑 OAuth Access", `**User:** ${userEmail}\n**Grant:** ${grantType}\n**Action:** Token Issued.`, 5763719);

    res.json({
        access_token: "renefn_access_token_stable",
        expires_in: 28800,
        expires_at: "9999-12-31T23:59:59.999Z",
        token_type: "bearer",
        refresh_token: "renefn_refresh_token",
        refresh_expires: 28800,
        refresh_expires_at: "9999-12-31T23:59:59.999Z",
        account_id: "renefn_user_id",
        client_id: "fortnite_pc_client",
        internal_client: true,
        displayName: userEmail.split('@')[0],
        app: "fortnite",
        in_app_id: "renefn_user_id"
    });
});

app.get('/account/api/oauth/verify', (req, res) => {
    res.json({
        token: "renefn_access_token_stable",
        session_id: "renefn_session",
        account_id: "renefn_user_id",
        display_name: "ReneFn Player",
        app: "fortnite",
        internal_client: true
    });
});

app.delete('/account/api/oauth/sessions/kill', (req, res) => {
    res.status(204).send();
});

// ==========================================
// 2. QUEUE & LIGHTSWITCH (The "Checking Services" Fix)
// ==========================================

app.get('/waitingroom/api/waitingroom/privateserver', (req, res) => {
    res.status(204).send();
});

app.get('/lightswitch/api/service/bulk/status', (req, res) => {
    res.json([{
        serviceInstanceId: "fortnite",
        status: "UP",
        message: "ReneFn is Online",
        allowedActions: ["PLAY"],
        banned: false
    }]);
});

// ==========================================
// 3. MCP & PROFILE LOGIC (Locker/V-Bucks)
// ==========================================

app.post('/fortnite/api/game/v2/profile/:accountId/client/:operation', (req, res) => {
    const profileId = req.query.profileId || "athena";
    
    if (profileId === "athena" || profileId === "common_core") {
        return res.json({
            profileRevision: 1,
            profileId: profileId,
            profileChanges: [{
                changeType: "fullProfileUpdate",
                profile: {
                    _id: "renefn_profile",
                    created: "2025-01-01T00:00:00Z",
                    updated: new Date().toISOString(),
                    rvn: 1,
                    wipeNumber: 1,
                    accountId: req.params.accountId,
                    profileId: profileId,
                    items: {
                        "vbucks_item": {
                            templateId: "Currency:MtxPurchased",
                            attributes: { platform: "Epic" },
                            quantity: 99999
                        },
                        "skin_renegade": {
                            templateId: "AthenaCharacter:CID_028_Athena_Character_Knight",
                            attributes: { item_seen: true, favorite: true },
                            quantity: 1
                        },
                        "pickaxe_id_001": {
                            templateId: "AthenaPickaxe:Pickaxe_ID_001",
                            quantity: 1
                        }
                    },
                    stats: {
                        attributes: {
                            level: 100,
                            accountLevel: 100,
                            m_athena_stats_v2: { /* Add stats here if needed */ }
                        }
                    },
                    commandRevision: 1
                }
            }],
            profileCommandRevision: 1,
            serverTime: new Date().toISOString(),
            responseVersion: 1
        });
    }
    res.status(400).json({ error: "Invalid Profile" });
});

// ==========================================
// 4. STOREFRONT & CATALOG
// ==========================================

app.get('/fortnite/api/storefront/v2/catalog', (req, res) => {
    sendDiscordLog("🛒 Item Shop", "User is browsing the catalog.", 15105570);
    res.json({
        refreshIntervalHrs: 24,
        dailyPurchaseLimit: -1,
        storefronts: [{
            name: "BRDailyStorefront",
            catalogEntries: [{
                offerId: "renefn_offer_1",
                devName: "Renegade Raider Offer",
                offerType: "StaticPrice",
                prices: [{ currencyType: "MtxCurrency", finalPrice: 0 }],
                itemGrants: [{ templateId: "AthenaCharacter:CID_028_Athena_Character_Knight", quantity: 1 }],
                requirements: [],
                categories: ["Daily"]
            }]
        }]
    });
});

// ==========================================
// 5. CONTENT & NEWS SYSTEM
// ==========================================

app.get('/content/api/pages/fortnite-game', (req, res) => {
    res.json({
        _title: "Fortnite Game",
        _activeDate: "2017-01-01T00:00:00Z",
        _locale: "en-US",
        battleroyalenews: {
            news: {
                messages: [{
                    image: "https://i.imgur.com/DYhYsgd.png",
                    title: "Welcome to ReneFn!",
                    body: "Redirection and Backend are fully linked to Discord. Enjoy!",
                    adspace: "ReneFn"
                }]
            }
        },
        emergencynotice: { news: { messages: [] } }
    });
});

app.get('/fortnite/api/game/v2/world/info', (req, res) => {
    res.json({ status: "UP", world_info: "Online" });
});

// ==========================================
// 6. FRIENDS & SOCIAL STUBS
// ==========================================

app.get('/friends/api/public/friends/:accountId', (req, res) => res.json([]));
app.get('/friends/api/v1/:accountId/settings', (req, res) => res.json({ acceptInvites: "public" }));
app.get('/friends/api/public/blocklist/:accountId', (req, res) => res.json({ blockedUsers: [] }));

// ==========================================
// 7. CLOUD STORAGE & VERSIONING
// ==========================================

app.get('/fortnite/api/cloudstorage/system', (req, res) => res.json([]));
app.get('/fortnite/api/cloudstorage/user/:accountId', (req, res) => res.json([]));
app.get('/fortnite/api/v2/versioncheck/*', (req, res) => res.json({ type: "NO_UPDATE" }));

// ==========================================
// 8. SERVER INITIALIZATION
// ==========================================

app.get('/', (req, res) => {
    res.send(`<h1>${SERVER_NAME} Backend Status</h1><p>Online and Monitoring Discord.</p>`);
});

app.listen(PORT, () => {
    console.log(`
    -------------------------------------------
    RENEFN BACKEND STARTED ON PORT ${PORT}
    DISCORD WEBHOOK: ACTIVE
    LISTENING FOR STARFALL REDIRECTS...
    -------------------------------------------
    `);
    sendDiscordLog("🚀 System Boot", "Backend has successfully initialized on Render.", 16776960);
});
