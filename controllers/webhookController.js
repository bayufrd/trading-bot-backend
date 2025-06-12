const { validateSignal, calculateTPSL } = require('../helpers/tradingHelpers');
const { saveOrder } = require('../helpers/dbHelpers');
const { getBinancePrice } = require('../helpers/binanceHelpers');
const axios = require('axios');

async function simulateOrderOnTestnet(order) {
  try {
    const testnetUrl = 'https://testnet.binancefuture.com/fapi/v1/order';
    
    const apiKey = process.env.BINANCE_TESTNET_API_KEY;
    const apiSecret = process.env.BINANCE_TESTNET_API_SECRET;

    const params = {
      symbol: order.symbol,
      side: order.action === 'BUY' ? 'BUY' : 'SELL',
      type: 'LIMIT',
      timeInForce: 'GTC',
      price: order.price_entry,
      quantity: calculateOrderQuantity(order.price_entry), 
      leverage: parseInt(order.leverage), 
      stopPrice: order.sl_price,
      takeProfitPrice: order.tp_price,
      timestamp: Date.now()
    };

    const signature = generateSignature(params, apiSecret);
    params.signature = signature;

    const response = await axios.post(testnetUrl, null, {
      params,
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Testnet Order Simulation Error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function processWebhook(req, res) {
  try {
    const { symbol, plusDI, minusDI, adx, timeframe } = req.body;

    if (!symbol || !plusDI || !minusDI || !adx) {
      return res.status(400).json({
        success: false,
        message: 'Missing required signal parameters'
      });
    }

    console.log('Received TradingView Signal:', req.body);

    const action = validateSignal(plusDI, minusDI, adx);
    if (!action) {
      return res.json({ 
        success: true, 
        message: 'Signal does not meet trading criteria', 
        action: 'NO_ACTION' 
      });
    }

    const currentPrice = await getBinancePrice(symbol);
    if (!currentPrice || typeof currentPrice !== 'number') {
      return res.status(500).json({
        success: false,
        message: 'Unable to fetch current market price'
      });
    }

    const { tpPrice, slPrice } = calculateTPSL(currentPrice, action);

    const order = {
      id: `ORDER_${Date.now()}`,
      symbol,
      action,
      price_entry: currentPrice.toFixed(2),
      tp_price: parseFloat(tpPrice),
      sl_price: parseFloat(slPrice),
      leverage: '10x',
      timeframe: timeframe || '5m',
      timestamp: new Date().toISOString(),
      signal_data: { plusDI, minusDI, adx }
    };

    await saveOrder(order);

    const testnetResponse = await simulateOrderOnTestnet(order);

    res.json({
      success: true,
      message: 'Signal processed successfully',
      order,
      testnetResponse
    });

  } catch (error) {
    console.error('Webhook Processing Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
}

function calculateOrderQuantity(price) {
  // Implement logic to calculate position size
  // This should consider:
  // 1. Account balance
  // 2. Risk management rules
  // 3. Selected leverage
  const accountBalance = 1000; 
  const riskPercentage = 0.01; 
  
  const positionSize = (accountBalance * riskPercentage) / price;
  return parseFloat(positionSize.toFixed(3));
}

function generateSignature(params, apiSecret) {
  const queryString = Object.keys(params)
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
}

module.exports = { processWebhook };