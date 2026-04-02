const WebSocket = require('ws');
const { updatePrice } = require('./priceStore');

// Configuration from environment variables
const PAIRS = (process.env.TRADING_PAIRS || 'btcusdt,ethusdt,bnbusdt')
  .split(',')
  .map(p => p.trim())
  .filter(p => p.length > 0);
const RECONNECT_DELAY_MS = parseInt(process.env.RECONNECT_DELAY_MS || '5000', 10);
const BINANCE_WS_BASE_URL = (process.env.BINANCE_WS_BASE_URL).trim();

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
  const url = `${BINANCE_WS_BASE_URL}/${pair.toLowerCase()}@ticker`;
  let firstMessageReceived = false;

  function connect() {
    console.log(`[Binance] Attempting connection to: ${url}`);
    const ws = new WebSocket(url);

    ws.on('open', () => {
      console.log(`[Binance] Connection OPENED → ${pair.toUpperCase()}`);
    });

    ws.on('message', (raw) => {
      try {
        const tick = JSON.parse(raw);
        const priceData = parseTick(tick);

        // Log the first message received for each pair to verify data flow
        if (!firstMessageReceived) {
          console.log(`[Binance] First message received for ${pair.toUpperCase()}:`, JSON.stringify(priceData));
          firstMessageReceived = true;
        }

        updatePrice(priceData.symbol, priceData);
        onUpdate(priceData);
      } catch (err) {
        console.error(`[Binance] Parse error (${pair}):`, err.message);
        console.error(`[Binance] Raw payload was:`, raw.toString());
      }
    });

    ws.on('close', (code, reason) => {
      console.warn(
        `[Binance] ${pair.toUpperCase()} connection CLOSED (Code: ${code}, Reason: ${reason || 'none'}). Reconnecting in ${RECONNECT_DELAY_MS / 1000}s…`
      );
      setTimeout(connect, RECONNECT_DELAY_MS);
    });

    ws.on('error', (err) => {
      console.error(`[Binance] ${pair.toUpperCase()} WebSocket ERROR:`, err.message);
      // Terminate triggers 'close' automatically
      ws.terminate();
    });
  }

  connect();
}

/**
 * Starts listeners for all configured pairs.
 * @param {function} onUpdate - called with priceData on every tick
 */
function startBinanceListeners(onUpdate) {
  if (PAIRS.length === 0) {
    console.warn('[Binance] No trading pairs configured to listen to.');
    return;
  }
  console.log(`[Binance] Starting listeners for: ${PAIRS.join(', ')}`);
  PAIRS.forEach((pair) => connectToBinance(pair, onUpdate));
}

module.exports = { startBinanceListeners, parseTick };
