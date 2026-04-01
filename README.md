# Crypto Price WebSocket

A Node.js application that streams live crypto prices from Binance and broadcasts them in real-time to connected clients via Socket.io.

```
Binance WebSocket ──► Binance Listener ──► Socket.io Server ──► Clients
  (btcusdt@ticker)                          ws://localhost:3000/ws
  (ethusdt@ticker)
  (bnbusdt@ticker)
```

---

## Features

- Live prices for **BTC/USDT**, **ETH/USDT**, and **BNB/USDT** from Binance
- Socket.io server broadcasts every tick to all connected clients
- Snapshot of all current prices sent immediately on client connect
- REST API endpoint `GET /price` for HTTP polling
- Auto-reconnect if the Binance stream drops
- Connection limit (default 100 clients, configurable via `MAX_CLIENTS`)
- Visual dashboard served at `http://localhost:3000`
- Docker + Docker Compose support

---

## Project Structure

```
.
├── src/
│   ├── server.js           # Express + Socket.io server
│   ├── binanceListener.js  # Connects to Binance WebSocket streams
│   └── priceStore.js       # In-memory price cache
├── public/
│   └── index.html          # Browser dashboard
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18 or later |
| npm | 9 or later |
| Docker *(optional)* | 20 or later |
| Docker Compose *(optional)* | v2 |

---

## Running Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Start the server

```bash
npm start
```

Or with auto-reload during development:

```bash
npm run dev
```

### 3. Open the dashboard

Visit **http://localhost:3000** in your browser to see the live price dashboard.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP / WebSocket port |
| `MAX_CLIENTS` | `100` | Max simultaneous Socket.io connections |

Set them inline or in a `.env` file (requires `dotenv` if used):

```bash
PORT=8080 MAX_CLIENTS=50 npm start
```

---

## REST API

### `GET /price`

Returns the latest prices for all pairs.

```bash
curl http://localhost:3000/price
```

```json
{
  "BTCUSDT": {
    "symbol": "BTCUSDT",
    "lastPrice": 68432.15,
    "changePercent": 1.42,
    "high24h": 69100.00,
    "low24h": 67200.50,
    "volume24h": 24531,
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  ...
}
```

### `GET /price?symbol=BTCUSDT`

Returns price data for a single symbol.

```bash
curl "http://localhost:3000/price?symbol=ETHUSDT"
```

### `GET /health`

Returns server health and connected client count.

```bash
curl http://localhost:3000/health
```

```json
{ "status": "ok", "connectedClients": 3, "uptime": 142 }
```

---

## WebSocket (Socket.io)

Connect to `ws://localhost:3000` with `path: '/ws'`.

### Events received by the client

| Event | Payload | When |
|-------|---------|------|
| `snapshot` | `{ BTCUSDT: {...}, ... }` | On first connect — full current state |
| `priceUpdate` | `{ symbol, lastPrice, changePercent, high24h, low24h, volume24h, timestamp }` | Every new tick |

### Quick browser test

```js
const socket = io('http://localhost:3000', { path: '/ws' });

socket.on('snapshot', (prices) => console.log('Snapshot:', prices));
socket.on('priceUpdate', (data) => console.log('Tick:', data));
```

### Node.js client example

```js
const { io } = require('socket.io-client');

const socket = io('http://localhost:3000', { path: '/ws' });

socket.on('connect', () => console.log('Connected:', socket.id));
socket.on('priceUpdate', ({ symbol, lastPrice, changePercent }) => {
  console.log(`${symbol}: $${lastPrice} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
});
```

---

## Running with Docker

### Option A — Docker Compose (recommended)

```bash
# Build and start
docker compose up --build

# Run in background
docker compose up --build -d

# Stop
docker compose down
```

The server will be available at **http://localhost:3000**.

### Option B — Docker CLI

```bash
# Build image
docker build -t crypto-price-websocket .

# Run container
docker run -d \
  --name crypto-ws \
  -p 3000:3000 \
  -e MAX_CLIENTS=100 \
  crypto-price-websocket

# View logs
docker logs -f crypto-ws

# Stop and remove
docker stop crypto-ws && docker rm crypto-ws
```

### Change the host port

```bash
# Map to port 8080 on your machine
PORT=8080 docker compose up --build -d
```

---

## Health Check

Docker Compose runs an automatic health check against `GET /health` every 30 seconds.
You can also check manually:

```bash
docker inspect --format='{{.State.Health.Status}}' crypto-ws
```

---

## Supported Trading Pairs

| Pair | Binance Stream |
|------|---------------|
| BTC/USDT | `wss://stream.binance.com:9443/ws/btcusdt@ticker` |
| ETH/USDT | `wss://stream.binance.com:9443/ws/ethusdt@ticker` |
| BNB/USDT | `wss://stream.binance.com:9443/ws/bnbusdt@ticker` |

To add more pairs, edit the `PAIRS` array in [src/binanceListener.js](src/binanceListener.js):

```js
const PAIRS = ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt'];
```

---

## License

MIT
