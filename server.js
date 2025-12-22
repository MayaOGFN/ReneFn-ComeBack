/**
 * RENE-FN SEASON X - AUTH & REGISTRATION SYSTEM
 * ---------------------------------------------
 * Now includes:
 * - Homepage "Sign Up" Button
 * - Registration Page (Email, Password, Username)
 * - Persistent users.json storage
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DATABASE FUNCTIONS ---
function loadUsers() {
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 4));
}

// --- 1. HOMEPAGE (WITH SIGN UP BUTTON) ---
app.get('/', (req, res) => {
    res.send(`
        <body style="background:#050505; color:#00ffff; font-family:sans-serif; text-align:center; padding-top:10vh;">
            <div style="border:2px solid #00ffff; display:inline-block; padding:50px; border-radius:15px; background:#000; box-shadow: 0 0 20px #00ffff;">
                <h1>RENE-FN LAUNCHER</h1>
                <p style="color:#fff;">Status: <span style="color:lime;">ONLINE</span></p>
                <hr style="border-color:#222;">
                
                <a href="/signup" style="text-decoration:none;">
                    <button style="background:#00ffff; color:#000; border:none; padding:15px 30px; font-weight:bold; border-radius:5px; cursor:pointer; font-size:1.1em; margin-top:20px;">
                        SIGN UP CONFIG
                    </button>
                </a>

                <p style="font-size:0.8em; margin-top:20px; color:#555;">v10.40 - Starfall Ready</p>
            </div>
        </body>
    `);
});

// --- 2. SIGN UP PAGE (FORM) ---
app.get('/signup', (req, res) => {
    res.send(`
        <body style="background:#050505; color:#fff; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
            <form action="/api/register" method="POST" style="background:#111; padding:40px; border-radius:10px; border:1px solid #333; width:300px;">
                <h2 style="color:#00ffff; text-align:center;">CREATE ACCOUNT</h2>
                
                <label>Username</label><br>
                <input type="text" name="username" required style="width:100%; padding:10px; margin:10px 0; background:#222; border:1px solid #444; color:#fff;"><br>
                
                <label>Email</label><br>
                <input type="email" name="email" required style="width:100%; padding:10px; margin:10px 0; background:#222; border:1px solid #444; color:#fff;"><br>
                
                <label>Password</label><br>
                <input type="password" name="password" required style="width:100%; padding:10px; margin:10px 0; background:#222; border:1px solid #444; color:#fff;"><br>
                
                <button type="submit" style="width:104%; padding:12px; background:#00ffff; border:none; font-weight:bold; cursor:pointer; margin-top:10px;">REGISTER</button>
                <br><br>
                <a href="/" style="color:#555; font-size:0.8em; text-decoration:none;">Back to Home</a>
            </form>
        </body>
    `);
});

// --- 3. REGISTRATION LOGIC ---
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    let users = loadUsers();

    // Check if user exists
    if (users.find(u => u.username === username || u.email === email)) {
        return res.send("<script>alert('User or Email already exists!'); window.location='/signup';</script>");
    }

    const newUser = {
        id: crypto.randomBytes(16).toString('hex'),
        username,
        email,
        password, // In a real app, you should hash this!
        created: new Date().toISOString(),
        vbucks: 999999,
        level: 100
    };

    users.push(newUser);
    saveUsers(users);

    res.send(`
        <body style="background:#000; color:#fff; text-align:center; padding-top:20vh; font-family:sans-serif;">
            <h1 style="color:lime;">SUCCESS!</h1>
            <p>Account created for <b>${username}</b></p>
            <p>You can now login in Fortnite using these credentials.</p>
            <a href="/" style="color:#00ffff;">Return Home</a>
        </body>
    `);
});

// --- 4. OAUTH HANDSHAKE (LOGIN BYPASS) ---
app.post('/account/api/oauth/token', (req, res) => {
    const users = loadUsers();
    // When you login in Fortnite, Starfall sends the name in req.body.username
    const inputName = req.body.username;
    const user = users.find(u => u.username === inputName);

    if (!user) {
        // If account doesn't exist, we reject or auto-create. Let's auto-create for ease:
        return res.json({ error: "User not found. Please register on the homepage." });
    }

    res.json({
        access_token: `token_${user.id}`,
        expires_in: 3600,
        token_type: "bearer",
        account_id: user.id,
        displayName: user.username,
        client_id: "fortnite",
        internal_client: true,
        client_service: "fortnite"
    });
});

// --- 5. REQUIRED GAME ENDPOINTS ---
app.get('/account/api/public/account/:accountId', (req, res) => {
    const users = loadUsers();
    const user = users.find(u => u.id === req.params.accountId);
    res.json({
        id: req.params.accountId,
        displayName: user ? user.username : "Player",
        email: user ? user.email : "none@rene.fn"
    });
});

// (Keep all your other existing endpoints like buildProfile, versioncheck, etc. below this)

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Users database initialized at ${USERS_FILE}`);
});
