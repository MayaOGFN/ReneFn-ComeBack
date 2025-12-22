const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 8080;
const USERS_FILE = path.join(__dirname, "users.json");

/* =======================
   GLOBAL MIDDLEWARE
======================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Connection", "keep-alive");
  next();
});

/* =======================
   USER STORAGE
======================= */
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getOrCreateUser(username = "Player") {
  let users = loadUsers();
  let user = users.find(u => u.username === username);

  if (!user) {
    user = {
      id: crypto.randomBytes(16).toString("hex"),
      username,
      rvn: {
        athena: 1,
        common_core: 1
      }
    };
    users.push(user);
    saveUsers(users);
  }

  return user;
}

/* =======================
   OAUTH TOKEN
======================= */
app.post("/account/api/oauth/token", (req, res) => {
  const username = req.body.username || "Player";
  const user = getOrCreateUser(username);

  res.json({
    access_token: `access_${user.id}`,
    token_type: "bearer",
    expires_in: 3600,
    account_id: user.id,
    client_id: "fortnite",
    internal_client: true,
    displayName: user.username
  });
});

/* =======================
   ACCOUNT LOOKUP
======================= */
app.get("/account/api/public/account/:accountId", (req, res) => {
  res.json({
    id: req.params.accountId,
    displayName: "Player",
    email: "player@local"
  });
});

/* =======================
   PROFILE BUILDER
======================= */
function buildProfile(user, profileId) {
  const rvn = user.rvn[profileId] || 1;

  const profile = {
    _id: user.id,
    profileId,
    created: "2025-01-01T00:00:00Z",
    updated: new Date().toISOString(),
    rvn,
    stats: { attributes: {} },
    items: {}
  };

  if (profileId === "athena") {
    profile.stats.attributes = {
      level: 100,
      season_num: 10,
      book_level: 100,
      book_xp: 999999
    };

    profile.items["BattlePass"] = {
      templateId: "Token:season10_battlepass",
      attributes: { item_seen: true }
    };

    profile.items["UltimaKnight"] = {
      templateId: "AthenaCharacter:CID_484_Athena_Character_Default",
      attributes: { item_seen: true }
    };
  }

  if (profileId === "common_core") {
    profile.items["VBucks"] = {
      templateId: "Currency:MtxPurchased",
      quantity: 999999,
      attributes: { platform: "EpicPC" }
    };
  }

  return profile;
}

/* =======================
   PROFILE ENDPOINT
======================= */
app.post("/fortnite/api/game/v2/profile/:accountId/client/:command", (req, res) => {
  const user = getOrCreateUser("Player");
  const profileId = req.query.profileId || "common_core";

  user.rvn[profileId] = (user.rvn[profileId] || 1) + 1;
  saveUsers(loadUsers());

  const profile = buildProfile(user, profileId);

  res.json({
    profileRevision: profile.rvn,
    profileId,
    profileChangesBaseRevision: profile.rvn - 1,
    profileChanges: [{
      changeType: "fullProfileUpdate",
      profile
    }],
    serverTime: new Date().toISOString(),
    responseVersion: 1
  });
});

/* =======================
   CONTENT (SEASON X)
======================= */
app.get("/content/api/pages/fortnite-game", (req, res) => {
  res.json({
    battlepassaboutmessages: {
      news: [{
        title: "SEASON X",
        body: "Out of Time.",
        image: "https://i.imgur.com/DYhYsgd.png"
      }]
    },
    dynamicbackgrounds: {
      backgrounds: {
        backgrounds: [{
          stage: "season10",
          backgroundimage: "https://i.imgur.com/DYhYsgd.png"
        }]
      }
    },
    shopsections: { sections: [] },
    playlistinformation: {},
    subgameselectdata: {},
    emergencynotice: {}
  });
});

/* =======================
   STABILITY / SERVICES
======================= */
app.get("/lightswitch/api/service/bulk/status", (req, res) => {
  res.json([{
    serviceInstanceId: "fortnite",
    status: "UP",
    allowedActions: ["PLAY"]
  }]);
});

app.get("/fortnite/api/v2/versioncheck/*", (req, res) => {
  res.json({ type: "NO_UPDATE" });
});

app.get("/fortnite/api/waitingroom/v1/waitingroom", (req, res) => {
  res.status(204).end();
});

app.post("/datarouter/api/v1/public/data", (req, res) => {
  res.status(204).end();
});

/* =======================
   START
======================= */
app.listen(PORT, () => {
  console.log(`OGFN Season X backend running on ${PORT}`);
});
