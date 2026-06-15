# ── Stage 1: Build ──────────────────────────────────────────────────────────
# Docker context is the repo root (Railway default).
# All paths are relative to the repo root.
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (cache layer)
COPY api/package*.json ./
RUN npm ci

# Copy API source
COPY api/ .

# Compile TypeScript → dist/
RUN npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY api/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/main"]
