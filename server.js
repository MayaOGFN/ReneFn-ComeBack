const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// --- BASIC MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple CORS
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

// Simple logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// =====================================================================================
// 1. AUTH / ACCOUNT (AUTO-SKIP EPIC LOGIN)
// =====================================================================================

// Main login – generic token (covers password/exchange/device flows)
app.post('/account/api/oauth/token', (req, res) => {
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

// Client credentials (launcher auth)
app.post('/account/api/oauth/token', (req, res, next) => {
    if (req.query.grant_type === 'client_credentials') {
        return res.json({
            access_token: 'client_access_token',
            expires_in: 28800,
            token_type: 'bearer',
            client_id: 'fortnite_pc_client',
            internal_client: true
        });
    }
    next();
});

// Device code grant
app.post('/account/api/oauth/token', (req, res, next) => {
    if (req.query.grant_type === 'device_code') {
        return res.json({
            access_token: 'renefn_access_token',
            expires_in: 28800,
            token_type: 'bearer',
            account_id: 'renefn_user',
            client_id: 'fortnite_pc_client',
            internal_client: true,
            displayName: 'ReneFn Player'
        });
    }
    next();
});

// Exchange code endpoint
app.post('/account/api/oauth/exchange', (req, res) => {
    res.json({
        code: 'renefn_exchange_code',
        creatingClientId: 'fortnite_pc_client',
        expiresInSeconds: 999999
    });
});

// Device authorization (some builds ping this)
app.post('/account/api/oauth/deviceAuthorization', (req, res) => {
    res.json({
        device_code: 'renefn_device_code',
        user_code: 'REN3-FN22',
        verification_uri: 'https://renefn.fake/activate',
        expires_in: 999999,
        interval: 5
    });
});

// Kill session (logout)
app.delete('/account/api/oauth/sessions/kill', (req, res) => {
    res.status(204).send();
});

// Verify token – used to confirm login
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

app.get('/fortnite/api/v2/versioncheck/*', (req, res) => {
    res.json({ type: 'NO_UPDATE' });
});

app.get('/fortnite/api/version', (req, res) => {
    res.json({
        app: 'fortnite',
        build: 'SeasonX',
        version: '10.00.0',
        buildDate: '2019-08-01T00:00:00.000Z'
    });
});

app.get('/fortnite/api/game/v2/enabled_features', (req, res) => {
    res.json([]);
});

// =====================================================================================
// 3. CONTENT / NEWS / CALENDAR (3-DOTS CRITICAL)
// =====================================================================================

// BR world info
app.get('/fortnite/api/game/v2/world/info', (req, res) => {
    res.json({
        battleroyalenews: {
            news: {
                messages: [
                    {
                        image: 'https://i.imgur.com/DYhYsgd.png',
                        title: 'Welcome to ReneFn!',
                        body: 'Enjoy Season X on ReneFn OG.',
                        adspace: 'SeasonX'
                    }
                ]
            }
        }
    });
});

// Launcher content
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

// CRITICAL: pages endpoint (3-dots)
app.get('/content/api/pages/fortnite-game', (req, res) => {
    res.json({
        _title: 'Fortnite Game Content',
        _activeDate: '2017-01-01T00:00:00.000Z',
        _locale: 'en-US',
        battleroyalenews: {
            news: {
                messages: [
                    {
                        image: 'https://i.imgur.com/DYhYsgd.png',
                        title: 'Welcome to ReneFn!',
                        body: 'Enjoy Season X with full OG vibes.',
                        adspace: 'BR_NEWS'
                    }
                ]
            }
        },
        emergencynotice: {
            news: {
                messages: []
            }
        },
        subgameinfo: {
            br: {
                image: 'https://i.imgur.com/DYhYsgd.png',
                title: 'ReneFn Battle Royale',
                body: 'Custom OG experience powered by ReneFn.'
            }
        }
    });
});

// Calendar timeline
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

function createAthenaProfile() {
    const now = new Date().toISOString();
    return {
        _id: 'AthenaProfile',
        created: now,
        updated: now,
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

            // Renegade Raider (reward + shop)
            CID_028_Athena_Character_Knight: {
                templateId: 'AthenaCharacter:CID_028_Athena_Character_Knight',
                attributes: {
                    item_seen: true,
                    favorite: true
                },
                quantity: 1
            },

            // Basic pickaxe
            Pickaxe_ID_001: {
                templateId: 'AthenaPickaxe:Pickaxe_ID_001',
                attributes: {
                    item_seen: true,
                    favorite: true
                },
                quantity: 1
            },

            // Basic glider
            Glider_ID_001: {
                templateId: 'AthenaGlider:Glider_ID_001',
                attributes: {
                    item_seen: true,
                    favorite: true
                },
                quantity: 1
            },

            // Back bling for bundle
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
                season_num: 10,
                season_matchmaking_region: 'EU',
                banner_icon: 'StandardBanner1',
                banner_color: 'DefaultColor1'
            }
        },
        commandRevision: 1
    };
}

// QueryProfile
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

// Cosmetic equip stub
app.post('/fortnite/api/game/v2/profile/:accountId/client/EquipBattleRoyaleCustomization', (req, res) => {
    res.json({
        profileRevision: 1,
        profileId: 'athena',
        profileChangesBaseRevision: 1,
        profileChanges: [],
        serverTime: new Date().toISOString(),
        responseVersion: 1
    });
});

// Locker slot stub
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

// Purchase stub
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
// 6. FRIENDS / PRESENCE / PARTY
// =====================================================================================

app.get('/friends/api/public/friends/:accountId', (req, res) => {
    res.json([]);
});

app.get('/friends/api/public/incoming/:accountId', (req, res) => {
    res.json([]);
});

app.get('/friends/api/public/outgoing/:accountId', (req, res) => {
    res.json([]);
});

app.get('/presence/api/v1/_/:accountId/settings/subscriptions', (req, res) => {
    res.json({});
});

app.post('/presence/api/v1/:accountId/presence', (req, res) => {
    res.status(204).send();
});

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
// 8. CLOUDSTORAGE (3-DOTS CRITICAL)
// =====================================================================================

app.get('/fortnite/api/cloudstorage/system', (req, res) => {
    res.json([]);
});

app.get('/fortnite/api/cloudstorage/user/:accountId', (req, res) => {
    res.json([]);
});

// =====================================================================================
// 9. TOURNAMENT – RENEGADE'S REVENGE
// =====================================================================================

app.get('/fortnite/api/game/v2/tournament/api/tournaments', (req, res) => {
    res.json({
        tournaments: [
            {
                id: 'RenegadesRevenge',
                title: "Renegade's Revenge",
                subtitle: 'Earn 29 points to unlock the Renegade Raider Bundle!',
                schedule: [
                    {
                        eventId: 'RenegadesRevenge_Event',
                        startTime: '2025-01-01T00:00:00.000Z',
                        endTime: '2099-01-01T00:00:00.000Z',
                        scoringRules: [
                            { rule: 'Placement', points: 10 },
                            { rule: 'Elimination', points: 1 }
                        ],
                        unlockAtPoints: 29,
                        rewards: [
                            {
                                templateId: 'AthenaCharacter:CID_028_Athena_Character_Knight',
                                quantity: 1
                            },
                            {
                                templateId: 'AthenaBackpack:BID_001',
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
// 10. ROOT / CATCH-ALL
// =====================================================================================

app.get('/', (req, res) => {
    res.send('ReneFn Backend is Online, Season X OG-ready!');
});

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
    console.log(`ReneFn Season X OG backend is running on port ${PORT}`);
});
