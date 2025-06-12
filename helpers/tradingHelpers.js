function validateSignal(plusDI, minusDI, adx) {
  const isBuySignal = plusDI > 25 && minusDI < 20 && adx > 20;
  const isSellSignal = plusDI < 25 && minusDI > 20 && adx > 20;
  if (isBuySignal) return 'BUY';
  if (isSellSignal) return 'SELL';
  return null;
}

function calculateTPSL(entryPrice, action) {
  const tpMultiplier = action === 'BUY' ? 1.02 : 0.98;
  const slMultiplier = action === 'BUY' ? 0.99 : 1.01;
  return {
    tpPrice: (entryPrice * tpMultiplier).toFixed(2),
    slPrice: (entryPrice * slMultiplier).toFixed(2)
  };
}

module.exports = { validateSignal, calculateTPSL };
