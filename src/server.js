const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const { startBinanceListeners } = require('./binanceListener');
const { getPrice } = require('./priceStore');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  path: '/ws',          // WebSocket clients connect at ws://host/ws
  cors: { origin: '*' },
});

const PORT = process.env.PORT || 3000;

// ─── Rate limiting (optional bonus) ──────────────────────────────────────────
const MAX_CLIENTS = parseInt(process.env.MAX_CLIENTS || '100', 10);

io.use((socket, next) => {
  if (io.engine.clientsCount >= MAX_CLIENTS) {
    return next(new Error('Server at capacity'));
  }
  next();
});

// ─── Static dashboard ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── REST API ─────────────────────────────────────────────────────────────────

/**
 * GET /price
 * Returns latest prices for all pairs, or a specific one via ?symbol=BTCUSDT
 */
app.get('/price', (req, res) => {
  const { symbol } = req.query;
  const data = getPrice(symbol);

  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return res.status(404).json({ error: 'No price data available yet' });
  }

  res.json(data);
});

/**
 * GET /health
 * Simple health-check endpoint.
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    connectedClients: io.engine.clientsCount,
    uptime: Math.floor(process.uptime()),
  });
});

// ─── Socket.io ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected    → ${socket.id}  (total: ${io.engine.clientsCount})`);

  // Push a snapshot of all current prices immediately on connect
  const snapshot = getPrice();
  if (Object.keys(snapshot).length > 0) {
    socket.emit('snapshot', snapshot);
  }

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.io] Client disconnected → ${socket.id}  reason: ${reason}`);
  });
});

// ─── Binance feed → broadcast ─────────────────────────────────────────────────

startBinanceListeners((priceData) => {
  // Emit to every connected client
  io.emit('priceUpdate', priceData);
});

// ─── Start ────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log('─────────────────────────────────────────');
  console.log(`  Crypto Price WebSocket Server`);
  console.log(`  HTTP  : http://localhost:${PORT}`);
  console.log(`  WS    : ws://localhost:${PORT}/ws`);
  console.log(`  REST  : http://localhost:${PORT}/price`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log('─────────────────────────────────────────');
});
