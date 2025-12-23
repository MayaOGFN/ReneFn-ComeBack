const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 1. LOGIN & AUTH (Fixes Result=13) ---
app.post('/account/api/oauth/token', (req, res) => {
    res.json({
        access_token: "renefn_access_token",
        expires_in: 28800,
        expires_at: "9999-12-31T23:59:59.999Z",
        token_type: "bearer",
        account_id: "renefn_user",
        client_id: "fortnite_pc_client",
        internal_client: true,
        client_service: "fortnite",
        displayName: "ReneFn Player",
        app: "fortnite",
        in_app_id: "renefn_user"
    });
});

// --- 2. NEWS (Lobby News) ---
app.get('/fortnite/api/game/v2/world/info', (req, res) => {
    res.json({
        "battleroyalenews": {
            "news": {
                "messages": [
                    {
                        "image": "https://i.imgur.com/DYhYsgd.png",
                        "title": "Welcome to ReneFn!",
                        "body": "Enjoy the OG season with all features enabled.",
                        "adspace": "Season 10"
                    }
                ]
            }
        }
    });
});

// --- 3. ITEM SHOP (Catalog) ---
app.get('/fortnite/api/storefront/v2/catalog', (req, res) => {
    res.json({
        "refreshIntervalHrs": 24,
        "dailyPurchaseLimit": -1,
        "storefronts": [
            {
                "name": "BRDailyStorefront",
                "catalogEntries": [
                    {
                        "offerId": "vbuck_offer_1",
                        "devName": "Renegade Raider",
                        "offerType": "StaticPrice",
                        "prices": [{ "currencyType": "MtxCurrency", "currencySubType": "", "regularPrice": 1200, "finalPrice": 1200 }],
                        "itemGrants": [{ "templateId": "AthenaCharacter:CID_028_Athena_Character_Knight", "quantity": 1 }]
                    }
                ]
            }
        ]
    });
});

// --- 4. LOCKER & PROFILE (QueryProfile) ---
app.post('/fortnite/api/game/v2/profile/*/client/QueryProfile', (req, res) => {
    res.json({
        "profileRevision": 1,
        "profileId": "athena",
        "profileChangesBaseRevision": 1,
        "profileChanges": [{
            "changeType": "fullProfileUpdate",
            "profile": {
                "items": {
                    "vbucks_item": { "templateId": "Currency:MtxPurchased", "attributes": { "platform": "Epic" }, "quantity": 99999 }
                },
                "stats": { "attributes": { "level": 100, "season_match_boost": 10, "accountLevel": 100 } }
            }
        }]
    });
});

// --- 5. LOBBY & MISC ---
app.get('/fortnite/api/v2/versioncheck/*', (req, res) => res.json({ "type": "NO_UPDATE" }));
app.get('/fortnite/api/game/v2/enabled_features', (req, res) => res.json([]));

// Root route to keep Render awake
app.get('/', (req, res) => res.send("ReneFn Backend is Online!"));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
