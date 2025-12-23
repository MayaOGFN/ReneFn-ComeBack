const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- LOGGING & CORS ---
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

// --- AUTHENTICATION (Fixes "invalid_user" & Manual Login) ---

// Handle the Exchange Code from your Launcher
app.post('/account/api/oauth/token', (req, res) => {
    const grantType = req.body.grant_type || req.query.grant_type;
    
    // Default response for any login attempt (Password, Exchange, or Client)
    res.json({
        access_token: 'renefn_access_token',
        expires_in: 28800,
        expires_at: '9999-12-31T23:59:59.999Z',
        token_type: 'bearer',
        refresh_token: 'renefn_refresh_token',
        account_id: 'renefn_user',
        client_id: 'fortnite_pc_client',
        internal_client: true,
        displayName: 'ReneFn Player',
        app: 'fortnite',
        in_app_id: 'renefn_user',
        device_id: 'renefn_device'
    });
});

// Fix for the externalAuths 404 error
app.get('/account/api/public/account/:accountId/externalAuths', (req, res) => res.json([]));

// Basic Account Lookup
app.get('/account/api/public/account/:accountId', (req, res) => {
    res.json({
        id: req.params.accountId,
        displayName: 'ReneFn Player',
        email: 'renefn@example.com',
        country: 'AU',
        lastName: 'Rene',
        preferredLanguage: 'en',
        canUpdateDisplayName: false,
        tfaEnabled: false
    });
});

// --- CONTENT & NEWS (Using your provided links) ---

app.get('/fortnite/api/game/v2/world/info', (req, res) => {
    res.json({
        battleroyalenews: {
            news: {
                messages: [{
                    image: 'https://i.imgur.com/DYhYsgd.png',
                    title: 'Welcome to ReneFn!',
                    body: 'OG Season is live. Join the discord for updates!',
                    adspace: 'SeasonX'
                }]
            }
        }
    });
});

// The "3-Dots" Menu & Main News
app.get('/content/api/pages/fortnite-game', (req, res) => {
    res.json({
        _title: 'Fortnite Game Content',
        battleroyalenews: {
            news: {
                messages: [{
                    image: 'https://i.imgur.com/DYhYsgd.png',
                    title: 'ReneFn News',
                    body: 'Check out the item shop for OG skins!',
                    adspace: 'BR_NEWS'
                }]
            }
        }
    });
});

// --- ITEM SHOP & LOCKER ---

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

// QueryProfile - Gives 99k V-Bucks and Skins
app.post('/fortnite/api/game/v2/profile/*/client/QueryProfile', (req, res) => {
    res.json({
        profileRevision: 1,
        profileId: "athena",
        profileChanges: [{
            changeType: "fullProfileUpdate",
            profile: {
                items: {
                    "vbucks_item": { templateId: "Currency:MtxPurchased", quantity: 99999 },
                    "renegade_raider": { templateId: "AthenaCharacter:CID_028_Athena_Character_Knight", quantity: 1 }
                },
                stats: { attributes: { level: 100 } }
            }
        }]
    });
});

// --- LIGHTSWITCH (Required for Login) ---
app.get('/lightswitch/api/service/bulk/status', (req, res) => {
    res.json([{ serviceInstanceId: 'fortnite', status: 'UP', allowedActions: ['PLAY'] }]);
});

// Root route
app.get('/', (req, res) => res.send("ReneFn Backend Status: ONLINE"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
