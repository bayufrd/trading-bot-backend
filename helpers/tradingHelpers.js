function validateSignal(plusDI, minusDI, adx) {
  const { thresholds } = config;
  
  // Detailed signal analysis
  const signalAnalysis = {
    plusDI: {
      value: plusDI,
      buyThreshold: thresholds.plusDI.buy,
      sellThreshold: thresholds.plusDI.sell,
      buyCondition: plusDI > thresholds.plusDI.buy,
      sellCondition: plusDI < thresholds.plusDI.sell
    },
    minusDI: {
      value: minusDI,
      buyThreshold: thresholds.minusDI.buy,
      sellThreshold: thresholds.minusDI.sell,
      buyCondition: minusDI < thresholds.minusDI.buy,
      sellCondition: minusDI > thresholds.minusDI.sell
    },
    adx: {
      value: adx,
      minimumThreshold: thresholds.adx.minimum,
      condition: adx > thresholds.adx.minimum
    }
  };

  // Buy signal conditions
  const isBuySignal = 
    signalAnalysis.plusDI.buyCondition &&
    signalAnalysis.minusDI.buyCondition &&
    signalAnalysis.adx.condition;

  // Sell signal conditions
  const isSellSignal = 
    signalAnalysis.plusDI.sellCondition &&
    signalAnalysis.minusDI.sellCondition &&
    signalAnalysis.adx.condition;

  // Determine action and prepare response
  let action = null;
  if (isBuySignal) action = 'BUY';
  if (isSellSignal) action = 'SELL';

  return {
    action,
    analysis: signalAnalysis,
    isValidSignal: !!action
  };
}
  
function calculateTPSL(
  entryPrice, 
  action, 
  customConfig = {}
) {
  // Merge default config with custom config
  const mergedConfig = {
    takeProfit: {
      buy: customConfig.takeProfitBuy || config.takeProfit.buy,
      sell: customConfig.takeProfitSell || config.takeProfit.sell
    },
    stopLoss: {
      buy: customConfig.stopLossBuy || config.stopLoss.buy,
      sell: customConfig.stopLossSell || config.stopLoss.sell
    }
  };

  // Calculate TP and SL based on action
  const tpMultiplier = action === 'BUY' 
    ? 1 + mergedConfig.takeProfit.buy 
    : 1 - mergedConfig.takeProfit.sell;

  const slMultiplier = action === 'BUY'
    ? 1 - mergedConfig.stopLoss.buy
    : 1 + mergedConfig.stopLoss.sell;

  return {
    tpPrice: parseFloat((entryPrice * tpMultiplier).toFixed(2)),
    slPrice: parseFloat((entryPrice * slMultiplier).toFixed(2)),
    config: mergedConfig
  };
}
  
  module.exports = { validateSignal, calculateTPSL };
  