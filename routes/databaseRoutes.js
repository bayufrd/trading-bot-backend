const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { initDatabase, closeDatabase } = require('../database/database');

const router = express.Router();

router.delete('/reset', async (req, res) => {
  try {
    // Optional: Add authentication middleware
    // if (!req.user || req.user.role !== 'admin') {
    //   return res.status(403).json({ 
    //     success: false, 
    //     message: 'Unauthorized access' 
    //   });
    // }

    // Close existing database connection
    closeDatabase();

    // Define database path
    const dbPath = path.join(__dirname, '../database/trading_bot.db');

    try {
      // Check if database file exists
      await fs.access(dbPath);
      
      // Delete database file
      await fs.unlink(dbPath);
      console.log('Database file deleted successfully');
    } catch (fileError) {
      console.warn('Database file not found or already deleted');
    }

    // Reinitialize database
    const newDb = await initDatabase();

    res.json({
      success: true,
      message: 'Database reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset database',
      error: error.message
    });
  }
});

router.get('/info', async (req, res) => {
  try {
    const db = require('../database/database').getDatabase();
    
    // Get table information
    const tablesQuery = db.prepare(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type='table'
    `).all();

    const tableStats = await Promise.all(tablesQuery.map(async (table) => {
      const countQuery = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`);
      const countResult = countQuery.get();
      
      return {
        name: table.name,
        schema: table.sql,
        rowCount: countResult.count
      };
    }));

    // Get database file stats
    const dbPath = path.join(__dirname, '../database/trading_bot.db');
    const stats = await fs.stat(dbPath);

    res.json({
      success: true,
      database: {
        path: dbPath,
        size: stats.size, // bytes
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      },
      tables: tableStats
    });
  } catch (error) {
    console.error('Database info retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve database information',
      error: error.message
    });
  }
});

router.delete('/clear-orders', async (req, res) => {
  try {
    const db = require('../database/database').getDatabase();
    
    // Delete all orders
    const result = db.prepare('DELETE FROM orders').run();

    res.json({
      success: true,
      message: 'All orders deleted successfully',
      deletedRows: result.changes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Order deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete orders',
      error: error.message
    });
  }
});

router.post('/backup', async (req, res) => {
  try {
    const dbPath = path.join(__dirname, '../database/trading_bot.db');
    const backupPath = path.join(__dirname, `../database/backup_${Date.now()}.db`);

    // Copy database file
    await fs.copyFile(dbPath, backupPath);

    res.json({
      success: true,
      message: 'Database backed up successfully',
      backupPath: backupPath,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to backup database',
      error: error.message
    });
  }
});

module.exports = router;