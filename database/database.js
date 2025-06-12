const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'trading_bot.db');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
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
          reject('Error creating orders table:', err);
        }
      });

      // Create config table if it doesn't exist
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
          reject('Error creating config table:', err);
        } else {
          db.get('SELECT COUNT(*) AS count FROM config', (err, row) => {
            if (err) {
              reject('Error checking config table:', err);
            } else if (row.count === 0) {
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

              const stmt = db.prepare(`
                INSERT INTO config (
                  symbol, timeframe, plusDIThreshold, minusDIThreshold,
                  adxMinimum, takeProfitPercent, stopLossPercent, leverage
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `);

              stmt.run([
                defaultConfig.symbol,
                defaultConfig.timeframe,
                defaultConfig.plusDIThreshold,
                defaultConfig.minusDIThreshold,
                defaultConfig.adxMinimum,
                defaultConfig.takeProfitPercent,
                defaultConfig.stopLossPercent,
                defaultConfig.leverage
              ], function(err) {
                if (err) {
                  reject('Error inserting default config:', err);
                } else {
                  console.log('Default configuration inserted into database');
                  resolve();
                }
              });

              stmt.finalize();
            } else {
              resolve();
            }
          });
        }
      });
    });
  });
}

module.exports = { db, initDatabase };
