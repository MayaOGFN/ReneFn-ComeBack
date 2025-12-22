const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json()); // Essential for reading registration data

const dataPath = (file) => path.join(__dirname, 'data', file);

// Helper to read/write JSON
const readJson = (file) => JSON.parse(fs.readFileSync(dataPath(file), 'utf8'));
const writeJson = (file, data) => fs.writeFileSync(dataPath(file), JSON.stringify(data, null, 2));

// --- ROUTES ---

app.get('/', (req, res) => res.send("ReneFN Backend Online"));

app.get('/launcher/version', (req, res) => res.send(readJson('launcherVersion.json').version));
app.get('/news', (req, res) => res.json(readJson('news.json')));
app.get('/shop', (req, res) => res.json(readJson('shop.json')));

// --- NEW REGISTRATION API ---
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Missing info" });

    const users = readJson('users.json');
    
    // Check if user exists
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, message: "User already exists!" });
    }

    // Add user and save
    users.push({ email, password });
    writeJson('users.json', users);
    
    res.json({ success: true, message: "Account Created!" });
});

app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
