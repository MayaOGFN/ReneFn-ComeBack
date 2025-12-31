const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// --- HOMEPAGE (Dark Faded with Effects) ---
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>RENEFN | Coming Soon</title>
        <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: 'Segoe UI', sans-serif; background: #050505; }
            
            /* The Imgur Background with Faded Effect */
            .bg {
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                background: url('https://imgur.com/jjVqtPE.png') no-repeat center center;
                background-size: cover;
                filter: brightness(0.3) contrast(1.2) blur(2px);
                z-index: 1;
            }

            .overlay {
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                background: radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%);
                z-index: 2;
            }

            .content {
                position: relative;
                z-index: 3;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                text-align: center;
            }

            h1 {
                font-size: 5rem;
                letter-spacing: 15px;
                margin: 0;
                background: linear-gradient(to bottom, #fff, #444);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: float 4s ease-in-out infinite;
            }

            .status-box {
                margin-top: 20px;
                padding: 10px 30px;
                border: 1px solid rgba(255,255,255,0.1);
                background: rgba(255,255,255,0.05);
                backdrop-filter: blur(10px);
                border-radius: 50px;
                text-transform: uppercase;
                letter-spacing: 2px;
                font-size: 0.8rem;
                color: #ff3333;
                box-shadow: 0 0 15px rgba(255, 0, 0, 0.2);
            }

            @keyframes float {
                0%, 100% { transform: translateY(0); opacity: 0.8; }
                50% { transform: translateY(-10px); opacity: 1; }
            }
        </style>
    </head>
    <body>
        <div class="bg"></div>
        <div class="overlay"></div>
        <div class="content">
            <h1>RENEFN</h1>
            <div class="status-box">Homepage Soon • Backend Active</div>
        </div>
    </body>
    </html>`);
});

// --- OGFN API MOCK (Add your real logic here) ---
app.get('/fortnite/api/cloudstorage/system', (req, res) => res.json([]));

app.listen(PORT, () => {
    console.log(`----------------------------------`);
    console.log(`RENEFN Backend: https://renefn-comeback.onrender.com`);
    console.log(`Status: ONLINE & SECURE`);
    console.log(`----------------------------------`);
});
