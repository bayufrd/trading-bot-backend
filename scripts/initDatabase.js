const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function initializeDatabase() {
  const dbPath = path.join(__dirname, '../database/trading_bot.db');
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database', err);
      return;
    }
    console.log('Database opened successfully');

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
    `);

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
    `);

    // Check if config exists and insert default if not
    db.get('SELECT COUNT(*) AS count FROM config', (err, row) => {
      if (err) {
        console.error('Error checking config', err);
        return;
      }

      if (row.count === 0) {
        const defaultConfig = {
          symbol: 'BTCUSDT',
          timeframe: '5m',
          plusDIThreshold: 25,
          minusDIThreshold: 20,
          adxMinimum: 20,
          takeProfitPercent: 2,
          stopLossPercent: 1,
          leverage: '10x',
        };

        db.run(`
          INSERT INTO config (
            symbol, timeframe, plusDIThreshold, minusDIThreshold,
            adxMinimum, takeProfitPercent, stopLossPercent, leverage
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          defaultConfig.symbol,
          defaultConfig.timeframe,
          defaultConfig.plusDIThreshold,
          defaultConfig.minusDIThreshold,
          defaultConfig.adxMinimum,
          defaultConfig.takeProfitPercent,
          defaultConfig.stopLossPercent,
          defaultConfig.leverage
        ], (err) => {
          if (err) {
            console.error('Error inserting default config', err);
          } else {
            console.log('Default configuration inserted');
          }
        });
      }
    });
  });

  return db;
}

// Run initialization if this script is run directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };