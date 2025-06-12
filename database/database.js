const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'trading_bot.db');
const db = new Database(dbPath);

function initDatabase() {
  return new Promise((resolve, reject) => {
    try {
      // Create orders table
      db.prepare(`
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
      `).run();

      // Create config table
      db.prepare(`
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
      `).run();

      // Check if config exists
      const configCount = db.prepare('SELECT COUNT(*) AS count FROM config').get().count;
      
      if (configCount === 0) {
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

        const insertStmt = db.prepare(`
          INSERT INTO config (
            symbol, timeframe, plusDIThreshold, minusDIThreshold,
            adxMinimum, takeProfitPercent, stopLossPercent, leverage
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStmt.run([
          defaultConfig.symbol,
          defaultConfig.timeframe,
          defaultConfig.plusDIThreshold,
          defaultConfig.minusDIThreshold,
          defaultConfig.adxMinimum,
          defaultConfig.takeProfitPercent,
          defaultConfig.stopLossPercent,
          defaultConfig.leverage
        ]);

        console.log('Default configuration inserted into database');
      }

      resolve(db);
    } catch (error) {
      reject(error);
    }
  });
}

function closeDatabase() {
  db.close();
}

module.exports = { db, initDatabase, closeDatabase };