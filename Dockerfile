# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy only production deps from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy source
COPY src/       ./src/
COPY public/    ./public/
COPY package.json ./

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

CMD ["node", "src/server.js"]
