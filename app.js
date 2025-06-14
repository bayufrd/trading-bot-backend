const express = require('express');
const corsMiddleware = require('./middleware/cors');
const path = require('path');
const { initDatabase } = require('./database/database');
const configRoutes = require('./routes/configRoutes');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const { loadConfig } = require('./helpers/dbHelpers');
const { getBinancePrice, getAccountInfo } = require('./helpers/binanceHelpers');

const PORT = process.env.PORT || 3001;

const app = express();

app.use(corsMiddleware);
app.use(express.json());

// Define routes
app.use('/config', configRoutes);
app.use('/orders', orderRoutes);
app.use('/webhook', webhookRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Account info route
app.get('/account', async (req, res) => {
  try {
    const accountInfo = await getAccountInfo();
    res.json({ success: true, accountInfo });
  } catch (error) {
    console.error('Error fetching account info:', error);
    res.status(500).json({ success: false, message: 'Error fetching account info', error: error.message });
  }
});

// Test Binance API connection
app.get('/test-binance/:symbol?', async (req, res) => {
  try {
    const symbol = req.params.symbol || 'BTCUSDT';
    console.log(`Testing Binance API for symbol: ${symbol}`);
    
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

// Start server after initializing the database
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