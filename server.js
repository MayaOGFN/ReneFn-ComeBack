const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// Path to your users file
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');

// --- FIX: Ensure the 'data' folder and 'users.json' exist ---
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
}

// Helper to read/write JSON
const readUsers = () => JSON.parse(fs.readFileSync(usersFile, 'utf8'));
const writeUsers = (data) => fs.writeFileSync(usersFile, JSON.stringify(data, null, 2));

// --- REGISTRATION ROUTE ---
app.post('/register', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required!" });

        const users = readUsers();
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ success: false, message: "User already exists!" });
        }

        users.push({ email, password });
        writeUsers(users);
        
        console.log(`New user registered: ${email}`);
        res.json({ success: true, message: "Account created successfully!" });
    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error. Check backend logs." });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
