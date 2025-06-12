const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database/database');
const configRoutes = require('./routes/configRoutes');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const { loadConfig } = require('./helpers/dbHelpers');
const { api } = require('./helpers/binanceHelpers');
const { getBinancePrice } = require('./helpers/binanceHelpers');

const PORT = process.env.PORT || 3001;
const CORS_ORIGINS = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : ['http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (CORS_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

const app = express();

// Apply CORS before routes
app.use(cors(corsOptions));
// Middleware
app.use(express.json());
app.use(cors());

app.use('/config', configRoutes);
app.use('/orders', orderRoutes);
app.use('/webhook', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use(cors({
  origin: [
    'https://your-frontend-domain.vercel.app',
    'http://localhost:3000'
  ]
}));
// Test Binance API connection
app.get('/test-binance/:symbol?', async (req, res) => {
  try {
    const symbol = req.params.symbol || 'BTCUSDT';
    console.log(`Testing Binance API for symbol: ${symbol}`);
    
    // Call the getBinancePrice function to fetch the actual price
    const price = await getBinancePrice(symbol);
    
    res.json({
      success: true,
      message: 'Binance API connection successful',
      symbol: symbol,
      price: price,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Binance API test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Binance API connection failed',
      error: error.message,
      symbol: req.params.symbol || 'BTCUSDT'
    });
  }
});


async function startServer() {
  try {
    await initDatabase();
    
    const savedConfig = await loadConfig();
    if (savedConfig) {
      console.log('Configuration loaded from database:', savedConfig);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

startServer();