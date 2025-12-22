const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 8080;
const DB_FILE = path.join(__dirname, "users.json");

/* ======================
   GLOBAL CONFIG
====================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Connection", "keep-alive");
  next();
});

/* ======================
   DATABASE
====================== */
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function getUser(username) {
  const db = loadDB();
  return db.users.find(u => u.username === username);
}

function getUserById(id) {
  const db = loadDB();
  return db.users.find(u => u.id === id);
}

function createUser(username, password) {
  const db = loadDB();
  const user = {
    id: crypto.randomBytes(16).toString("hex"),
    username,
    password,
    vbucks: 10000, // Gave them more VBucks
    lastClaim: 0,
    rvn: { athena: 1, common_core: 1 }
  };
  db.users.push(user);
  saveDB(db);
  return user;
}

/* ======================
   ROOT
====================== */
app.get("/", (req, res) => {
  res.send("OGFN Season X backend running (Lobby Fixed) ✔");
});

/* ======================
   WEBSITE UI
====================== */
app.get("/register", (req, res) => {
  res.send(`<h2>Register</h2><form method="POST"><input name="username" placeholder="Username" required /><br><input name="password" type="password" placeholder="Password" required /><br><button>Register</button></form>`);
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (getUser(username)) return res.send("User exists");
  createUser(username, password);
  res.send("Registered ✔");
});

app.get("/login", (req, res) => {
  res.send(`<h2>Login</h2><form method="POST"><input name="username" placeholder="Username" required /><br><input name="password" type="password" placeholder="Password" required /><br><button>Login</button></form>`);
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = getUser(username);
  if (!user || user.password !== password) return res.send("Invalid login");
  res.send(`Logged in ✔<br>V-Bucks: ${user.vbucks}<br><a href="/daily?user=${username}">Claim Daily 500 V-Bucks</a>`);
});

app.get("/daily", (req, res) => {
  const user = getUser(req.query.user);
  if (!user) return res.send("Invalid user");
  const now = Date.now();
  if (now - user.lastClaim < 86400000) return res.send("Already claimed today");
  user.vbucks += 500;
  user.lastClaim = now;
  const db = loadDB();
  db.users = db.users.map(u => u.username === user.username ? user : u);
  saveDB(db);
  res.send(`Claimed 500 V-Bucks ✔ Total: ${user.vbucks}`);
});

/* ======================
   OAUTH
====================== */
app.post("/account/api/oauth/token", (req, res) => {
  const username = req.body.username || `Player${Math.floor(Math.random()*1000)}`;
  // Try to find user, or create temporary one if client sends garbage
  const user = getUser(username) || createUser(username, "local");

  res.json({
    access_token: user.id, // Using ID as token for simplicity
    token_type: "bearer",
    expires_in: 4 * 3600,
    account_id: user.id,
    client_id: "fortnite",
    internal_client: true,
    displayName: user.username,
    app: "fortnite",
    in_app_id: user.id
  });
});

app.get("/account/api/oauth/verify", (req, res) => {
    res.json({
        access_token: req.headers.authorization.replace("bearer ", ""),
        client_id: "fortnite",
        expires_in: 3600
    })
});

/* ======================
   ACCOUNT
====================== */
app.get("/account/api/public/account/:id", (req, res) => {
  const user = getUserById(req.params.id);
  res.json({
    id: req.params.id,
    displayName: user ? user.username : "Player",
    email: "player@ogfn.local",
    externalAuths: {}
  });
});

app.get("/account/api/public/account/*/externalAuths", (req, res) => res.json([]));

