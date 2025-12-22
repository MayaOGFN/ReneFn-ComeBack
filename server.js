const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 8080;
const DB_FILE = path.join(__dirname, "users.json");

/* ======================
   GLOBAL
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

function createUser(username, password) {
  const db = loadDB();
  const user = {
    id: crypto.randomBytes(16).toString("hex"),
    username,
    password,
    vbucks: 1000,
    lastClaim: 0,
    rvn: { athena: 1, common_core: 1 }
  };
  db.users.push(user);
  saveDB(db);
  return user;
}

/* ======================
   ROOT (Render health)
====================== */
app.get("/", (req, res) => {
  res.send("OGFN Season X backend running ✔");
});

/* ======================
   WEBSITE UI
====================== */
app.get("/register", (req, res) => {
  res.send(`
  <h2>Register</h2>
  <form method="POST">
    <input name="username" placeholder="Username" required /><br>
    <input name="password" type="password" placeholder="Password" required /><br>
    <button>Register</button>
  </form>
  `);
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (getUser(username)) return res.send("User exists");
  createUser(username, password);
  res.send("Registered ✔");
});

app.get("/login", (req, res) => {
  res.send(`
  <h2>Login</h2>
  <form method="POST">
    <input name="username" placeholder="Username" required /><br>
    <input name="password" type="password" placeholder="Password" required /><br>
    <button>Login</button>
  </form>
  `);
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = getUser(username);
  if (!user || user.password !== password) return res.send("Invalid login");

  res.send(`
    Logged in ✔<br>
    V-Bucks: ${user.vbucks}<br>
    <a href="/daily?user=${username}">Claim Daily 500 V-Bucks</a>
  `);
});

app.get("/daily", (req, res) => {
  const user = getUser(req.query.user);
  if (!user) return res.send("Invalid user");

  const now = Date.now();
  if (now - user.lastClaim < 86400000) {
    return res.send("Already claimed today");
  }

  user.vbucks += 500;
  user.lastClaim = now;

  const db = loadDB();
  db.users = db.users.map(u => u.username === user.username ? user : u);
  saveDB(db);

  res.send(`Claimed 500 V-Bucks ✔ Total: ${user.vbucks}`);
});

/* ======================
   OAUTH (FAST, NO HANG)
====================== */
app.post("/account/api/oauth/token", (req, res) => {
  const username = req.body.username || "Player";
  const user = getUser(username) || createUser(username, "local");

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

/* ======================
   ACCOUNT
====================== */
app.get("/account/api/public/account/:id", (req, res) => {
  res.json({
    id: req.params.id,
    displayName: "Player",
    email: "player@ogfn.local"
  });
});

/* ======================
   PROFILES (NO DESYNC)
====================== */
function buildProfile(user, profileId) {
  return {
    _id: user.id,
    profileId,
    created: "2025-01-01T00:00:00Z",
    updated: new Date().toISOString(),
    rvn: user.rvn[profileId],
    stats: {
      attributes: {
        season_num: 10,
        level: 100,
        book_level: 100
      }
    },
    items: profileId === "common_core"
      ? {
          VBucks: {
            templateId: "Currency:MtxPurchased",
            quantity: user.vbucks,
            attributes: { platform: "EpicPC" }
          }
        }
      : {}
  };
}

app.post("/fortnite/api/game/v2/profile/:id/client/:command", (req, res) => {
  const user = getUser("Player") || createUser("Player", "local");
  const profileId = req.query.profileId || "common_core";

  user.rvn[profileId]++;
  saveDB(loadDB());

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
    battlepassaboutmessages: {
      news: [{ title: "SEASON X", body: "Out of Time." }]
    },
    dynamicbackgrounds: {
      backgrounds: { backgrounds: [{ stage: "season10" }] }
    }
  });
});

app.get("/lightswitch/api/service/bulk/status", (req, res) => {
  res.json([{ serviceInstanceId: "fortnite", status: "UP", allowedActions: ["PLAY"] }]);
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

/* ======================
   START
====================== */
app.listen(PORT, () => {
  console.log("OGFN Season X backend ready ✔");
});
