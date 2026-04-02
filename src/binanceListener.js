const WebSocket = require('ws');
const { updatePrice } = require('./priceStore');

// Configuration from environment variables
const PAIRS = (process.env.TRADING_PAIRS || 'btcusdt,ethusdt,bnbusdt').split(',');
const RECONNECT_DELAY_MS = parseInt(process.env.RECONNECT_DELAY_MS || '5000', 10);
const BINANCE_WS_BASE_URL = process.env.BINANCE_WS_BASE_URL || 'wss://stream.binance.com:9443/ws';

/**
 * Parses raw Binance ticker data into a clean object.
 */
function parseTick(tick) {
  return {
    symbol: tick.s,                           // e.g. "BTCUSDT"
    lastPrice: parseFloat(tick.c),            // Current price
    changePercent: parseFloat(tick.P),        // 24h change %
    high24h: parseFloat(tick.h),              // 24h high
    low24h: parseFloat(tick.l),               // 24h low
    volume24h: parseFloat(tick.v),            // 24h base volume
    timestamp: new Date(tick.E || Date.now()).toISOString(),
  };
}

/**
 * Opens a Binance ticker WebSocket for one trading pair.
 * Calls onUpdate(priceData) whenever a new tick arrives.
 */
function connectToBinance(pair, onUpdate) {
  const url = `${BINANCE_WS_BASE_URL}/${pair}@ticker`;

  function connect() {
    const ws = new WebSocket(url);

    ws.on('open', () => {
      console.log(`[Binance] Connected → ${pair.toUpperCase()}`);
    });

    ws.on('message', (raw) => {
      try {
        const tick = JSON.parse(raw);
        const priceData = parseTick(tick);

        updatePrice(priceData.symbol, priceData);
        onUpdate(priceData);
      } catch (err) {
        console.error(`[Binance] Parse error (${pair}):`, err.message);
      }
    });

    ws.on('close', (code) => {
      console.warn(
        `[Binance] ${pair.toUpperCase()} closed (${code}). Reconnecting in ${RECONNECT_DELAY_MS / 1000}s…`
      );
      setTimeout(connect, RECONNECT_DELAY_MS);
    });

    ws.on('error', (err) => {
      console.error(`[Binance] ${pair.toUpperCase()} error:`, err.message);
      ws.terminate(); // triggers 'close' → auto-reconnect
    });
  }

  connect();
}

/**
 * Starts listeners for all configured pairs.
 * @param {function} onUpdate - called with priceData on every tick
 */
function startBinanceListeners(onUpdate) {
  PAIRS.forEach((pair) => connectToBinance(pair, onUpdate));
}

module.exports = { startBinanceListeners, parseTick };
