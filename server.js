const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// --- CONFIG & DATABASE ---
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const usersFile = path.join(dataDir, 'users.json');
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));

// --- 1. AUTH & ACCOUNT BYPASS ---
app.post('/account/api/oauth/token', (req, res) => {
    res.json({
        access_token: "renefn_token_" + crypto.randomBytes(4).toString('hex'),
        expires_in: 3600,
        token_type: "bearer",
        account_id: req.body.username || "FynoxUser",
        client_id: "fortnite",
        displayName: req.body.username || "FynoxPlayer"
    });
});

app.get('/account/api/public/account/:accountId', (req, res) => {
    res.json({ id: req.params.accountId, displayName: req.params.accountId, email: "dev@renefn.com" });
});

// --- 2. THE LOBBY & SKINS (ATHENA PROFILE) ---
// This is what gives you the default skins and items when the lobby loads.
const getAthenaProfile = (accountId) => {
    return {
        _id: accountId,
        accountId: accountId,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        rvn: 1,
        WASH: 1,
        profileId: "athena",
        stats: {
            attributes: {
                past_seasons: [],
                season_match_boost: 10,
                loadout_num: 1,
                favorite_victorypose: "",
                m_num_last_season_reached: 100,
                favorite_consumable_emote: "",
                banner_color: "DefaultColor",
                favorite_callingcard: "",
                favorite_character: "AthenaCharacter:CID_001_Athena_Character_Default",
                favorite_backbling: "",
                favorite_pickaxe: "AthenaPickaxe:DefaultPickaxe",
                favorite_glider: "AthenaGlider:DefaultGlider",
                favorite_skydivecontrail: "",
                favorite_musicpack: "",
                favorite_itemwraps: ["","","","","","",""],
                level: 100,
                accountLevel: 500,
                xp: 0,
                season_number: 10
            }
        },
        items: {
            "DefaultSkin": {
                templateId: "AthenaCharacter:CID_001_Athena_Character_Default",
                attributes: { item_seen: true, favorite: false }
            },
            "DefaultPick": {
                templateId: "AthenaPickaxe:DefaultPickaxe",
                attributes: { item_seen: true, favorite: false }
            },
            "Season10Pass": {
                templateId: "Token:season10_battlepass",
                attributes: { item_seen: true }
            }
        }
    };
};

// --- 3. THE BATTLE PASS & V-BUCKS (COMMON_CORE) ---
const getCommonCore = (accountId) => {
    return {
        _id: accountId,
        stats: {
            attributes: {
                mtx_gradual_currency: 0,
                mtx_purchase_history: [],
                mtx_affiliate: "",
                mtx_affiliate_set_time: "",
                current_mtx: 999999 // Unlimited V-Bucks
            }
        },
        items: {
            "Currency": {
                templateId: "Currency:MtxPurchased",
                quantity: 999999,
                attributes: { platform: "EpicPC" }
            }
        }
    };
};

// --- 4. MCP COMMAND HANDLER ---
app.post('/fortnite/api/game/v2/profile/:accountId/client/:command', (req, res) => {
    const { accountId, command } = req.params;
    const profileId = req.query.profileId;

    let profileData = { _id: accountId };
    if (profileId === "athena") profileData = getAthenaProfile(accountId);
    else if (profileId === "common_core") profileData = getCommonCore(accountId);

    res.json({
        profileRevision: 1,
        profileId: profileId,
        profileChangesBaseRevision: 1,
        profileChanges: [{
            changeType: "fullProfileUpdate",
            profile: profileData
        }],
        serverTime: new Date().toISOString(),
        responseVersion: 1
    });
});

// --- 5. THE ITEM SHOP (CATALOG) ---
// This is a simplified version of the thousands of lines needed for a full shop
app.get('/fortnite/api/storefront/v2/catalog', (req, res) => {
    res.json({
        refreshIntervalHrs: 24,
        dailyAssets: [],
        storefronts: [
            {
                name: "BRDailyStorefront",
                catalogEntries: [
                    {
                        offerId: "v2:/renefn_daily_offer",
                        devName: "Cool Skin",
                        offerType: "StaticPrice",
                        prices: [{ currencyType: "MtxCurrency", currencySubType: "", price: 1200 }],
                        itemGrants: [{ templateId: "AthenaCharacter:CID_028_Athena_Character_Default", quantity: 1 }]
                    }
                ]
            },
            {
                name: "BRWeeklyStorefront",
                catalogEntries: []
            }
        ]
    });
});

// --- 6. NECESSARY BYPASSES (To reach lobby) ---
app.get('/lightswitch/api/service/bulk/status', (req, res) => {
    res.json([{ serviceInstanceId: "fortnite", status: "UP", allowedActions: ["PLAY"] }]);
});

app.get('/fortnite/api/cloudstorage/system', (req, res) => res.json([]));
app.get('/fortnite/api/v2/versioncheck/*', (req, res) => res.json({ type: "NO_UPDATE" }));
app.get('/content/api/pages/fortnite-game', (req, res) => {
    res.json({
        "dynamicbackgrounds": {
            "backgrounds": {
                "backgrounds": [{ "stage": "season10", "backgroundimage": "https://i.imgur.com/DYhYsgd.png" }]
            }
        }
    });
});

// --- 7. REGISTRATION ---
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send("Bad Request");
    let users = JSON.parse(fs.readFileSync(usersFile));
    users.push({ email, password });
    fs.writeFileSync(usersFile, JSON.stringify(users));
    res.send("Account Created! You can now login in the Launcher.");
});

// --- 8. SERVER START ---
app.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(`RENEFN GAME SERVER - ONLINE`);
    console.log(`Port: ${PORT}`);
    console.log(`Compatibility: Season 10 / Lobby / Skins`);
    console.log(`==========================================`);
});
