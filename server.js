const express = require('express');
const { Client, IntentsBitField } = require('discord.js');
const fs = require('fs');
const app = express();

// --- DISCORD BOT CONFIG ---
const client = new Client({
    intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent]
});

client.on('ready', () => console.log(`Bot Online: ${client.user.tag}`));

client.on('messageCreate', (msg) => {
    if (msg.content.startsWith('!create')) {
        // Simple logic to simulate account creation
        const [_, user, pass] = msg.content.split(' ');
        if (!user || !pass) return msg.reply("Usage: !create user pass");
        msg.reply(`✅ Account **${user}** created for ReneFN!`);
    }
});

client.login('MTQ1NTg0MjM5Nzg3ODc1MTI1Mg.Gm2z5K.eoe-BHY9-wh4qoLJAK1JZTrKke0DkocsZPauqo');

// --- WEBSITE CONFIG ---
app.get('/', (req, res) => {
    res.send(`
    <html>
        <head>
            <style>
                body { margin: 0; background: url('https://imgur.com/jjVqtPE.png') no-repeat center center fixed; background-size: cover; font-family: 'Segoe UI', sans-serif; overflow: hidden; }
                .overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.9) 100%); display: flex; align-items: center; justify-content: center; }
                .text-box { text-align: center; color: white; animation: pulse 3s infinite; }
                h1 { font-size: 4rem; letter-spacing: 10px; text-shadow: 0 0 20px #ff0000; }
                p { font-size: 1.5rem; opacity: 0.7; }
                @keyframes pulse { 0% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 0.8; } }
            </style>
        </head>
        <body>
            <div class="overlay">
                <div class="text-box">
                    <h1>RENEFN</h1>
                    <p>HOMEPAGE SOON</p>
                </div>
            </div>
        </body>
    </html>`);
});

app.listen(8080, () => console.log("Backend running on port 8080"));
