const { validateSignal, calculateTPSL } = require('../helpers/tradingHelpers');
const { saveOrder } = require('../helpers/dbHelpers');
const { getBinancePrice } = require('../helpers/binanceHelpers');

async function processWebhook(req, res) {
  try {
    const { symbol, plusDI, minusDI, adx } = req.body;

    // Validate signal
    const action = validateSignal(plusDI, minusDI, adx);
    if (!action) {
      return res.json({ success: true, message: 'Signal does not meet criteria', action: 'NO_ACTION' });
    }

    const currentPrice = await getBinancePrice(symbol);
    const { tpPrice, slPrice } = calculateTPSL(currentPrice, action);

    const order = {
      id: Date.now().toString(),
      symbol,
      action,
      price_entry: currentPrice.toFixed(2),
      tp_price: parseFloat(tpPrice),
      sl_price: parseFloat(slPrice),
    };

    await saveOrder(order);

    res.json({ success: true, message: 'Order saved', order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing webhook', error: error.message });
  }
}

module.exports = { processWebhook };
