const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// --- BASIC MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Very simple CORS so the launcher / tools don't get blocked
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Simple request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// =====================================================================================
// 1. AUTH / ACCOUNT
// =====================================================================================

// Main login – fixes Result=13 and acts as generic access token endpoint
app.post('/account/api/oauth/token', (req, res) => {
    // You can inspect req.body.grant_type / exchange_code / password etc. if you want
    res.json({
        access_token: 'renefn_access_token',
        expires_in: 28800,
        expires_at: '9999-12-31T23:59:59.999Z',
        token_type: 'bearer',
        refresh_token: 'renefn_refresh_token',
        refresh_expires: 28800,
        refresh_expires_at: '9999-12-31T23:59:59.999Z',
        account_id: 'renefn_user',
        client_id: 'fortnite_pc_client',
        internal_client: true,
        client_service: 'fortnite',
        displayName: 'ReneFn Player',
        app: 'fortnite',
        in_app_id: 'renefn_user',
        device_id: 'renefn_device'
    });
});

// Kill session (logout) – just say OK
app.delete('/account/api/oauth/sessions/kill', (req, res) => {
    res.status(204).send();
});

// Generic “who am I” – the launcher sometimes asks for this
app.get('/account/api/oauth/verify', (req, res) => {
    res.json({
        token: 'renefn_access_token',
        session_id: 'renefn_session',
        internal_client: true,
        client_service: 'fortnite',
        account_id: 'renefn_user',
        expires_at: '9999-12-31T23:59:59.999Z',
        auth_method: 'exchange_code',
        display_name: 'ReneFn Player'
    });
});

// Public account info
app.get('/account/api/public/account/:accountId', (req, res) => {
    res.json({
        id: req.params.accountId,
        displayName: 'ReneFn Player',
        name: 'ReneFn Player',
        email: 'renefn@example.com',
        failedLoginAttempts: 0,
        lastLogin: new Date().toISOString(),
        numberOfDisplayNameChanges: 0,
        ageGroup: 'UNKNOWN',
        headless: false,
        country: 'AU',
        lastName: 'Rene',
        preferredLanguage: 'en',
        canUpdateDisplayName: false,
        tfaEnabled: false
    });
});

// =====================================================================================
// 2. LIGHTSWITCH / STATUS / VERSION
// =====================================================================================

// Lightswitch – tells the game Fortnite is ONLINE
app.get('/lightswitch/api/service/bulk/status', (req, res) => {
    res.json([
        {
            serviceInstanceId: 'fortnite',
            status: 'UP',
            message: 'Fortnite is ONLINE on ReneFn.',
            maintenanceUri: null,
            overrideCatalogIds: ['a7f138b2e51945ffbfdacc1af0541053'],
            allowedActions: ['PLAY', 'DOWNLOAD'],
            banned: false,
            launcherInfoDTO: {
                appName: 'Fortnite',
                catalogItemId: 'a7f138b2e51945ffbfdacc1af0541053',
                namespace: 'fn'
            }
        }
    ]);
});

// Simple version check – “NO_UPDATE” is usually enough for OG builds
app.get('/fortnite/api/v2/versioncheck/*', (req, res) => {
    res.json({ type: 'NO_UPDATE' });
});

// Another version endpoint some builds hit
app.get('/fortnite/api/version', (req, res) => {
    res.json({
        app: 'fortnite',
        build: 'OG-Season',
        version: '7.40.0',
        buildDate: '2019-02-14T00:00:00.000Z'
    });
});

// Enabled features – just return empty to avoid errors
app.get('/fortnite/api/game/v2/enabled_features', (req, res) => {
    res.json([]);
});

// =====================================================================================
// 3. CONTENT / NEWS / CALENDAR
// =====================================================================================

// World info – BR news in lobby
app.get('/fortnite/api/game/v2/world/info', (req, res) => {
    res.json({
        battleroyalenews: {
            news: {
                messages: [
                    {
                        image: 'https://i.imgur.com/DYhYsgd.png',
                        title: 'Welcome to ReneFn!',
                        body: 'Enjoy the OG season with all features enabled.',
                        adspace: 'Season 10'
                    }
                ]
            }
        }
    });
});

