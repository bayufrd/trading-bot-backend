const express = require('express');
const router = express.Router();
const { getOrders, getOrdersBySymbol, updateOrderStatus } = require('../controllers/orderController');

// GET /orders - Get all orders from database
router.get('/', getOrders);

// GET /orders/:symbol - Get orders by symbol from database
router.get('/:symbol', getOrdersBySymbol);

// PUT /orders/:id/status - Update order status
router.put('/:id/status', updateOrderStatus);

module.exports = router;
