const cors = require('cors');

const corsOptions = {
    origin: function (origin, callback) {
        // Izinkan permintaan tanpa origin untuk mobile apps atau curl requests
        if (!origin) return callback(null, true);

        // Daftar origin yang diizinkan, misalnya dari variabel lingkungan
        const allowedOrigins = process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',')
            : ['http://localhost:3000', 'https://trading-bot-frontend-rho.vercel.app']; // Daftar origin yang diizinkan
          
        // Jika origin ada di dalam daftar, izinkan
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

module.exports = cors(corsOptions);