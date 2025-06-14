const express = require('express');
const cors = require('cors');

const app = express();

// Konfigurasi CORS
const corsOptions = {
    origin: 'https://trading-bot-frontend-rho.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.post('/webhook', (req, res) => {
    res.json({ message: 'Webhook received!' });
});

app.listen(3001, () => {
    console.log('Server is running on port 3001');
});