// Launcher content – MOTDs, panels, etc.
app.get('/fortnite/api/game/v2/launcher/content', (req, res) => {
    res.json({
        _title: 'ReneFn Content',
        _activeDate: '2017-11-01T00:00:00.000Z',
        _locale: 'en-US',
        subgameinfo: {
            br: {
                image: 'https://i.imgur.com/DYhYsgd.png',
                title: 'ReneFn Battle Royale',
                body: 'Custom OG experience powered by ReneFn.'
            }
        }
    });
});

// Calendar timeline – used for events / playlist updates
app.get('/fortnite/api/calendar/v1/timeline', (req, res) => {
    const now = new Date().toISOString();
    res.json({
        channels: {
            'client-matchmaking': {
                states: [
                    {
                        validFrom: '0001-01-01T00:00:00.000Z',
                        activeEvents: [],
                        state: {}
                    }
                ],
                cacheExpire: now
            },
            'client-events': {
                states: [
                    {
                        validFrom: '0001-01-01T00:00:00.000Z',
                        activeEvents: [],
                        state: {
                            activeStorefronts: ['BRDailyStorefront'],
                            eventNamedWeights: {}
                        }
                    }
                ],
                cacheExpire: now
            }
        },
        eventsTimeOffsetHrs: 0,
        cacheIntervalMins: 10,
        currentTime: now
    });
});

// =====================================================================================
// 4. ITEM SHOP / CATALOG
// =====================================================================================

app.get('/fortnite/api/storefront/v2/catalog', (req, res) => {
    res.json({
        refreshIntervalHrs: 24,
        dailyPurchaseLimit: -1,
        storefronts: [
            {
                name: 'BRDailyStorefront',
                catalogEntries: [
                    {
                        offerId: 'vbuck_offer_1',
                        devName: 'Renegade Raider',
                        offerType: 'StaticPrice',
                        prices: [
                            {
                                currencyType: 'MtxCurrency',
                                currencySubType: '',
                                regularPrice: 1200,
                                finalPrice: 1200
                            }
                        ],
                        categories: ['Panel 01'],
                        dailyLimit: -1,
                        weeklyLimit: -1,
                        monthlyLimit: -1,
                        appStoreId: [],
                        requirements: [],
                        offerTags: [],
                        grantRarity: 'legendary',
                        refundable: true,
                        itemGrants: [
                            {
                                templateId: 'AthenaCharacter:CID_028_Athena_Character_Knight',
                                quantity: 1
                            }
                        ]
                    }
                ]
            }
        ]
    });
});

// =====================================================================================
// 5. PROFILE / LOCKER / MCP
// =====================================================================================

// Helper: base profile structure for a single OGFN account
function createAthenaProfile() {
    return {
        _id: 'AthenaProfile',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        rvn: 1,
        wipeNumber: 1,
        accountId: 'renefn_user',
        profileId: 'athena',
        version: 'renefn-1',
        items: {
            // V-Bucks
            vbucks_item: {
                templateId: 'Currency:MtxPurchased',
                attributes: {
                    platform: 'Epic'
                },
                quantity: 99999
            },

            // Example skin
            CID_028_Athena_Character_Knight: {
                templateId: 'AthenaCharacter:CID_028_Athena_Character_Knight',
                attributes: {
                    item_seen: true,
                    favorite: true
                },
                quantity: 1
            },

            // Example pickaxe
            Pickaxe_ID_001: {
                templateId: 'AthenaPickaxe:Pickaxe_ID_001',
                attributes: {
                    item_seen: true,
                    favorite: true
                },
                quantity: 1
            },

            // Example glider
            Glider_ID_001: {
                templateId: 'AthenaGlider:Glider_ID_001',
                attributes: {
                    item_seen: true,
                    favorite: true
                },
                quantity: 1
            },

            // Example backbling
            BID_001: {
                templateId: 'AthenaBackpack:BID_001',
                attributes: {
                    item_seen: true,
                    favorite: true
                },
                quantity: 1
            }
        },
        stats: {
            attributes: {
                level: 100,
                book_level: 100,
                accountLevel: 100,
                season_match_boost: 10,
                season_friend_match_boost: 10,
                current_mtx_platform: 'Epic',
                mtx_purchase_history: {
                    refundsUsed: 0,
                    refundCredits: 3,
                    purchaseHistory: []
                },
                past_seasons: [],
                season_num: 7,
                season_matchmaking_region: 'EU',
                banner_icon: 'StandardBanner1',
                banner_color: 'DefaultColor1'
            }
        },
        commandRevision: 1
    };
}

