const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// --- DATABASE SETUP ---
// This ensures the "data" folder exists on Render so it doesn't crash
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
    console.log("Created data directory");
}
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
    console.log("Created users.json file");
}

// Helper functions
const readUsers = () => {
    try {
        const data = fs.readFileSync(usersFile, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
};

const writeUsers = (users) => {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// --- ROUTES ---

// 1. Fix "Cannot GET /" - This shows when you visit the base URL
app.get('/', (req, res) => {
    res.send("<h1>ReneFN Backend is Online</h1><p>Registration and News APIs are active.</p>");
});

// 2. Registration Route
app.post('/register', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send("Missing email or password!");
        }

        let users = readUsers();

        // Check if user exists
        if (users.find(u => u.email === email)) {
            return res.status(400).send("User already exists!");
        }

        // Add user
        users.push({ email, password, created: new Date() });
        writeUsers(users);

        console.log(`User registered: ${email}`);
        res.status(200).send("Account created successfully!");
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error: " + err.message);
    }
});

// 3. News Route (Example)
app.get('/news', (req, res) => {
    res.json([
        { name: "Welcome to ReneFN", image: "https://i.imgur.com/DYhYsgd.png" },
        { name: "Season X is here!", image: "https://i.imgur.com/DYhYsgd.png" }
    ]);
});

// 4. Version Route
app.get('/launcher/version', (req, res) => {
    res.send("1.0");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
