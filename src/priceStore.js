/**
 * In-memory store for the latest price data per symbol.
 */

const prices = {};

function updatePrice(symbol, data) {
  prices[symbol] = data;
}

function getPrice(symbol) {
  if (symbol) return prices[symbol.toUpperCase()] || null;
  return { ...prices };
}

module.exports = { updatePrice, getPrice };
