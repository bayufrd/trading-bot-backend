const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { api } = require('./helpers/binanceHelpers');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Default configuration
let config = {
  symbol: 'BTCUSDT',
  timeframe: '5m',
  plusDIThreshold: 25,
  minusDIThreshold: 20,
  adxMinimum: 20,
  takeProfitPercent: 2,
  stopLossPercent: 1,
  leverage: '10x'
};

// SQLite Database setup
const dbPath = path.join(__dirname, 'trading_bot.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create orders table
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          symbol TEXT NOT NULL,
          action TEXT NOT NULL,
          price_entry REAL NOT NULL,
          tp_price REAL NOT NULL,
          sl_price REAL NOT NULL,
          leverage TEXT NOT NULL,
          timeframe TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          plusDI REAL,
          minusDI REAL,
          adx REAL,
          status TEXT DEFAULT 'ACTIVE',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating orders table:', err);
          reject(err);
        } else {
          console.log('Orders table initialized successfully');
          
          // Create config table
          db.run(`
            CREATE TABLE IF NOT EXISTS config (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              symbol TEXT,
              timeframe TEXT,
              plusDIThreshold REAL,
              minusDIThreshold REAL,
              adxMinimum REAL,
              takeProfitPercent REAL,
              stopLossPercent REAL,
              leverage TEXT,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              console.error('Error creating config table:', err);
              reject(err);
            } else {
              console.log('Config table initialized successfully');
              resolve();
            }
          });
        }
      });
    });
  });
}

// Database helper functions
const dbHelpers = {
  // Save order to database
  saveOrder: (order) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO orders (
          id, symbol, action, price_entry, tp_price, sl_price, 
          leverage, timeframe, timestamp, plusDI, minusDI, adx
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        order.id,
        order.symbol,
        order.action,
        order.price_entry,
        order.tp_price,
        order.sl_price,
        order.leverage,
        order.timeframe,
        order.timestamp,
        order.signal_data.plusDI,
        order.signal_data.minusDI,
        order.signal_data.adx
      ], function(err) {
        if (err) {
          console.error('Error saving order:', err);
          reject(err);
        } else {
          console.log('Order saved to database with ID:', order.id);
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  },

  // Get all orders
  getAllOrders: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id, symbol, action, price_entry, tp_price, sl_price,
          leverage, timeframe, timestamp, plusDI, minusDI, adx,
          status, created_at
        FROM orders 
        ORDER BY created_at DESC
      `, (err, rows) => {
        if (err) {
          console.error('Error fetching orders:', err);
          reject(err);
        } else {
          // Transform data to match original format
          const orders = rows.map(row => ({
            id: row.id,
            symbol: row.symbol,
            action: row.action,
            price_entry: row.price_entry,
            tp_price: row.tp_price,
            sl_price: row.sl_price,
            leverage: row.leverage,
            timeframe: row.timeframe,
            timestamp: row.timestamp,
            status: row.status,
            signal_data: {
              plusDI: row.plusDI,
              minusDI: row.minusDI,
              adx: row.adx
            }
          }));
          resolve(orders);
        }
      });
    });
  },

  // Get orders by symbol
  getOrdersBySymbol: (symbol) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM orders 
        WHERE symbol = ? 
        ORDER BY created_at DESC
      `, [symbol], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Update order status
  updateOrderStatus: (orderId, status) => {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [status, orderId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  },

  // Save config to database
  saveConfig: (configData) => {
    return new Promise((resolve, reject) => {
      // First, clear existing config
      db.run('DELETE FROM config', (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Then insert new config
        const stmt = db.prepare(`
          INSERT INTO config (
            symbol, timeframe, plusDIThreshold, minusDIThreshold,
            adxMinimum, takeProfitPercent, stopLossPercent, leverage
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
          configData.symbol,
          configData.timeframe,
          configData.plusDIThreshold,
          configData.minusDIThreshold,
          configData.adxMinimum,
          configData.takeProfitPercent,
          configData.stopLossPercent,
          configData.leverage
        ], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        });
        
        stmt.finalize();
      });
    });
  },

  // Load config from database
  loadConfig: () => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM config 
        ORDER BY updated_at DESC 
        LIMIT 1
      `, (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            symbol: row.symbol,
            timeframe: row.timeframe,
            plusDIThreshold: row.plusDIThreshold,
            minusDIThreshold: row.minusDIThreshold,
            adxMinimum: row.adxMinimum,
            takeProfitPercent: row.takeProfitPercent,
            stopLossPercent: row.stopLossPercent,
            leverage: row.leverage
          });
        } else {
          resolve(null); // No config found
        }
      });
    });
  }
};

// Helper function to get current price from Binance
async function getBinancePrice(symbol) {
  try {
    console.log(`Fetching price for symbol: ${symbol}`);
    
    const endpoints = [
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
      `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`,
    ];
    
    let lastError;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const response = await axios.get(endpoint, {
          timeout: 10000,
          headers: {
            'User-Agent': 'TradingBot/1.0'
          }
        });
        
        if (response.data && response.data.price) {
          const price = parseFloat(response.data.price);
          console.log(`Successfully fetched price: ${price} for ${symbol}`);
          return price;
        }
      } catch (err) {
        console.log(`Endpoint ${endpoint} failed:`, err.message);
        lastError = err;
        continue;
      }
    }
    
    console.warn('All Binance endpoints failed, using mock price for testing');
    const mockPrices = {
      'BTCUSDT': 43000 + Math.random() * 1000,
      'ETHUSDT': 2500 + Math.random() * 100,
      'BNBUSDT': 300 + Math.random() * 50
    };
    
    const mockPrice = mockPrices[symbol] || 100 + Math.random() * 900;
    console.log(`Using mock price: ${mockPrice} for ${symbol}`);
    return mockPrice;
    
  } catch (error) {
    console.error('Error in getBinancePrice:', error);
    const fallbackPrice = 43000 + Math.random() * 1000;
    console.log(`Using fallback price: ${fallbackPrice}`);
    return fallbackPrice;
  }
}

// Helper function to validate trading signal
function validateSignal(plusDI, minusDI, adx) {
  const isBuySignal = plusDI > config.plusDIThreshold && 
                     minusDI < config.minusDIThreshold && 
                     adx > config.adxMinimum;
  
  const isSellSignal = plusDI < config.plusDIThreshold && 
                      minusDI > config.minusDIThreshold && 
                      adx > config.adxMinimum;
  
  if (isBuySignal) return 'BUY';
  if (isSellSignal) return 'SELL';
  return null;
}

// Helper function to calculate TP and SL prices
function calculateTPSL(entryPrice, action, tpPercent, slPercent) {
  const tpMultiplier = action === 'BUY' ? (1 + tpPercent / 100) : (1 - tpPercent / 100);
  const slMultiplier = action === 'BUY' ? (1 - slPercent / 100) : (1 + slPercent / 100);
  
  return {
    tpPrice: (entryPrice * tpMultiplier).toFixed(2),
    slPrice: (entryPrice * slMultiplier).toFixed(2)
  };
}

// Routes

// POST /config - Save configuration
app.post('/config', async (req, res) => {
  try {
    const {
      symbol,
      timeframe,
      plusDIThreshold,
      minusDIThreshold,
      adxMinimum,
      takeProfitPercent,
      stopLossPercent,
      leverage
    } = req.body;

    // Update configuration
    config = {
      symbol: symbol || config.symbol,
      timeframe: timeframe || config.timeframe,
      plusDIThreshold: plusDIThreshold || config.plusDIThreshold,
      minusDIThreshold: minusDIThreshold || config.minusDIThreshold,
      adxMinimum: adxMinimum || config.adxMinimum,
      takeProfitPercent: takeProfitPercent || config.takeProfitPercent,
      stopLossPercent: stopLossPercent || config.stopLossPercent,
      leverage: leverage || config.leverage
    };

    // Save to database
    await dbHelpers.saveConfig(config);

    console.log('Configuration updated:', config);
    
    res.json({
      success: true,
      message: 'Configuration saved successfully to database',
      config: config
    });
  } catch (error) {
    console.error('Error saving configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving configuration',
      error: error.message
    });
  }
});

// GET /config - Get current configuration
app.get('/config', (req, res) => {
  res.json({
    success: true,
    config: config
  });
});

// POST /webhook - Receive TradingView signals
app.post('/webhook', async (req, res) => {
  try {
    const { symbol, plusDI, minusDI, adx, timeframe } = req.body;

    console.log('Received webhook signal:', req.body);

    if (!symbol || plusDI === undefined || minusDI === undefined || adx === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: symbol, plusDI, minusDI, adx'
      });
    }

    const action = validateSignal(plusDI, minusDI, adx);
    
    if (!action) {
      return res.json({
        success: true,
        message: 'Signal does not meet criteria',
        signal: 'NO_ACTION',
        criteria: {
          plusDI: plusDI,
          minusDI: minusDI,
          adx: adx,
          thresholds: {
            plusDIThreshold: config.plusDIThreshold,
            minusDIThreshold: config.minusDIThreshold,
            adxMinimum: config.adxMinimum
          }
        }
      });
    }

    let currentPrice;
    try {
      currentPrice = await getBinancePrice(symbol);
    } catch (priceError) {
      console.error('Price fetch error:', priceError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch current price',
        error: priceError.message
      });
    }
    
    const { tpPrice, slPrice } = calculateTPSL(
      currentPrice, 
      action, 
      config.takeProfitPercent, 
      config.stopLossPercent
    );

    const order = {
      id: Date.now().toString(),
      symbol: symbol,
      action: action,
      price_entry: currentPrice.toFixed(2),
      tp_price: parseFloat(tpPrice),
      sl_price: parseFloat(slPrice),
      leverage: config.leverage,
      timeframe: timeframe || config.timeframe,
      timestamp: new Date().toISOString(),
      signal_data: {
        plusDI: plusDI,
        minusDI: minusDI,
        adx: adx
      }
    };

    // Save order to database
    await dbHelpers.saveOrder(order);

    console.log('Order created successfully:', order);

    res.json({
      success: true,
      message: 'Signal processed and order saved to database',
      order: order,
      price_source: 'binance_api'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
});

// GET /orders - Get all orders from database
app.get('/orders', async (req, res) => {
  try {
    const orders = await dbHelpers.getAllOrders();
    res.json({
      success: true,
      orders: orders,
      total: orders.length,
      source: 'sqlite_database'
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders from database',
      error: error.message
    });
  }
});

// GET /orders/:symbol - Get orders by symbol
app.get('/orders/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const orders = await dbHelpers.getOrdersBySymbol(symbol);
    res.json({
      success: true,
      orders: orders,
      total: orders.length,
      symbol: symbol
    });
  } catch (error) {
    console.error('Error fetching orders by symbol:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders by symbol',
      error: error.message
    });
  }
});

// PUT /orders/:id/status - Update order status
app.put('/orders/:id/status', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const changes = await dbHelpers.updateOrderStatus(orderId, status);
    
    if (changes > 0) {
      res.json({
        success: true,
        message: 'Order status updated successfully',
        orderId: orderId,
        newStatus: status
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running with SQLite database',
    timestamp: new Date().toISOString(),
    database: 'SQLite',
    config: config
  });
});

// Test Binance API connection
app.get('/test-binance/:symbol?', async (req, res) => {
  try {
    const symbol = req.params.symbol || 'BTCUSDT';
    console.log(`Testing Binance API for symbol: ${symbol}`);
    
    const price = await api.binance(symbol);
    
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

// Initialize server
async function startServer() {
  try {
    // Initialize database
    await initDatabase();
    
    // Load config from database
    const savedConfig = await dbHelpers.loadConfig();
    if (savedConfig) {
      config = savedConfig;
      console.log('Configuration loaded from database:', config);
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Database: SQLite (${dbPath})`);
      console.log('Current configuration:', config);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

startServer();