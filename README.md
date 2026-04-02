# Crypto Price WebSocket

A Node.js application that streams live crypto prices from Binance and broadcasts them in real-time to connected clients via Socket.io.

---

## 🚀 Live Deployment

The application is deployed on Render and accessible at:
- **Dashboard**: [https://stackera-no1a.onrender.com/](https://stackera-no1a.onrender.com/)
- **WebSocket URL**: `https://stackera-no1a.onrender.com/` (Path: `/ws`)
- **API**: [https://stackera-no1a.onrender.com/price](https://stackera-no1a.onrender.com/price)

```
Binance WebSocket ──► Binance Listener ──► Socket.io Server ──► Clients
  (btcusdt@ticker)                          ws://stackera-no1a.onrender.com/ws
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
- Visual dashboard served at the root URL
- Docker + Docker Compose support
- Environment variable configuration for easy customization

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
├── .env.example            # Environment variable template
├── render.yaml             # Render deployment configuration
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

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP / WebSocket port |
| `MAX_CLIENTS` | `100` | Max simultaneous Socket.io connections |
| `TRADING_PAIRS` | `btcusdt,ethusdt,bnbusdt` | Comma-separated list of pairs |
| `RECONNECT_DELAY_MS` | `5000` | Delay before reconnecting to Binance |
| `BINANCE_WS_BASE_URL` | `wss://data-stream.binance.com/ws` | Binance WebSocket base URL |

---

## Running Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

### 3. Start the server

```bash
npm start
```

Or with auto-reload during development:

```bash
npm run dev
```

### 4. Open the dashboard

Visit **http://localhost:3000** in your browser to see the live price dashboard.

---

## REST API

### `GET /price`

Returns the latest prices for all pairs.

```bash
curl https://stackera-no1a.onrender.com/price
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

---

## WebSocket (Socket.io)

Connect to `https://stackera-no1a.onrender.com/` with `path: '/ws'`.

### Events received by the client

| Event | Payload | When |
|-------|---------|------|
| `snapshot` | `{ BTCUSDT: {...}, ... }` | On first connect — full current state |
| `priceUpdate` | `{ symbol, lastPrice, changePercent, high24h, low24h, volume24h, timestamp }` | Every new tick |

### Integration Example (Simple UI)

You can easily integrate these live prices into any web page. Here is a minimal HTML example:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Simple Price Tracker</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>
<body>
    <h1>Live BTC Price: <span id="price">Loading...</span></h1>
    <script>
        const socket = io("https://stackera-no1a.onrender.com/", { path: "/ws" });
        socket.on("priceUpdate", (data) => {
            if (data.symbol === "BTCUSDT") {
                document.getElementById("price").innerText = "$" + data.lastPrice.toLocaleString();
            }
        });
    </script>
</body>
</html>
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

---

## License

MIT
