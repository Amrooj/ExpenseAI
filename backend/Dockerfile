# ============================================================
# Backend Dockerfile — Multi-Stage Build
# ============================================================
#
# 🎓 TEACHING: Multi-Stage Builds
#
# A Dockerfile can have multiple "stages" separated by FROM.
# Each stage builds on the previous one.
#
# WHY USE MULTI-STAGE?
#   Development needs: tsx, all devDependencies, hot reload
#   Production needs: only compiled JS, only production deps
#
# Without multi-stage, your production image would include
# TypeScript compiler, test frameworks, etc. — wasting hundreds
# of MB and creating unnecessary security attack surface.
#
# RESULT:
#   Development image: ~800MB (includes all tools)
#   Production image:  ~180MB (lean, optimized)
# ============================================================

# ── Stage 1: Base ───────────────────────────────────────────
# Shared foundation for both development and production
FROM node:20-alpine AS base

# Install dumb-init and openssl (required by Prisma engines on Alpine)
# It properly handles Unix signals (SIGTERM, SIGINT) so
# Docker can gracefully shut down your Node.js app
RUN apk add --no-cache dumb-init openssl

# Set working directory inside the container
WORKDIR /app

# ── Stage 2: Dependencies ───────────────────────────────────
# Install ALL dependencies (used by both dev and prod stages)
FROM base AS deps

# Copy package files first (before source code)
# WHY? Docker layer caching — if package.json doesn't change,
# Docker reuses the cached npm install layer on next build.
# This makes rebuilds much faster.
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies including devDependencies
RUN npm ci
# npm ci = clean install (faster, more reliable than npm install)
# It uses package-lock.json exactly — no version surprises

# Generate Prisma client (must happen after install)
RUN npx prisma generate

# ── Stage 3: Development ────────────────────────────────────
FROM base AS development

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

# Run as non-root user (security best practice)
USER node

EXPOSE 3000

# dumb-init handles signal forwarding properly
# tsx watch = hot reload for TypeScript files
CMD ["dumb-init", "npx", "tsx", "watch", "src/server.ts"]

# ── Stage 4: Builder ────────────────────────────────────────
# Compiles TypeScript to JavaScript for production
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run TypeScript compiler — outputs to ./dist
RUN npm run build

# ── Stage 5: Production ─────────────────────────────────────
FROM base AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed for production:
COPY package*.json ./
COPY prisma ./prisma/

# Install ONLY production dependencies (no devDependencies)
# This alone cuts ~200MB from the image
RUN npm ci --only=production && npm install --no-save prisma@5.14.0 && npx prisma generate

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory and change ownership to node user
RUN mkdir -p /app/uploads && chown -R node:node /app

# Run as non-root user
USER node

EXPOSE 3000

CMD ["dumb-init", "sh", "-c", "npx prisma migrate deploy && exec node dist/server.js"]
