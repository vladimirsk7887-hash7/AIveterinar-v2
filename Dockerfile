# ── Build stage ──
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Production stage ──
FROM node:20-alpine
WORKDIR /app

# Only production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built frontend + backend
COPY --from=build /app/dist ./dist
COPY server.js config.yaml ./
COPY config/ ./config/
COPY db/ ./db/
COPY middleware/ ./middleware/
COPY routes/ ./routes/
COPY services/ ./services/
COPY providers/ ./providers/

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
