const axios = require('axios');
const https = require('https');

async function getBinancePrice(symbol) {
  try {
    console.log(`Fetching price for symbol: ${symbol}`);
    let interval = '1m';
    const endpoints = [
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
      // `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`,
      // `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}`,
      // `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=5`,
    ];

    let lastError;

    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);

        const response = await axios.get(endpoint, {
          timeout: 10000,
          httpsAgent: agent,
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

    console.error('All Binance endpoints failed');
    // const mockPrices = {
    //   'BTCUSDT': 43000 + Math.random() * 1000,
    //   'ETHUSDT': 2500 + Math.random() * 100,
    //   'BNBUSDT': 300 + Math.random() * 50
    // };

    // const mockPrice = mockPrices[symbol] || (100 + Math.random() * 900);
    // console.log(Using mock price: ${mockPrice} for ${symbol});
    // return mockPrice; // Return mock price if all fails
    return { success: false, error: `Unable to fetch price from Binance. Last error: ${lastError.message}` };

  } catch (error) {
    console.error('Error in getBinancePrice:', error);
    return { success: false, error: `Error: ${error.message}` }; 
  }
}

module.exports = { getBinancePrice };