// QueryProfile – core MCP endpoint, many actions go through here
app.post('/fortnite/api/game/v2/profile/:accountId/client/QueryProfile', (req, res) => {
    const profile = createAthenaProfile();

    res.json({
        profileRevision: profile.rvn,
        profileId: 'athena',
        profileChangesBaseRevision: profile.rvn,
        profileChanges: [
            {
                changeType: 'fullProfileUpdate',
                profile
            }
        ],
        serverTime: new Date().toISOString(),
        responseVersion: 1
    });
});

// Equip cosmetic (skin / pickaxe etc.)
app.post('/fortnite/api/game/v2/profile/:accountId/client/EquipBattleRoyaleCustomization', (req, res) => {
    // You can inspect req.body.slotName / itemToSlot if you want to make it dynamic
    res.json({
        profileRevision: 1,
        profileId: 'athena',
        profileChangesBaseRevision: 1,
        profileChanges: [],
        serverTime: new Date().toISOString(),
        responseVersion: 1
    });
});

// Set cosmetic locker slot – stubbed OK
app.post('/fortnite/api/game/v2/profile/:accountId/client/SetCosmeticLockerSlot', (req, res) => {
    res.json({
        profileRevision: 1,
        profileId: 'athena',
        profileChangesBaseRevision: 1,
        profileChanges: [],
        serverTime: new Date().toISOString(),
        responseVersion: 1
    });
});

// Gift and purchase emulation endpoints – just succeed
app.post('/fortnite/api/game/v2/profile/:accountId/client/PurchaseCatalogEntry', (req, res) => {
    res.json({
        profileRevision: 1,
        profileId: 'athena',
        profileChangesBaseRevision: 1,
        profileChanges: [],
        serverTime: new Date().toISOString(),
        responseVersion: 1
    });
});

// =====================================================================================
// 6. FRIENDS / PRESENCE / PARTY (VERY SIMPLE STUBS)
// =====================================================================================

// Friends list
app.get('/friends/api/public/friends/:accountId', (req, res) => {
    res.json([]); // No friends, no errors
});

// Incoming friend requests
app.get('/friends/api/public/incoming/:accountId', (req, res) => {
    res.json([]);
});

// Outgoing friend requests
app.get('/friends/api/public/outgoing/:accountId', (req, res) => {
    res.json([]);
});

// Presence
app.get('/presence/api/v1/_/:accountId/settings/subscriptions', (req, res) => {
    res.json({});
});

// Set presence – do nothing, just OK
app.post('/presence/api/v1/:accountId/presence', (req, res) => {
    res.status(204).send();
});

// Party service – simple empty party
app.get('/party/api/v1/Fortnite/user/:accountId', (req, res) => {
    res.json({
        current: [],
        pending: [],
        invites: [],
        pings: []
    });
});

// =====================================================================================
// 7. MATCHMAKING STUBS
// =====================================================================================

// Matchmaking – the game just expects something back to not crash
app.post('/fortnite/api/matchmaking/session/:sessionId/join', (req, res) => {
    res.json({
        sessionId: req.params.sessionId,
        joinDelaySec: 1
    });
});

app.post('/fortnite/api/matchmaking/session/:sessionId/leave', (req, res) => {
    res.status(204).send();
});

app.get('/fortnite/api/matchmaking/session/:sessionId', (req, res) => {
    res.json({
        sessionId: req.params.sessionId,
        status: 'ACTIVE'
    });
});

// =====================================================================================
// 8. CATCH-ALL / ROOT
// =====================================================================================

// Root route – for uptime pings
app.get('/', (req, res) => {
    res.send('ReneFn Backend is Online and OG-ready!');
});

// Optional catch-all for unknown MCP endpoints so the game doesn’t 404 hard
app.all('*', (req, res) => {
    console.log(`Unhandled route hit: ${req.method} ${req.originalUrl}`);
    res.status(200).json({
        message: 'ReneFn generic OK response.',
        route: req.originalUrl,
        method: req.method
    });
});

// =====================================================================================
// START SERVER
// =====================================================================================

app.listen(PORT, () => {
    console.log(`ReneFn OG backend is running on port ${PORT}`);
});
