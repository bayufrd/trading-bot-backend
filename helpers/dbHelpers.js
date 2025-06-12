const { db } = require('../database/database');

function saveOrder(order) {
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
        reject('Error saving order:', err);
      } else {
        resolve(this.lastID);
      }
    });
    
    stmt.finalize();
  });
}

function getAllOrders() {
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
        reject('Error fetching orders:', err);
      } else {
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
}

function getOrdersBySymbol(symbol) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM orders 
      WHERE symbol = ? 
      ORDER BY created_at DESC
    `, [symbol], (err, rows) => {
      if (err) {
        reject('Error fetching orders by symbol:', err);
      } else {
        resolve(rows);
      }
    });
  });
}

function updateOrderStatus(orderId, status) {
  return new Promise((resolve, reject) => {
    db.run(`
      UPDATE orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [status, orderId], function(err) {
      if (err) {
        reject('Error updating order status:', err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

function saveConfig(configData) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM config', (err) => {
      if (err) {
        reject('Error clearing config:', err);
        return;
      }

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
          reject('Error inserting config:', err);
        } else {
          resolve(this.lastID); // Return the last inserted ID
        }
      });

      stmt.finalize();
    });
  });
}

function loadConfig() {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM config 
        ORDER BY updated_at DESC 
        LIMIT 1
      `, (err, row) => {
        if (err) {
          reject('Error loading config: ' + err.message);  
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
          resolve(null); 
        }
      });
    });
  }
  

module.exports = { saveOrder, getAllOrders, getOrdersBySymbol, updateOrderStatus, saveConfig, loadConfig };
