const { getAllOrders: getAllOrdersFromDB, getOrdersBySymbol: getOrdersBySymbolFromDB, updateOrderStatus: updateOrderStatusInDB } = require('../helpers/dbHelpers');
const { getAccountInfo } = require('../helpers/binanceHelpers');

async function getOrders(req, res) {
  try {
    const orders = await getAllOrdersFromDB();
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
  }
}

async function getOrdersBySymbol(req, res) {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const orders = await getOrdersBySymbolFromDB(symbol); 
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching orders by symbol', error: error.message });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    await updateOrderStatusInDB(orderId, status);  
    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating order status', error: error.message });
  }
}

module.exports = { getOrders, getOrdersBySymbol, updateOrderStatus };
