// ReneFN Backend (Single-File, Render-Optimized)
// ----------------------------------------------

const express = require("express");
const crypto = require("crypto");
const cors = require("cors");

const app = express();

// Render (or any host) will inject PORT via env
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

// In-memory session store
const sessions = new Map();

// Utility: generate random IDs
function gen() {
    return crypto.randomBytes(16).toString("hex");
}

// ------------------------------------------------------
// 1. AUTH SYSTEM (Custom Token + Account ID)
// ------------------------------------------------------
app.post("/renefn/auth/token", (req, res) => {
    const body = req.body || {};

    const username =
        body.username ||
        "RenePlayer_" + Math.floor(Math.random() * 9999);

    const accountId = gen();
    const token = gen();

    sessions.set(token, { username, accountId });

    console.log(`[AUTH] ${username} logged in (${accountId})`);

    res.json({
        access_token: token,
        account_id: accountId,
        username: username,
        expires_in: 86400
    });
});

// Verify token
app.get("/renefn/auth/verify", (req, res) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

    const session = sessions.get(token);

    if (!session) {
        return res.status(401).json({ valid: false });
    }

    res.json({
        valid: true,
        accountId: session.accountId,
        username: session.username
    });
});

// ------------------------------------------------------
// 2. CUSTOM CMS / LOBBY DATA
// ------------------------------------------------------
app.get("/renefn/content/lobby", (req, res) => {
    res.json({
        lobbyBackground: "Season7",
        news: [
            {
                title: "RENEFN",
                body: "Backend Connected Successfully",
                image: "https://i.imgur.com/DYhYsgd.png"
            }
        ]
    });
});

// ------------------------------------------------------
// 3. PLAYER PROFILE (Custom Style)
// ------------------------------------------------------
app.post("/renefn/profile/get", (req, res) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

    const session = sessions.get(token);

    if (!session) {
        return res.status(401).json({ error: "Invalid token" });
    }

    res.json({
        accountId: session.accountId,
        username: session.username,
        stats: {
            level: 100,
            xp: 999999
        },
        inventory: {
            vbucks: 1337,
            items: []
        }
    });
});

// ------------------------------------------------------
// 4. LOBBY STATE (Custom)
// ------------------------------------------------------
app.post("/renefn/lobby/state", (req, res) => {
    res.json({
        state: "Lobby",
        players: 1,
        timestamp: new Date().toISOString()
    });
});

// ------------------------------------------------------
// 5. ROOT CHECK
// ------------------------------------------------------
app.get("/", (req, res) => {
    res.json({
        status: "ok",
        service: "ReneFN Backend",
        time: new Date().toISOString()
    });
});

// ------------------------------------------------------
// 6. START SERVER
// ------------------------------------------------------
app.listen(PORT, () => {
    console.log(`ReneFN Backend running on port ${PORT}`);
});