/* ======================
   PROFILES (THE FIX)
====================== */
function buildProfile(user, profileId) {
  const meta = {
    _id: user.id,
    accountId: user.id,
    profileId,
    version: "no_version",
    created: "2023-01-01T00:00:00.000Z",
    updated: new Date().toISOString(),
    rvn: user.rvn[profileId] || 1,
    commandRevision: (user.rvn[profileId] || 1) + 1,
  };

  // --- ATHENA (Lobby, Skins, Stats) ---
  if (profileId === "athena") {
    return {
      ...meta,
      stats: {
        attributes: {
          season_num: 10,
          level: 100,
          xp: 10000000,
          book_level: 100,
          book_xp: 10000000,
          book_purchased: true,
          battlestars: 999,
          lifetime_wins: 100
        }
      },
      items: {
        // 1. The Loadout (Required for lobby to render)
        "sandbox_loadout": {
          templateId: "CosmeticLocker:cosmeticlocker_athena",
          attributes: {
            locker_slots_data: {
              slots: {
                Character: { items: ["cid_028_athena_commando_f"] }, // Renegade Raider as default
                Backpack: { items: ["bid_004_redknight"] },
                Pickaxe: { items: ["pickaxe_id"] },
                Glider: { items: ["glider_id"] },
                Dance: { items: ["eid_floss", "eid_dab"] },
                ItemWrap: { items: ["wrap_0"] }
              }
            },
            banner_icon_template: "StandardBanner1",
            banner_color_template: "DefaultColor1"
          }
        },
        // 2. The Items defined in the loadout above
        "cid_028_athena_commando_f": { templateId: "AthenaCharacter:cid_028_athena_commando_f", attributes: { variants: [] } },
        "bid_004_redknight": { templateId: "AthenaBackpack:bid_004_redknight", attributes: { variants: [] } },
        "pickaxe_id": { templateId: "AthenaPickaxe:defaultpickaxe", attributes: { variants: [] } },
        "glider_id": { templateId: "AthenaGlider:defaultglider", attributes: { variants: [] } },
        "eid_floss": { templateId: "AthenaDance:eid_floss", attributes: { variants: [] } },
        "eid_dab": { templateId: "AthenaDance:eid_dab", attributes: { variants: [] } },
        "wrap_0": { templateId: "AthenaItemWrap:wrap_001", attributes: { variants: [] } }
      }
    };
  }

  // --- COMMON CORE (V-Bucks, Settings) ---
  if (profileId === "common_core") {
    return {
      ...meta,
      items: {
        "currency": {
          templateId: "Currency:MtxPurchased",
          quantity: user.vbucks || 0,
          attributes: { platform: "EpicPC" }
        }
      },
      stats: {
        attributes: {
          mtx_affiliate: "OGFN",
          current_mtx_platform: "EpicPC",
          daily_rewards: {}
        }
      }
    };
  }

  // Fallback for other profiles
  return { ...meta, items: {}, stats: { attributes: {} } };
}

app.post("/fortnite/api/game/v2/profile/:accountId/client/:command", (req, res) => {
  // 1. Actually grab the user from the ID in the URL
  const user = getUserById(req.params.accountId);
  
  // If no user found, just try to use 'Player' or error (prevents crash)
  if (!user) {
      console.log(`User not found: ${req.params.accountId}`);
      return res.status(404).end();
  }

  const profileId = req.query.profileId || "common_core";

  // Increment revision (rvn) so client knows data changed
  user.rvn[profileId] = (user.rvn[profileId] || 0) + 1;
  saveDB(loadDB()); // In a real app, update only the specific user

  const profile = buildProfile(user, profileId);

  res.json({
    profileRevision: profile.rvn,
    profileId,
    profileChangesBaseRevision: profile.rvn - 1,
    profileChanges: [{ changeType: "fullProfileUpdate", profile }],
    serverTime: new Date().toISOString(),
    responseVersion: 1
  });
});

/* ======================
   CONTENT & SERVICES
====================== */
app.get("/content/api/pages/fortnite-game", (req, res) => {
  res.json({
    battlepassaboutmessages: { news: [{ title: "SEASON X", body: "Welcome to OGFN!" }] },
    subgameselectdata: {
        battleroyale: {
            message: { title: "OGFN", body: "Server Online" }
        }
    },
    dynamicbackgrounds: {
      backgrounds: { backgrounds: [{ stage: "season10", _type: "DynamicBackground" }] }
    }
  });
});

app.get("/lightswitch/api/service/bulk/status", (req, res) => {
  res.json([{ serviceInstanceId: "fortnite", status: "UP", allowedActions: ["PLAY", "DOWNLOAD"] }]);
});

app.get("/fortnite/api/v2/versioncheck/*", (req, res) => res.json({ type: "NO_UPDATE" }));
app.get("/fortnite/api/waitingroom/v1/waitingroom", (req, res) => res.status(204).end());
app.post("/datarouter/api/v1/public/data", (req, res) => res.status(204).end());

/* ======================
   START
====================== */
app.listen(PORT, () => {
  console.log(`OGFN Season X backend ready on port ${PORT} ✔`);
});
