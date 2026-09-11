# ==============================================================================
# NEURO//NODE • PRODUCTION DOCKERFILE
# Multi-stage minimal footprint build for small VM environments (~1 GB RAM)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Assets
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies using clean install
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source files
COPY tsconfig.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY public/ ./public/
COPY src/ ./src/

# Compile TypeScript and bundle frontend with Vite
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

LABEL org.opencontainers.image.title="NEURO//NODE" \
      org.opencontainers.image.description="Local-First Personal Home Interface & Sync Server" \
      org.opencontainers.image.authors="Pratik Mengal (Neuro) <iampratikmengal@gmail.com>" \
      org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production \
    PORT=8787 \
    HOST=0.0.0.0 \
    DATA_DIR=/app/server/data \
    STATIC_DIR=/app/dist

WORKDIR /app

# Install production dependencies only (including 'ws')
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy server code and compiled frontend
COPY server/ ./server/
COPY --from=builder /app/dist ./dist

# Create persistent state directory and set secure permissions
RUN mkdir -p /app/server/data && \
    chown -R node:node /app

# Switch to non-privileged user for security
USER node

# Expose single-origin port for HTTP static assets, REST API, and WebSocket
EXPOSE 8787

# Declare persistent data volume
VOLUME ["/app/server/data"]

# Lightweight container health check using native Node.js fetch (no curl needed)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8787) + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the unified NEURO//NODE server
CMD ["node", "server/index.mjs"]
